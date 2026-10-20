import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isR2Url } from '@/lib/rehost';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getEffectiveStatusServer(status: string, scheduledAt: string): string {
  const d   = new Date(scheduledAt);
  const now = new Date();
  if (status === 'failed' || status === 'cancelled') return 'not_published';
  if (status === 'scheduled'  && d < new Date(now.getTime() - 15 * 60_000)) return 'not_published';
  if (status === 'publishing' && d < new Date(now.getTime() - 30 * 60_000)) return 'not_published';
  return status;
}

async function makeSupabase() {
  const cookieStore = await cookies();
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

// ── DELETE — cancel ───────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    console.error('[scheduled-posts DELETE] DB error', error);
    return NextResponse.json({ error: 'Failed to cancel post.' }, { status: 500 });
  }

  if (!data || data.length === 0)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  return NextResponse.json({ success: true });
}

// ── PATCH — caption / reschedule / retry ──────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { data: post, error: fetchError } = await supabase
    .from('scheduled_posts')
    .select('id, status, pfm_post_id, platform, scheduled_at, clip_id, social_connection_id, caption')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !post)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  const action = typeof body.action === 'string' ? body.action : null;

  // ── RESCHEDULE ────────────────────────────────────────────────────────────

  if (action === 'reschedule') {
    const newScheduledAt = typeof body.scheduled_at === 'string' ? body.scheduled_at : null;
    if (!newScheduledAt || isNaN(Date.parse(newScheduledAt)))
      return NextResponse.json({ error: 'Invalid scheduled_at.' }, { status: 400 });
    if (new Date(newScheduledAt) <= new Date())
      return NextResponse.json({ error: 'Scheduled time must be in the future.' }, { status: 400 });

    const pfmApiKey = process.env.POST_FOR_ME_API_KEY;

    // Update PfM only when the post is still active (scheduled) in PfM
    if (post.status === 'scheduled' && post.pfm_post_id && pfmApiKey) {
      const { data: conn } = await supabase
        .from('social_connections')
        .select('pfm_account_id')
        .eq('user_id', user.id)
        .eq('platform', post.platform)
        .eq('status', 'active')
        .single();

      if (conn?.pfm_account_id) {
        const pfmRes = await fetch(`${PFM_API}/social-posts/${post.pfm_post_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pfmApiKey}` },
          body: JSON.stringify({ caption: post.caption ?? '', social_accounts: [conn.pfm_account_id], scheduled_at: newScheduledAt }),
        });
        if (!pfmRes.ok) {
          const text = await pfmRes.text();
          console.error('[scheduled-posts PATCH reschedule] PfM error', pfmRes.status, text);
          return NextResponse.json({ error: `Post for Me rejected the update (${pfmRes.status}).` }, { status: 502 });
        }
      }
    }

    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({ scheduled_at: newScheduledAt, status: 'scheduled' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[scheduled-posts PATCH reschedule] DB error', updateError);
      return NextResponse.json({ error: 'Failed to reschedule.' }, { status: 500 });
    }

    return NextResponse.json({ scheduled_at: newScheduledAt, status: 'scheduled' });
  }

  // ── RETRY ─────────────────────────────────────────────────────────────────

  if (action === 'retry') {
    const effStatus = getEffectiveStatusServer(post.status, post.scheduled_at);
    if (effStatus !== 'not_published')
      return NextResponse.json({ error: 'Only not-published posts can be retried.' }, { status: 409 });

    const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
    if (!pfmApiKey)
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });

    if (!post.clip_id)
      return NextResponse.json({ error: 'Post has no clip attached.' }, { status: 409 });

    const { data: clip } = await supabase
      .from('clips')
      .select('id, title, video_url, download_url')
      .eq('id', post.clip_id)
      .eq('user_id', user.id)
      .single();

    if (!clip) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

    const mediaUrl = isR2Url(clip.video_url) ? clip.video_url
                   : isR2Url(clip.download_url) ? clip.download_url
                   : null;
    if (!mediaUrl)
      return NextResponse.json({ error: 'Clip video is not on permanent storage yet. Wait for processing to complete.' }, { status: 409 });

    let conn: { id: string; pfm_account_id: string } | null = null;
    if (post.social_connection_id) {
      const { data } = await supabase
        .from('social_connections')
        .select('id, pfm_account_id')
        .eq('id', post.social_connection_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      conn = data ?? null;
    }
    if (!conn) {
      const { data } = await supabase
        .from('social_connections')
        .select('id, pfm_account_id')
        .eq('user_id', user.id)
        .eq('platform', post.platform)
        .eq('status', 'active')
        .single();
      conn = data ?? null;
    }
    if (!conn)
      return NextResponse.json({ error: `No active ${post.platform} connection found.` }, { status: 404 });

    const newScheduledAt = new Date(Date.now() + 5 * 60_000).toISOString();

    const pfmPayload: Record<string, unknown> = {
      caption:        post.caption ?? '',
      scheduled_at:   newScheduledAt,
      social_accounts:[conn.pfm_account_id],
      external_id:    post.id,
      media:          [{ url: mediaUrl }],
    };
    if (post.platform === 'instagram') pfmPayload.platform_configurations = { instagram: { placement: 'reels' } };
    else if (post.platform === 'facebook')  pfmPayload.platform_configurations = { facebook:  { placement: 'reels' } };
    else if (post.platform === 'youtube')   pfmPayload.platform_configurations = { youtube:   { title: clip.title ?? '', privacy_status: 'public' } };

    console.log('[scheduled-posts PATCH retry] submitting to PfM for post', id);

    const pfmRes = await fetch(`${PFM_API}/social-posts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pfmApiKey}` },
      body:    JSON.stringify(pfmPayload),
    });

    if (!pfmRes.ok) {
      const text = await pfmRes.text();
      console.error('[scheduled-posts PATCH retry] PfM error', pfmRes.status, text);
      await supabaseAdmin.from('scheduled_posts')
        .update({ error_message: `Retry failed: PfM ${pfmRes.status}` })
        .eq('id', id);
      return NextResponse.json({ error: `Post for Me rejected the retry (${pfmRes.status}).` }, { status: 502 });
    }

    const pfmJson = await pfmRes.json().catch(() => ({}));
    const newPfmPostId = pfmJson.id ?? pfmJson.post_id ?? pfmJson.data?.id ?? null;

    await supabaseAdmin
      .from('scheduled_posts')
      .update({ status: 'scheduled', scheduled_at: newScheduledAt, pfm_post_id: newPfmPostId, error_message: null })
      .eq('id', id);

    return NextResponse.json({ status: 'scheduled', scheduled_at: newScheduledAt });
  }

  // ── CAPTION (default) ─────────────────────────────────────────────────────

  let caption: string;
  try { caption = String(body.caption ?? ''); } catch {
    return NextResponse.json({ error: 'Invalid caption.' }, { status: 400 });
  }

  if (post.status !== 'scheduled')
    return NextResponse.json({ error: 'Caption can only be edited while a post is still scheduled.' }, { status: 409 });

  if (post.pfm_post_id) {
    const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
    if (!pfmApiKey) {
      console.error('[scheduled-posts PATCH caption] POST_FOR_ME_API_KEY not set');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const { data: conn } = await supabase
      .from('social_connections')
      .select('pfm_account_id')
      .eq('user_id', user.id)
      .eq('platform', post.platform)
      .eq('status', 'active')
      .single();

    if (!conn?.pfm_account_id)
      return NextResponse.json({ error: 'Active social connection not found.' }, { status: 404 });

    const pfmRes = await fetch(`${PFM_API}/social-posts/${post.pfm_post_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pfmApiKey}` },
      body: JSON.stringify({ caption, social_accounts: [conn.pfm_account_id], scheduled_at: post.scheduled_at }),
    });

    if (!pfmRes.ok) {
      const text = await pfmRes.text();
      console.error('[scheduled-posts PATCH caption] PfM PUT failed', pfmRes.status, text);
      return NextResponse.json(
        { error: `Post for Me rejected the update (${pfmRes.status}). Caption not saved.` },
        { status: 502 }
      );
    }
  }

  const { error: updateError } = await supabase
    .from('scheduled_posts')
    .update({ caption })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[scheduled-posts PATCH caption] DB update failed', updateError);
    return NextResponse.json({ error: 'Failed to save caption.' }, { status: 500 });
  }

  return NextResponse.json({ caption });
}
