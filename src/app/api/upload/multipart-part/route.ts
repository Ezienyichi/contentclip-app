import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';

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

  let key: string, uploadId: string, partNumber: number;
  try {
    const body  = await req.json();
    key         = String(body.key      ?? '').trim();
    uploadId    = String(body.uploadId ?? '').trim();
    partNumber  = Number(body.partNumber);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!key || !uploadId || !partNumber || partNumber < 1 || partNumber > 10000) {
    return NextResponse.json({ error: 'key, uploadId, and partNumber (1-10000) are required.' }, { status: 400 });
  }

  // Validate key belongs to this user (key was issued by multipart-start, same user)
  if (!key.startsWith(`uploads/${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 403 });
  }

  const url = await getSignedUrl(
    r2Client(),
    new UploadPartCommand({
      Bucket:     process.env.R2_BUCKET!,
      Key:        key,
      UploadId:   uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 300 } // 5 minutes per part
  );

  return NextResponse.json({ url });
}
