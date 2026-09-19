import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/adminAuth';
import { r2Client, rehostToR2, isR2Url, missingR2Env } from '@/lib/rehost';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Rescue pass for clips still pointing at a WayinVideo/CloudFront URL instead
// of R2 — rows whose re-host never ran or was cut off by a timeout. Those URLs
// are signed and expire, so the row outlives its file unless we pull it over.
//
// Batched and idempotent: each call takes the oldest N orphans (closest to
// expiry), re-hosts them, and reports how many remain. Call it repeatedly
// until `remaining` is 0. Anything that fails is simply left for the next run.
//
// Auth: admin session, or `Authorization: Bearer $CRON_SECRET`.
//
//   curl -X POST https://<host>/api/admin/rehost-orphans \
//     -H "Authorization: Bearer $CRON_SECRET"

const DEFAULT_BATCH = 8;
const MAX_BATCH = 20;
const CONCURRENCY = 3;

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true;
  }
  const { isAdmin } = await checkAdminAuth();
  return isAdmin;
}

export async function POST(req: NextRequest) {
  if (!await authorize(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const missing = missingR2Env();
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing R2 env vars: ${missing.join(', ')}` },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const batch = Math.min(
    MAX_BATCH,
    Math.max(1, Number(url.searchParams.get('batch')) || DEFAULT_BATCH)
  );
  const dryRun = url.searchParams.get('dry') === '1';

  const db = adminSupabase();

  // Candidates: not expired, has an http URL. The R2-vs-not test is done in JS
  // via isR2Url so the origin comparison matches what clips/save writes —
  // a LIKE on the public URL would miss trailing-slash / path variations.
  const { data: rows, error } = await db
    .from('clips')
    .select('id, user_id, video_url, download_url, created_at, expires_at')
    .neq('status', 'error')
    .not('video_url', 'is', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })   // oldest first = closest to expiry
    .limit(500);

  if (error) {
    console.error('[rehost-orphans] DB error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orphans = (rows ?? []).filter(
    r => typeof r.video_url === 'string'
      && r.video_url.startsWith('http')
      && !isR2Url(r.video_url)
  );

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      orphansFound: orphans.length,
      wouldProcess: Math.min(batch, orphans.length),
      oldest: orphans.slice(0, 5).map(o => ({
        id: o.id,
        created_at: o.created_at,
        expires_at: o.expires_at,
        host: (() => { try { return new URL(o.video_url).host; } catch { return '?'; } })(),
      })),
    });
  }

  const queue = orphans.slice(0, batch);
  const s3 = r2Client();
  let ok = 0, failed = 0;

  const worker = async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      const r2Url = await rehostToR2(s3, row.video_url, row.user_id, row.id);
      if (!r2Url) {
        console.warn(`[rehost-orphans] clip=${row.id} rehost failed — left for next run`);
        failed++;
        continue;
      }

      // download_url is only repointed if it too is on an expiring host — a
      // download_url already on R2 is somebody else's and stays put.
      const patch: Record<string, string> = { video_url: r2Url };
      if (!row.download_url || !isR2Url(row.download_url)) {
        patch.download_url = r2Url;
      }

      const { error: updErr } = await db.from('clips').update(patch).eq('id', row.id);
      if (updErr) {
        console.error(`[rehost-orphans] clip=${row.id} DB update failed:`, updErr.message);
        failed++;
      } else {
        ok++;
      }
    }
  };

  const started = Math.min(batch, orphans.length);
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, started) }, worker)
  );

  const remaining = orphans.length - ok;
  console.log(`[rehost-orphans] ok=${ok} failed=${failed} remaining=${remaining}`);

  return NextResponse.json({
    processed: started,
    rehosted: ok,
    failed,
    remaining,
    done: remaining === 0,
  });
}
