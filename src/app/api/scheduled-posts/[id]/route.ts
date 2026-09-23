import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';

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

// ── DELETE — cancel a scheduled post ─────────────────────────────────────────

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
    .eq('user_id', user.id)   // ownership double-lock
    .select('id');

  if (error) {
    console.error('[scheduled-posts DELETE] DB error', error);
    return NextResponse.json({ error: 'Failed to cancel post.' }, { status: 500 });
  }

  if (!data || data.length === 0)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  return NextResponse.json({ success: true });
}

// ── PATCH — update caption of a scheduled post ────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;

  let caption: string;
  try {
    const body = await req.json();
    caption = String(body.caption ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Fetch post — ownership enforced by the eq('user_id', user.id) filter
  const { data: post, error: fetchError } = await supabase
    .from('scheduled_posts')
    .select('id, status, pfm_post_id, platform, scheduled_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !post)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  if (post.status !== 'scheduled')
    return NextResponse.json(
      { error: 'Caption can only be edited while a post is still scheduled.' },
      { status: 409 }
    );

  // If this post was submitted to PfM, update it there first so the actual
  // publish uses the new caption. If pfm_post_id is null the PfM call
  // failed earlier — skip PfM and update our DB only.
  if (post.pfm_post_id) {
    const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
    if (!pfmApiKey) {
      console.error('[scheduled-posts PATCH] POST_FOR_ME_API_KEY not set');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Fetch the user's active pfm_account_id — required by PfM's PUT payload
    const { data: conn } = await supabase
      .from('social_connections')
      .select('pfm_account_id')
      .eq('user_id', user.id)
      .eq('platform', post.platform)
      .eq('status', 'active')
      .single();

    if (!conn?.pfm_account_id)
      return NextResponse.json({ error: 'Active social connection not found.' }, { status: 404 });

    // PUT requires caption + social_accounts + scheduled_at (omitting scheduled_at posts immediately)
    const pfmRes = await fetch(`${PFM_API}/social-posts/${post.pfm_post_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pfmApiKey}`,
      },
      body: JSON.stringify({
        caption,
        social_accounts: [conn.pfm_account_id],
        scheduled_at:    post.scheduled_at,
      }),
    });

    if (!pfmRes.ok) {
      const text = await pfmRes.text();
      console.error('[scheduled-posts PATCH] PfM PUT failed', pfmRes.status, text);
      return NextResponse.json(
        { error: `Post for Me rejected the update (${pfmRes.status}). Caption not saved.` },
        { status: 502 }
      );
    }
  }

  // Update our DB — PfM succeeded (or was skipped) so it's safe to write
  const { error: updateError } = await supabase
    .from('scheduled_posts')
    .update({ caption })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[scheduled-posts PATCH] DB update failed', updateError);
    return NextResponse.json({ error: 'Failed to save caption.' }, { status: 500 });
  }

  return NextResponse.json({ caption });
}
