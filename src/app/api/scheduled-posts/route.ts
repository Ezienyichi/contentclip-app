import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { insertNotification } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const PFM_API        = 'https://api.postforme.dev/v1';
const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'] as const;

// Service role — bypasses RLS for pfm_post_id back-fill and failure status updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    .select('id, platform, scheduled_at, caption, status, published_url, error_message, pfm_post_id, created_at, clips ( id, title, thumbnail_url, video_url )')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[scheduled-posts GET] DB error', error);
    return NextResponse.json({ error: 'Failed to load scheduled posts.' }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

// ── POST — create a scheduled post + submit to Post for Me ───────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let clip_id: string, platform: string, scheduled_at: string, caption: string;
  try {
    const body = await req.json();
    clip_id      = String(body.clip_id      ?? '');
    platform     = String(body.platform     ?? '');
    scheduled_at = String(body.scheduled_at ?? '');
    caption      = String(body.caption      ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!clip_id) return NextResponse.json({ error: 'clip_id is required.' }, { status: 400 });
  if (!VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number]))
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
  if (!scheduled_at || isNaN(Date.parse(scheduled_at)))
    return NextResponse.json({ error: 'Invalid scheduled_at date.' }, { status: 400 });
  if (new Date(scheduled_at) <= new Date())
    return NextResponse.json({ error: 'Scheduled time must be in the future.' }, { status: 400 });

  // Verify the clip belongs to this user + fetch video_url and title for PfM
  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('id, title, video_url')
    .eq('id', clip_id)
    .eq('user_id', user.id)
    .single();

  if (clipError || !clip)
    return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  // Look up the user's own active connection for this platform — never trust a client-supplied account ID
  const { data: connection, error: connError } = await supabase
    .from('social_connections')
    .select('pfm_account_id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('status', 'active')
    .single();

  if (connError || !connection)
    return NextResponse.json({ error: `No active ${platform} connection found. Connect your account first.` }, { status: 404 });

  // Insert our scheduled_post row first so we have an ID for PfM's external_id
  const { data: post, error: dbError } = await supabase
    .from('scheduled_posts')
    .insert({ user_id: user.id, clip_id, platform, scheduled_at, caption, status: 'scheduled' })
    .select('id')
    .single();

  if (dbError || !post) {
    console.error('[scheduled-posts POST] DB insert error', dbError);
    return NextResponse.json({ error: 'Failed to schedule post.' }, { status: 500 });
  }

  // ── Submit to Post for Me ────────────────────────────────────────────────────

  const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
  if (!pfmApiKey) {
    console.error('[scheduled-posts POST] POST_FOR_ME_API_KEY not set');
    await supabaseAdmin.from('scheduled_posts')
      .update({ status: 'failed', error_message: 'Server configuration error: API key missing.' })
      .eq('id', post.id);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Build payload — platform configurations for video placement/titles
  const pfmPayload: Record<string, unknown> = {
    caption,
    scheduled_at,
    social_accounts: [connection.pfm_account_id],
    external_id:     post.id,                       // our row ID for traceability
  };

  if (clip.video_url) {
    pfmPayload.media = [{ url: clip.video_url }];
  }

  if (platform === 'instagram') {
    pfmPayload.platform_configurations = { instagram: { placement: 'reels' } };
  } else if (platform === 'facebook') {
    pfmPayload.platform_configurations = { facebook: { placement: 'reels' } };
  } else if (platform === 'youtube') {
    pfmPayload.platform_configurations = { youtube: { title: clip.title ?? caption, privacy_status: 'public' } };
  }

  let pfmPostId: string | null = null;

  try {
    const pfmRes  = await fetch(`${PFM_API}/social-posts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pfmApiKey}` },
      body:    JSON.stringify(pfmPayload),
    });
    const pfmText = await pfmRes.text();
    console.log('[scheduled-posts POST] PfM', pfmRes.status, pfmText.slice(0, 500));

    if (!pfmRes.ok) {
      console.error('[scheduled-posts POST] PfM error', pfmRes.status, pfmText);
      await supabaseAdmin.from('scheduled_posts')
        .update({ status: 'failed', error_message: `PfM ${pfmRes.status}: ${pfmText.slice(0, 200)}` })
        .eq('id', post.id);
      return NextResponse.json(
        { error: `Post for Me rejected the request (${pfmRes.status}). Check your connected account.` },
        { status: 502 }
      );
    }

    pfmPostId = JSON.parse(pfmText).id ?? null;
  } catch (err) {
    console.error('[scheduled-posts POST] PfM network error', err);
    await supabaseAdmin.from('scheduled_posts')
      .update({ status: 'failed', error_message: 'Network error reaching Post for Me.' })
      .eq('id', post.id);
    return NextResponse.json({ error: 'Network error reaching Post for Me. Please try again.' }, { status: 502 });
  }

  // Store PfM's post ID so the webhook can match this row later
  if (pfmPostId) {
    const { error: updateErr } = await supabaseAdmin
      .from('scheduled_posts')
      .update({ pfm_post_id: pfmPostId })
      .eq('id', post.id);

    if (updateErr) {
      // Non-fatal: post is scheduled in PfM, but webhook won't update status automatically
      console.error('[scheduled-posts POST] Failed to store pfm_post_id', updateErr);
    }
  }

  // Notify user the post is queued (fire and forget)
  void insertNotification({
    user_id: user.id,
    title: 'Post scheduled',
    body: `Your ${platform} post is scheduled for ${new Date(scheduled_at).toLocaleString()}.`,
    type: 'post_scheduled',
    link: '/scheduler',
  });

  return NextResponse.json({ post: { id: post.id, pfm_post_id: pfmPostId } });
}
