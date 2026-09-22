// Re-hosting clips from WayinVideo (signed CloudFront, short-lived) to R2
// (permanent, governed by the R2 lifecycle rule — see src/lib/retention.ts).
//
// Shared by:
//   - api/clips/save        — background pass right after clips are created
//   - api/admin/rehost-orphans — rescue pass for rows that never got re-hosted

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { SupabaseClient } from '@supabase/supabase-js';

export const R2_ENV_KEYS = [
  'CLOUDFLARE_R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
] as const;

/** Env vars required for re-hosting that are currently unset. */
export function missingR2Env(): string[] {
  return R2_ENV_KEYS.filter(k => !process.env[k]);
}

/** One client instance, shared across all parallel uploads in a pass. */
export function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * True if `url` already points at our R2 public domain — i.e. nothing to do.
 * Compared on origin, not raw prefix, so a trailing slash or a path segment in
 * R2_PUBLIC_URL doesn't produce false negatives.
 */
export function isR2Url(url: string): boolean {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url) return false;
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * Download a clip from its current URL and put it in R2.
 * Returns the public R2 URL, or null on any failure (caller keeps the old URL).
 */
export async function rehostToR2(
  s3: S3Client,
  sourceUrl: string,
  userId: string,
  clipId: string,
): Promise<string | null> {
  try {
    console.log(`[rehostToR2] clip=${clipId} downloading ${sourceUrl.slice(0, 100)}`);
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error(`[rehostToR2] clip=${clipId} download HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const contentType = res.headers.get('content-type') ?? 'video/mp4';
    const today = new Date().toISOString().slice(0, 10);
    const key = `clips/${userId}/${today}/${clipId}.mp4`;
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`[rehostToR2] clip=${clipId} downloaded ${buffer.length} bytes → uploading key=${key}`);

    await s3.send(new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET!,
      Key:           key,
      Body:          buffer,
      ContentType:   contentType,
      ContentLength: buffer.length,
    }));

    const r2Url = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`[rehostToR2] clip=${clipId} success → ${r2Url}`);
    return r2Url;
  } catch (err) {
    console.error(`[rehostToR2] clip=${clipId} threw:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Sweep ────────────────────────────────────────────────────────────────────
// Shared by api/cron/rehost-sweep and api/admin/rehost-orphans so the two can't
// drift. Finds clips still pointing at an expiring WayinVideo/CloudFront URL
// and pulls them into R2, newest-urgent-first, within a time budget.

/** Only sweep clips this recent — older signed URLs are already dead, and
 *  retrying them would burn the batch on guaranteed failures. Also what keeps
 *  a permanently-failing row from blocking the head of the queue forever: it
 *  ages out of the window on its own. */
export const SWEEP_MAX_AGE_HOURS = 20;

export const SWEEP_BATCH = 12;
export const SWEEP_CONCURRENCY = 3;

export interface SweepOptions {
  db: SupabaseClient;
  batch?: number;
  maxAgeHours?: number;
  concurrency?: number;
  /** Epoch ms after which no new upload is started (the in-flight ones finish). */
  deadlineAt?: number;
  /** Log prefix, e.g. '[rehost-sweep]'. */
  label?: string;
}

export interface SweepResult {
  /** Orphans found in the window (not just this batch). */
  scanned: number;
  rehosted: number;
  failed: number;
  /** Orphans still left after this pass — drives chaining / repeat calls. */
  remaining: number;
  hitDeadline: boolean;
}

export async function sweepOrphanClips(opts: SweepOptions): Promise<SweepResult> {
  const {
    db,
    batch       = SWEEP_BATCH,
    maxAgeHours = SWEEP_MAX_AGE_HOURS,
    concurrency = SWEEP_CONCURRENCY,
    deadlineAt,
    label       = '[sweep]',
  } = opts;

  const since = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();

  const { data: rows, error } = await db
    .from('clips')
    .select('id, user_id, video_url, download_url, created_at')
    .neq('status', 'error')
    .not('video_url', 'is', null)
    .gt('created_at', since)
    .order('created_at', { ascending: true })   // oldest in window = closest to expiry
    .limit(500);

  if (error) throw new Error(`sweep query failed: ${error.message}`);

  // The R2-vs-not test runs in JS via isR2Url so the origin comparison matches
  // exactly what clips/save writes; a SQL LIKE would miss trailing-slash and
  // path variations in R2_PUBLIC_URL.
  const orphans = (rows ?? []).filter(
    r => typeof r.video_url === 'string'
      && r.video_url.startsWith('http')
      && !isR2Url(r.video_url)
  );

  const queue = orphans.slice(0, batch);
  const s3 = r2Client();
  let rehosted = 0, failed = 0, hitDeadline = false;

  const worker = async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      if (deadlineAt && Date.now() > deadlineAt) {
        hitDeadline = true;
        return;   // leave the rest queued for the next pass
      }

      const r2Url = await rehostToR2(s3, row.video_url, row.user_id, row.id);
      if (!r2Url) {
        console.warn(`${label} clip=${row.id} rehost failed — left for next pass`);
        failed++;
        continue;
      }

      // Only repoint download_url if it is also on an expiring host; one
      // already on R2 belongs to something else and stays put.
      const patch: Record<string, string> = { video_url: r2Url };
      if (!row.download_url || !isR2Url(row.download_url)) {
        patch.download_url = r2Url;
      }

      const { error: updErr } = await db.from('clips').update(patch).eq('id', row.id);
      if (updErr) {
        console.error(`${label} clip=${row.id} DB update failed:`, updErr.message);
        failed++;
      } else {
        rehosted++;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, worker)
  );

  const remaining = orphans.length - rehosted;
  console.log(
    `${label} scanned=${orphans.length} rehosted=${rehosted} failed=${failed} ` +
    `remaining=${remaining} deadline=${hitDeadline}`
  );

  return { scanned: orphans.length, rehosted, failed, remaining, hitDeadline };
}

// ── Chaining ─────────────────────────────────────────────────────────────────
// Vercel Hobby caps cron at once per day, which is far too slow to beat the
// WayinVideo URL expiry. Instead each pass hands off to the next with a fresh
// 60s function budget, so a 40-clip job drains in a few minutes. The daily
// cron in vercel.json is only a backstop.

/** Hard cap on hops so a persistent failure can't loop forever. */
export const SWEEP_MAX_HOPS = 6;

function appBaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

/**
 * Fire the next sweep pass. Fire-and-forget: never throws, never awaited for
 * its body — the caller is already out of budget, which is why it is chaining.
 */
export async function triggerSweep(hop: number, label = '[sweep]'): Promise<void> {
  if (hop > SWEEP_MAX_HOPS) {
    console.warn(`${label} hop cap ${SWEEP_MAX_HOPS} reached — leaving the rest to the daily cron`);
    return;
  }

  const base = appBaseUrl();
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.warn(`${label} cannot chain: ${!base ? 'no NEXT_PUBLIC_APP_URL/VERCEL_URL' : 'no CRON_SECRET'}`);
    return;
  }

  try {
    // The sweep route acknowledges immediately and does its work in its own
    // after(), so this resolves in milliseconds — we are never aborting a
    // long-running request, which could otherwise tear down the next pass.
    const res = await fetch(`${base}/api/cron/rehost-sweep?hop=${hop}`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`${label} chained to sweep hop=${hop} → ${res.status}`);
  } catch (err) {
    console.error(`${label} chain to hop=${hop} failed:`, err instanceof Error ? err.message : String(err));
  }
}
