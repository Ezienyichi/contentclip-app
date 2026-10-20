import { NextRequest, NextResponse, after } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { CLIP_RETENTION_DAYS, retentionExpiryISO } from '@/lib/retention';
import { r2Client, rehostToR2, missingR2Env, triggerSweep } from '@/lib/rehost';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const execFileP = promisify(execFile);

async function generateThumbnailFromR2(
  admin: SupabaseClient,
  clipId: string,
  userId: string,
  videoUrl: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegBin = require('ffmpeg-static') as string;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thumb-'));
  const videoPath = path.join(tmpDir, 'video.mp4');
  const framePath = path.join(tmpDir, 'frame.jpg');
  try {
    const res = await fetch(videoUrl, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) throw new Error(`video fetch ${res.status}`);
    await fs.writeFile(videoPath, Buffer.from(await res.arrayBuffer()));

    const args = ['-ss', '1', '-i', videoPath, '-frames:v', '1', '-q:v', '3', '-y', framePath];
    await execFileP(ffmpegBin, args, { timeout: 20_000 }).catch(() =>
      execFileP(ffmpegBin, ['-ss', '0.1', '-i', videoPath, '-frames:v', '1', '-q:v', '3', '-y', framePath], { timeout: 20_000 })
    );

    const jpegBuf = await fs.readFile(framePath);
    const today   = new Date().toISOString().slice(0, 10);
    const key     = `thumbnails/${userId}/${today}/${clipId}.jpg`;
    await r2Client().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!, Key: key, Body: jpegBuf,
      ContentType: 'image/jpeg', ContentLength: jpegBuf.length,
    }));
    const thumbnail_url = `${process.env.R2_PUBLIC_URL}/${key}`;
    await admin.from('clips').update({ thumbnail_url }).eq('id', clipId);
    console.log(`[clips/save] thumbnail generated for clip=${clipId}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Parallel R2 uploads. Each worker holds a whole clip in memory, so keep this
// low — unbounded fan-out is what used to push this route past maxDuration.
const REHOST_CONCURRENCY = 3;

// Stop starting new uploads with ~15s left. Whatever is still queued is handed
// to the sweeper, which picks it up with a fresh 60s budget — see lib/rehost.
const REHOST_BUDGET_MS = 45_000;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let clips: any[], source_video_name: string;
  try {
    const body = await req.json();
    clips = Array.isArray(body.clips) ? body.clips : [];
    source_video_name = String(body.source_video_name ?? '').slice(0, 500);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (clips.length === 0) return NextResponse.json({ savedClips: [] });

  // Must match the R2 lifecycle rule so object and DB row expire together.
  // See src/lib/retention.ts — R2 is currently still at 14 days while the old
  // 14-day clips drain; lowering it there is the last step.
  const expiresAt = retentionExpiryISO(CLIP_RETENTION_DAYS);

  const rows = clips.map((c: any) => ({
    user_id:           user.id,
    project_id:        null,
    title:             String(c.title || 'Clip').slice(0, 500),
    hook_text:         String(c.caption || c.hook_text || '').slice(0, 1000),
    start_time:        Number(c.start_time ?? 0),
    end_time:          Number(c.end_time ?? 60),
    virality_score:    Math.min(100, Math.max(0, Math.round(Number(c.ai_score ?? c.virality_score ?? 80)))),
    suggested_caption: String(c.caption || c.suggested_caption || '').slice(0, 2000),
    hashtags:          Array.isArray(c.hashtags) ? c.hashtags : [],
    status:            'ready',
    video_url:         String(c.video_url || c.clip_url || '').slice(0, 2000),
    download_url:      String(c.download_url || '').slice(0, 2000),
    thumbnail_url:     String(c.thumbnail_url || '').slice(0, 2000),
    source_video_name,
    expires_at:        expiresAt,
    delete_after:      expiresAt,
  }));

  const { data, error } = await supabase
    .from('clips')
    .insert(rows)
    .select('id');

  if (error) {
    console.error('[clips/save] DB error', error);
    return NextResponse.json({ error: 'Failed to save clips.' }, { status: 500 });
  }

  const savedClips = data ?? [];

  // Respond NOW. The rows already carry the WayinVideo URL, so clips render
  // immediately no matter how many there are. Re-hosting to R2 (permanent)
  // runs after the response and swaps each URL in as its upload lands.
  // WayinVideo URLs are signed CloudFront and stay valid ~15-24h, so they are
  // the fallback for anything the background pass doesn't reach.
  const response = NextResponse.json({ savedClips });

  // Check R2 env vars before attempting uploads
  const missingR2 = missingR2Env();
  if (missingR2.length) {
    console.error('[clips/save] MISSING R2 env vars — rehost skipped:', missingR2.join(', '));
    return response;
  }
  console.log('[clips/save] R2 env OK, bucket:', process.env.R2_BUCKET, 'pubUrl:', process.env.R2_PUBLIC_URL);

  // Pair each new row id with the URL it was inserted with up front, so the
  // background pass never depends on savedClips/rows index alignment.
  const jobs = savedClips
    .map((saved, i) => ({ id: saved.id as string, wainUrl: rows[i]?.video_url ?? '' }))
    .filter(j => j.wainUrl.startsWith('http'));

  const skipped = savedClips.length - jobs.length;
  if (skipped > 0) {
    console.warn(`[clips/save] ${skipped} clip(s) had no valid video_url to rehost — skipping`);
  }

  const deadlineAt = Date.now() + REHOST_BUDGET_MS;

  after(async () => {
    const s3 = r2Client();
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const queue = [...jobs];
    let ok = 0, failed = 0, hitDeadline = false;

    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        if (Date.now() > deadlineAt) {
          hitDeadline = true;
          return;   // the sweeper takes it from here
        }

        const r2Url = await rehostToR2(s3, job.wainUrl, user.id, job.id);
        if (!r2Url) {
          console.warn(`[clips/save] clip=${job.id} rehost returned null — WayinVideo URL kept as fallback`);
          failed++;
          continue;
        }

        const { error: updateErr } = await admin
          .from('clips')
          .update({ video_url: r2Url, download_url: r2Url })
          .eq('id', job.id);

        if (updateErr) {
          console.error(`[clips/save] clip=${job.id} DB update after rehost failed:`, updateErr.message);
          failed++;
        } else {
          ok++;
          // Generate thumbnail if clip doesn't already have one
          const { data: clipRow } = await admin.from('clips').select('thumbnail_url').eq('id', job.id).single();
          if (!clipRow?.thumbnail_url) {
            await generateThumbnailFromR2(admin, job.id, user.id, r2Url).catch(e =>
              console.warn(`[clips/save] thumbnail gen for clip=${job.id} failed:`, e instanceof Error ? e.message : String(e))
            );
          }
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(REHOST_CONCURRENCY, queue.length) }, worker)
    );

    console.log(
      `[clips/save] R2 rehost done: ok=${ok} failed=${failed} skipped=${skipped} ` +
      `total=${savedClips.length} deadline=${hitDeadline}`
    );

    // Anything not re-hosted here still has an expiring WayinVideo URL. Hand
    // off to the sweeper, which starts at a fresh 60s budget and chains until
    // there is nothing left in the window.
    if (hitDeadline || failed > 0) {
      await triggerSweep(1, '[clips/save]');
    }
  });

  return response;
}
