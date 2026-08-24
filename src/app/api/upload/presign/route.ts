import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const PLAN_LIMITS: Record<string, { maxBytes: number; dailyCap: number }> = {
  pro:          { maxBytes: 100 * 1024 * 1024, dailyCap: 10 },
  professional: { maxBytes: 100 * 1024 * 1024, dailyCap: 10 },
  agency:       { maxBytes: 200 * 1024 * 1024, dailyCap: 25 },
};

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

  let fileName: string, fileSize: number, mimeType: string;
  try {
    const body = await req.json();
    fileName = String(body.file_name ?? '').trim();
    fileSize = Number(body.file_size);
    mimeType = String(body.mime_type ?? 'video/mp4');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!fileName || !fileSize || fileSize <= 0) {
    return NextResponse.json({ error: 'file_name and file_size are required.' }, { status: 400 });
  }

  // Fetch plan from profiles (admin client to bypass RLS)
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
  const limits = PLAN_LIMITS[plan];
  if (!limits) {
    return NextResponse.json({ error: 'Video upload is available on Pro and Agency plans.' }, { status: 403 });
  }

  if (fileSize > limits.maxBytes) {
    const mb = Math.round(limits.maxBytes / 1024 / 1024);
    return NextResponse.json({ error: `File exceeds ${mb}MB limit for your plan.` }, { status: 400 });
  }

  // Check daily cap
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from('clips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source', 'upload')
    .gte('created_at', todayStart.toISOString());

  if ((count ?? 0) >= limits.dailyCap) {
    return NextResponse.json({ error: `Daily upload limit of ${limits.dailyCap} reached.` }, { status: 429 });
  }

  // Build object key
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : 'mp4';
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'mp4';
  const key = `uploads/${user.id}/${todayStart.toISOString().slice(0, 10)}/${randomUUID()}.${safeExt}`;

  const url = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET!,
      Key:           key,
      ContentType:   mimeType,
      ContentLength: fileSize,
    }),
    { expiresIn: 900 } // 15 minutes
  );

  return NextResponse.json({ upload_url: url, key });
}
