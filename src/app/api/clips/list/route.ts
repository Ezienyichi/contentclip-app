import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
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

  const { data, error } = await supabase
    .from('clips')
    .select('id, title, hook_text, start_time, end_time, duration, virality_score, suggested_caption, hashtags, status, video_url, download_url, thumbnail_url, expires_at, source_video_name, created_at')
    .eq('user_id', user.id)   // explicit filter; RLS is the safety net
    .neq('status', 'error')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[clips/list] DB error', error);
    return NextResponse.json({ error: 'Failed to load clips.' }, { status: 500 });
  }

  const clips = (data ?? []).map(c => ({
    id:                c.id,
    title:             c.title,
    hook_text:         c.hook_text ?? '',
    start_time:        c.start_time,
    end_time:          c.end_time,
    duration:          c.duration,
    virality_score:    c.virality_score,
    suggested_caption: c.suggested_caption ?? '',
    hashtags:          Array.isArray(c.hashtags) ? c.hashtags.join(' ') : '',
    platform:          'tiktok',
    video_url:         c.video_url ?? '',
    download_url:      c.download_url ?? '',
    thumbnail_url:     c.thumbnail_url ?? '',
    status:            c.status,
    expires_at:        c.expires_at ?? null,
    source_video_name: c.source_video_name ?? '',
  }));

  return NextResponse.json({ clips });
}
