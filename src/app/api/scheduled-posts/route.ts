import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'] as const;

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );
}

// ── GET — list user's scheduled posts ────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id, platform, scheduled_at, caption, status, published_url, error_message, created_at, clips ( id, title, thumbnail_url, video_url )')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[scheduled-posts GET] DB error', error);
    return NextResponse.json({ error: 'Failed to load scheduled posts.' }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

// ── POST — create a scheduled post ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let clip_id: string, platform: string, scheduled_at: string, caption: string;
  try {
    const body = await req.json();
    clip_id      = String(body.clip_id ?? '');
    platform     = String(body.platform ?? '');
    scheduled_at = String(body.scheduled_at ?? '');
    caption      = String(body.caption ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!clip_id)      return NextResponse.json({ error: 'clip_id is required.' }, { status: 400 });
  if (!VALID_PLATFORMS.includes(platform as any))
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  if (!scheduled_at || isNaN(Date.parse(scheduled_at)))
    return NextResponse.json({ error: 'Invalid scheduled_at date.' }, { status: 400 });
  if (new Date(scheduled_at) <= new Date())
    return NextResponse.json({ error: 'Scheduled time must be in the future.' }, { status: 400 });

  // Verify the clip belongs to this user
  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', clip_id)
    .eq('user_id', user.id)
    .single();

  if (clipError || !clip)
    return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id:      user.id,
      clip_id,
      platform,
      scheduled_at,
      caption,
      status:       'scheduled',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[scheduled-posts POST] DB error', error);
    return NextResponse.json({ error: 'Failed to schedule post.' }, { status: 500 });
  }

  // Phase 2: call Post for Me scheduling API here
  // POST https://api.postforme.dev/v1/posts/schedule
  // { platform, caption, media_url: clip.video_url, scheduled_at, external_id: user.id }

  return NextResponse.json({ post: data });
}
