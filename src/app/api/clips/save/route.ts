import { NextRequest, NextResponse, after } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CLIP_RETENTION_DAYS, retentionExpiryISO } from '@/lib/retention';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Parallel R2 uploads. Each worker holds a whole clip in memory, so keep this
// low — unbounded fan-out is what used to push this route past maxDuration.
const REHOST_CONCURRENCY = 3;

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

  // Respond NOW. The rows already carry the WayinVideo URL, so clips render
  // immediately no matter how many there are. Re-hosting to R2 (permanent)
  // runs after the response and swaps each URL in as its upload lands.
  // WayinVideo URLs are signed CloudFront and stay valid ~15-24h, so they are
  // the fallback for anything the background pass doesn't reach.
  const response = NextResponse.json({ savedClips });

  // Check R2 env vars before attempting uploads
  const missingR2 = (['CLOUDFLARE_R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const)
    .filter(k => !process.env[k]);
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

  after(async () => {
    const s3 = r2Client();
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const queue = [...jobs];
    let ok = 0, failed = 0;

    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
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
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(REHOST_CONCURRENCY, queue.length) }, worker)
    );

    console.log(`[clips/save] R2 rehost done: ok=${ok} failed=${failed} skipped=${skipped} total=${savedClips.length}`);
  });

  return response;
}
