import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { isR2Url } from '@/lib/rehost';

export const dynamic = 'force-dynamic';

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

function r2KeyFromUrl(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url) return null;
  try {
    if (new URL(url).origin !== new URL(base).origin) return null;
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: clip, error: fetchError } = await admin
    .from('clips')
    .select('id, user_id, video_url, download_url')
    .eq('id', id)
    .single();

  if (fetchError || !clip) {
    return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });
  }
  if (clip.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { error: deleteError } = await admin.from('clips').delete().eq('id', id);
  if (deleteError) {
    console.error('[clips/delete] DB error', deleteError);
    return NextResponse.json({ error: 'Failed to delete clip.' }, { status: 500 });
  }

  // Delete R2 objects best-effort — DB row is already gone, don't fail the response
  const urls = [...new Set([clip.video_url, clip.download_url].filter(Boolean))] as string[];
  const r2Keys = urls
    .filter(url => isR2Url(url))
    .map(url => r2KeyFromUrl(url))
    .filter((k): k is string => k !== null);

  if (r2Keys.length && process.env.R2_BUCKET) {
    const s3 = r2Client();
    await Promise.allSettled(
      r2Keys.map(key =>
        s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }))
      )
    );
  }

  return NextResponse.json({ deleted: true });
}
