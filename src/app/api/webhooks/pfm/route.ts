import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { insertNotification } from '@/lib/notify';

export const dynamic = 'force-dynamic';

// Service role — webhook calls have no user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // ── Verify the request is genuinely from Post for Me ─────────────────────────
  // PfM sends the webhook's secret verbatim in this header on every delivery.
  const incomingSecret = req.headers.get('post-for-me-webhook-secret');
  const expectedSecret = process.env.PFM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[pfm-webhook] PFM_WEBHOOK_SECRET env var not set');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    console.error('[pfm-webhook] Invalid or missing secret header');
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // ── Parse payload ─────────────────────────────────────────────────────────────
  // Shape: { event_type: string, data: SocialPostResultDto }
  let event_type: string;
  let data: Record<string, any>;
  try {
    const body = await req.json();
    event_type = String(body.event_type ?? '');
    data       = body.data ?? {};
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  console.log('[pfm-webhook] event:', event_type, '| pfm post_id:', data.post_id ?? '(none)');

  // Return 200 for all other event types so PfM doesn't retry them
  if (event_type !== 'social.post.result.created') {
    return NextResponse.json({ ok: true });
  }

  const pfmPostId: string | undefined = data.post_id;
  if (!pfmPostId) {
    console.error('[pfm-webhook] Payload missing post_id');
    return NextResponse.json({ error: 'Missing post_id.' }, { status: 400 });
  }

  // ── Find the matching scheduled_post row ──────────────────────────────────────
  const { data: post, error: findError } = await supabaseAdmin
    .from('scheduled_posts')
    .select('id, user_id, platform')
    .eq('pfm_post_id', pfmPostId)
    .single();

  if (findError || !post) {
    // Could be a post from a different source — log and 200 so PfM doesn't retry
    console.warn('[pfm-webhook] No scheduled_post found for pfm_post_id:', pfmPostId);
    return NextResponse.json({ ok: true });
  }

  // ── Update post status based on result ───────────────────────────────────────
  const success      = data.success === true;
  const publishedUrl = data.platform_data?.url ?? null;
  const errorMsg     = success
    ? null
    : String(
        typeof data.error === 'object'
          ? JSON.stringify(data.error)
          : (data.error ?? 'Unknown error from Post for Me.')
      ).slice(0, 500);

  const { error: updateError } = await supabaseAdmin
    .from('scheduled_posts')
    .update({
      status:        success ? 'published' : 'failed',
      published_url: publishedUrl,
      error_message: errorMsg,
    })
    .eq('id', post.id);

  if (updateError) {
    console.error('[pfm-webhook] DB update failed', updateError);
    // Return 500 so PfM retries (exponential backoff, ~8 attempts over ~1 day)
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  console.log('[pfm-webhook] Post', post.id, '→', success ? 'published' : 'failed', publishedUrl ?? '');

  // Notify the post owner (fire and forget)
  if (post.user_id) {
    void insertNotification({
      user_id: post.user_id,
      title:   success ? 'Post published!' : 'Post failed to publish',
      body:    success
        ? `Your ${post.platform} post is live.`
        : `Your ${post.platform} post could not be published.${errorMsg ? ' ' + errorMsg.slice(0, 120) : ''}`,
      type:     success ? 'post_published' : 'post_failed',
      link:     publishedUrl ?? '/scheduler',
      metadata: publishedUrl ? { url: publishedUrl } : {},
    });
  }

  return NextResponse.json({ ok: true });
}
