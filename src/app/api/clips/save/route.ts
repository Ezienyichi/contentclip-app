import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const EXPIRES_DAYS = 14;

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

  let clips: any[], source_video_name: string;
  try {
    const body = await req.json();
    clips = Array.isArray(body.clips) ? body.clips : [];
    source_video_name = String(body.source_video_name ?? '').slice(0, 500);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (clips.length === 0) return NextResponse.json({ savedClips: [] });

  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const rows = clips.map((c: any) => ({
    user_id:           user.id,           // always from verified session, never from body
    project_id:        null,
    title:             String(c.title || 'Clip').slice(0, 500),
    hook_text:         String(c.caption || c.hook_text || '').slice(0, 1000),
    start_time:        Number(c.start_time ?? 0),
    end_time:          Number(c.end_time ?? 60),
    // duration omitted — GENERATED ALWAYS AS (end_time - start_time) STORED
    virality_score:    Math.min(100, Math.max(0, Math.round(Number(c.ai_score ?? c.virality_score ?? 80)))),
    suggested_caption: String(c.caption || c.suggested_caption || '').slice(0, 2000),
    hashtags:          Array.isArray(c.hashtags) ? c.hashtags : [],
    status:            'ready',
    video_url:         String(c.video_url || c.clip_url || '').slice(0, 2000),
    download_url:      String(c.download_url || '').slice(0, 2000),
    thumbnail_url:     String(c.thumbnail_url || '').slice(0, 2000),
    source_video_name,
    expires_at:        expiresAt,
  }));

  const { data, error } = await supabase
    .from('clips')
    .insert(rows)
    .select('id');

  if (error) {
    console.error('[clips/save] DB error', error);
    return NextResponse.json({ error: 'Failed to save clips.' }, { status: 500 });
  }

  return NextResponse.json({ savedClips: data ?? [] });
}
