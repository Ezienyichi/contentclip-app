import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      videoUrl,
      limit = 5,
      ratio = 'RATIO_9_16',
      enableCaption = true,
      enableReframe = true,
      resolution = 'HD_1080',
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required.' }, { status: 400 });
    }

    const serverResponse = await fetch(`${BACKEND_API_URL}/api/process-youtube-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        userId: user.id,
        limit,
        ratio,
        enableCaption,
        enableReframe,
        resolution,
      }),
    });

    const data = await serverResponse.json();
    return NextResponse.json(data, { status: serverResponse.status });

  } catch (error: any) {
    console.error('process-youtube-v2 error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
