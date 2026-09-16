import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CLIP_RETENTION_DAYS, retentionExpiryISO } from '@/lib/retention';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One client instance shared across all parallel uploads in this request
function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function rehostToR2(
  s3: S3Client,
  wainUrl: string,
  userId: string,
  clipId: string,
): Promise<string | null> {
  try {
    console.log(`[rehostToR2] clip=${clipId} downloading ${wainUrl.slice(0, 100)}`);
    const res = await fetch(wainUrl, { signal: AbortSignal.timeout(30_000) });
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

  // Re-host each clip from WayinVideo (signed CloudFront, expires ~15-24h) to R2 (permanent).
  // URL is guaranteed fresh here — clips/save fires within seconds of SUCCEEDED.
  // On failure, the WayinVideo URL stays as fallback (valid for the next ~15-24h).

  // Check R2 env vars before attempting uploads
  const missingR2 = (['CLOUDFLARE_R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const)
    .filter(k => !process.env[k]);
  if (missingR2.length) {
    console.error('[clips/save] MISSING R2 env vars — rehost skipped:', missingR2.join(', '));
    return NextResponse.json({ savedClips });
  }
  console.log('[clips/save] R2 env OK, bucket:', process.env.R2_BUCKET, 'pubUrl:', process.env.R2_PUBLIC_URL);

  const s3 = r2Client();
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let ok = 0, skipped = 0, failed = 0;
  await Promise.allSettled(
    savedClips.map(async (saved, i) => {
      const wainUrl = rows[i]?.video_url;
      if (!wainUrl || !wainUrl.startsWith('http')) {
        console.warn(`[clips/save] clip=${saved.id} no valid video_url to rehost — skipping`);
        skipped++;
        return;
      }

      const r2Url = await rehostToR2(s3, wainUrl, user.id, saved.id);
      if (!r2Url) {
        console.warn(`[clips/save] clip=${saved.id} rehost returned null — WayinVideo URL kept as fallback`);
        failed++;
        return;
      }

      const { error: updateErr } = await admin
        .from('clips')
        .update({ video_url: r2Url, download_url: r2Url })
        .eq('id', saved.id);

      if (updateErr) {
        console.error(`[clips/save] clip=${saved.id} DB update after rehost failed:`, updateErr.message);
        failed++;
      } else {
        ok++;
      }
    })
  );

  console.log(`[clips/save] R2 rehost done: ok=${ok} failed=${failed} skipped=${skipped} total=${savedClips.length}`);

  return NextResponse.json({ savedClips });
}
