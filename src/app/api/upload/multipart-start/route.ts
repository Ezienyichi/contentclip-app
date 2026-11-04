import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { UPLOAD_RETENTION_DAYS } from '@/lib/retention';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const PLAN_LIMITS: Record<string, { maxBytes: number; dailyCap: number }> = {
  free:         { maxBytes: 500 * 1024 * 1024,       dailyCap: 3  },
  starter:      { maxBytes: 1024 * 1024 * 1024,      dailyCap: 10 },
  solo:         { maxBytes: 1024 * 1024 * 1024,      dailyCap: 10 },
  pro:          { maxBytes: 1536 * 1024 * 1024,      dailyCap: 10 },
  professional: { maxBytes: 1536 * 1024 * 1024,      dailyCap: 10 },
  agency:       { maxBytes: 2 * 1024 * 1024 * 1024, dailyCap: 25 },
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

  let fileName: string, mimeType: string;
  try {
    const body = await req.json();
    fileName = String(body.file_name ?? '').trim();
    mimeType = String(body.mime_type ?? 'video/mp4');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!fileName) return NextResponse.json({ error: 'file_name is required.' }, { status: 400 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, subscription_status, next_renewal_at')
    .eq('id', user.id)
    .single();

  const isLapsed = (
    profile?.subscription_status === 'cancelled' &&
    !!profile?.next_renewal_at &&
    new Date(profile.next_renewal_at) < new Date()
  );
  const plan = isLapsed ? 'free' : (profile?.plan ?? 'free').toLowerCase();
  const limits = PLAN_LIMITS[plan];
  if (!limits || !Object.keys(UPLOAD_RETENTION_DAYS).includes(plan)) {
    return NextResponse.json({ error: 'Video upload is not available on your current plan.' }, { status: 403 });
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

  const ext    = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : 'mp4';
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'mp4';
  const key    = `uploads/${user.id}/${todayStart.toISOString().slice(0, 10)}/${randomUUID()}.${safeExt}`;

  const { UploadId } = await r2Client().send(new CreateMultipartUploadCommand({
    Bucket:      process.env.R2_BUCKET!,
    Key:         key,
    ContentType: mimeType,
  }));

  return NextResponse.json({ uploadId: UploadId, key });
}
