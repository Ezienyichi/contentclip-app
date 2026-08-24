import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const PLAN_RETENTION: Record<string, number> = {
  pro:          3,
  professional: 3,
  agency:       14,
};
const PLAN_MAX_BYTES: Record<string, number> = {
  pro:          100 * 1024 * 1024,
  professional: 100 * 1024 * 1024,
  agency:       200 * 1024 * 1024,
};
const PLAN_ALLOWED = new Set(Object.keys(PLAN_RETENTION));

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

  let key: string, fileName: string, fileSize: number, title: string;
  try {
    const body = await req.json();
    key      = String(body.key ?? '').trim();
    fileName = String(body.file_name ?? '').trim();
    fileSize = Number(body.file_size ?? 0);
    title    = String(body.title ?? fileName).slice(0, 500);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!key || !fileName) {
    return NextResponse.json({ error: 'key and file_name are required.' }, { status: 400 });
  }

  // Re-verify plan server-side
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan ?? 'free').toLowerCase();
  if (!PLAN_ALLOWED.has(plan)) {
    return NextResponse.json({ error: 'Video upload is available on Pro and Agency plans.' }, { status: 403 });
  }

  // Validate key belongs to this user
  if (!key.startsWith(`uploads/${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 403 });
  }

  // Verify actual object size from R2 — client-reported file_size cannot be trusted
  const s3 = r2Client();
  let actualBytes: number;
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    actualBytes = head.ContentLength ?? 0;
  } catch {
    return NextResponse.json({ error: 'Could not verify uploaded file. Please try again.' }, { status: 400 });
  }

  const maxBytes = PLAN_MAX_BYTES[plan];
  if (actualBytes > maxBytes) {
    // Delete the oversized object from R2 before rejecting
    try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })); } catch {}
    const mb = Math.round(maxBytes / 1024 / 1024);
    return NextResponse.json({ error: `File exceeds ${mb}MB limit for your plan. Upload removed.` }, { status: 400 });
  }

  const retentionDays = PLAN_RETENTION[plan];
  const publicUrl   = `${process.env.R2_PUBLIC_URL}/${key}`;
  const deleteAfter = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: clip, error: insertErr } = await admin
    .from('clips')
    .insert({
      user_id:           user.id,
      title,
      status:            'ready',
      video_url:         publicUrl,
      download_url:      publicUrl,
      source:            'upload',
      source_video_name: fileName,
      file_size_bytes:   actualBytes || null,
      retention_days:    retentionDays,
      delete_after:      deleteAfter,
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[upload/complete] DB error', insertErr);
    return NextResponse.json({ error: 'Failed to save clip.' }, { status: 500 });
  }

  return NextResponse.json({ clip_id: clip.id, video_url: publicUrl });
}
