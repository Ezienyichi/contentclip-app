import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  S3Client,
  CompleteMultipartUploadCommand,
  HeadObjectCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { UPLOAD_RETENTION_DAYS, uploadRetentionDays, retentionExpiryISO } from '@/lib/retention';

export const dynamic = 'force-dynamic';

const PLAN_MAX_BYTES: Record<string, number> = {
  free:         500 * 1024 * 1024,
  starter:      1024 * 1024 * 1024,
  solo:         1024 * 1024 * 1024,
  pro:          1536 * 1024 * 1024,
  professional: 1536 * 1024 * 1024,
  agency:       2 * 1024 * 1024 * 1024,
};

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
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
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let key: string, uploadId: string, parts: { PartNumber: number; ETag: string }[];
  let fileName: string, fileSize: number, title: string;
  try {
    const body  = await req.json();
    key        = String(body.key       ?? '').trim();
    uploadId   = String(body.uploadId  ?? '').trim();
    parts      = Array.isArray(body.parts) ? body.parts : [];
    fileName   = String(body.file_name ?? '').trim();
    fileSize   = Number(body.file_size ?? 0);
    title      = String(body.title     ?? fileName).slice(0, 500);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!key || !uploadId || parts.length === 0 || !fileName) {
    return NextResponse.json({ error: 'key, uploadId, parts, and file_name are required.' }, { status: 400 });
  }

  if (!key.startsWith(`uploads/${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 403 });
  }

  // Validate parts shape
  const sanitizedParts = parts
    .map((p: any) => ({ PartNumber: Number(p.PartNumber), ETag: String(p.ETag ?? '') }))
    .filter(p => p.PartNumber >= 1 && p.PartNumber <= 10000 && p.ETag);

  if (sanitizedParts.length === 0) {
    return NextResponse.json({ error: 'No valid parts provided.' }, { status: 400 });
  }

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
  if (!Object.keys(UPLOAD_RETENTION_DAYS).includes(plan)) {
    return NextResponse.json({ error: 'Video upload is not available on your current plan.' }, { status: 403 });
  }

  const s3 = r2Client();

  // Complete the multipart upload
  try {
    await s3.send(new CompleteMultipartUploadCommand({
      Bucket:            process.env.R2_BUCKET!,
      Key:               key,
      UploadId:          uploadId,
      MultipartUpload:   { Parts: sanitizedParts },
    }));
  } catch (err) {
    console.error('[multipart-complete] CompleteMultipartUpload failed', err);
    // Abort the incomplete upload to free storage
    await s3.send(new AbortMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!, Key: key, UploadId: uploadId,
    })).catch(() => {});
    return NextResponse.json({ error: 'Failed to assemble upload. Please try again.' }, { status: 500 });
  }

  // Verify actual size from R2
  let actualBytes: number;
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
    actualBytes = head.ContentLength ?? 0;
  } catch {
    return NextResponse.json({ error: 'Could not verify assembled file. Please try again.' }, { status: 400 });
  }

  const maxBytes = PLAN_MAX_BYTES[plan] ?? PLAN_MAX_BYTES.free;
  if (actualBytes > maxBytes) {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })).catch(() => {});
    const limitGb = (maxBytes / 1024 / 1024 / 1024).toFixed(1);
    return NextResponse.json({ error: `File exceeds the ${limitGb}GB limit for your plan. Upload removed.` }, { status: 400 });
  }

  const retentionDays = uploadRetentionDays(plan)!;
  const publicUrl     = `${process.env.R2_PUBLIC_URL}/${key}`;
  const deleteAfter   = retentionExpiryISO(retentionDays);

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
    console.error('[multipart-complete] DB error', insertErr);
    return NextResponse.json({ error: 'Failed to save clip.' }, { status: 500 });
  }

  return NextResponse.json({ clip_id: clip.id, video_url: publicUrl });
}
