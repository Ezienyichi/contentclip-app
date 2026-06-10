import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL!;

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
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const body = await req.json();
  const {
    clipId,
    platforms,
    caption,
    hashtags,
    scheduleTime,
    videoUrl,
    title,
  } = body;

  if (!platforms || platforms.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one platform.' },
      { status: 400 }
    );
  }

  try {
    const makePayload = {
      userId: user.id,
      userEmail: user.email,
      clipId,
      platforms,
      caption: caption || '',
      hashtags: hashtags || [],
      scheduleTime: scheduleTime || new Date().toISOString(),
      videoUrl: videoUrl || '',
      title: title || '',
      source: 'vangelclip',
    };

    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makePayload),
    });

    if (!makeResponse.ok) {
      throw new Error(`Make.com error: ${makeResponse.status}`);
    }

    await supabase.from('scheduled_posts').insert({
      user_id: user.id,
      clip_id: clipId || null,
      clip_title: title || 'Untitled Clip',
      video_url: videoUrl || '',
      platforms: platforms,
      platform: platforms[0],
      caption: caption || '',
      hashtags: hashtags || [],
      scheduled_at: scheduleTime || new Date().toISOString(),
      status: 'scheduled',
      make_webhook_sent: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Post scheduled successfully',
      scheduledFor: scheduleTime,
      platforms,
    });

  } catch (error: any) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post. Please try again.' },
      { status: 500 }
    );
  }
}
