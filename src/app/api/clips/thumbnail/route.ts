import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { r2Client, isR2Url } from '@/lib/rehost';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

const execFileP = promisify(execFile);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extract a single JPEG frame at `seekSecs` from a local file path via ffmpeg-static.
async function extractFrame(videoPath: string, seekSecs: number, outPath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegBin = require('ffmpeg-static') as string;
  await execFileP(ffmpegBin, [
    '-ss', String(seekSecs),
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '3',
    '-y',
    outPath,
  ], { timeout: 20_000 });
}

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
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let clip_id: string;
  try { clip_id = String((await req.json()).clip_id ?? ''); }
  catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }
  if (!clip_id) return NextResponse.json({ error: 'clip_id required.' }, { status: 400 });

  const { data: clip } = await supabase
    .from('clips')
    .select('id, user_id, video_url, thumbnail_url')
    .eq('id', clip_id)
    .eq('user_id', user.id)
    .single();

  if (!clip) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  // Skip if already has a thumbnail on R2
  if (clip.thumbnail_url && isR2Url(clip.thumbnail_url)) {
    return NextResponse.json({ thumbnail_url: clip.thumbnail_url, skipped: true });
  }

  const videoUrl = clip.video_url;
  if (!videoUrl) return NextResponse.json({ error: 'Clip has no video URL.' }, { status: 409 });

  // Check R2 env
  const missing = ['CLOUDFLARE_R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET','R2_PUBLIC_URL'].filter(k => !process.env[k]);
  if (missing.length > 0) return NextResponse.json({ error: 'R2 not configured.' }, { status: 500 });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thumb-'));
  const videoPath = path.join(tmpDir, 'video.mp4');
  const framePath = path.join(tmpDir, 'frame.jpg');

  try {
    // Download video
    const vRes = await fetch(videoUrl, { signal: AbortSignal.timeout(25_000) });
    if (!vRes.ok) return NextResponse.json({ error: `Video fetch failed (${vRes.status}).` }, { status: 502 });
    const buf = Buffer.from(await vRes.arrayBuffer());
    await fs.writeFile(videoPath, buf);

    // Extract frame at 1 second (fall back to 0.1s for very short clips)
    await extractFrame(videoPath, 1, framePath).catch(() => extractFrame(videoPath, 0.1, framePath));

    // Upload to R2
    const jpegBuf  = await fs.readFile(framePath);
    const today    = new Date().toISOString().slice(0, 10);
    const key      = `thumbnails/${user.id}/${today}/${clip_id}.jpg`;
    const s3       = r2Client();
    await s3.send(new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET!,
      Key:           key,
      Body:          jpegBuf,
      ContentType:   'image/jpeg',
      ContentLength: jpegBuf.length,
    }));

    const thumbnail_url = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Update DB
    await supabaseAdmin.from('clips').update({ thumbnail_url }).eq('id', clip_id);

    return NextResponse.json({ thumbnail_url });
  } catch (err) {
    console.error('[clips/thumbnail] error', err);
    return NextResponse.json({ error: 'Thumbnail generation failed.' }, { status: 500 });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
