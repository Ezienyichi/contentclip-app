import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { insertNotification } from '@/lib/notify';
import { deleteScheduledCopies } from '@/lib/rehost';

export const dynamic = 'force-dynamic';

const PFM_API = 'https://api.postforme.dev/v1';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const pfmApiKey = process.env.POST_FOR_ME_API_KEY;
  if (!pfmApiKey) {
    return NextResponse.json({ error: 'POST_FOR_ME_API_KEY not set.' }, { status: 500 });
  }

  const admin = getAdmin();

  // Posts that passed their scheduled_at but haven't resolved yet
  const { data: posts, error: qErr } = await admin
    .from('scheduled_posts')
    .select('id, user_id, platform, pfm_post_id, status, scheduled_at')
    .in('status', ['scheduled', 'publishing'])
    .lt('scheduled_at', new Date().toISOString())
    .not('pfm_post_id', 'is', null)
    .limit(50);

  if (qErr) return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  if (!posts || posts.length === 0) return NextResponse.json({ synced: 0 });

  let published = 0, failed = 0, still_pending = 0;

  await Promise.allSettled(posts.map(async (post) => {
    try {
      const res = await fetch(`${PFM_API}/social-posts/${post.pfm_post_id}`, {
        headers: { Authorization: `Bearer ${pfmApiKey}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(`[sync-post-status] PfM ${res.status} for post=${post.id}`);
        return;
      }

      const data = await res.json();
      const success     = data.success === true || data.status === 'published' || data.status === 'PUBLISHED';
      const isFailed    = data.success === false || data.status === 'failed' || data.status === 'FAILED' || data.status === 'error';
      const publishedUrl = data.platform_data?.url ?? data.published_url ?? null;
      const errorMsg     = isFailed
        ? String(typeof data.error === 'object' ? JSON.stringify(data.error) : (data.error ?? 'Unknown error from Post for Me.')).slice(0, 500)
        : null;

      if (success) {
        await admin.from('scheduled_posts').update({
          status: 'published',
          published_url: publishedUrl,
          error_message: null,
        }).eq('id', post.id);

        void deleteScheduledCopies([{ id: post.id, user_id: post.user_id }]);

        if (post.user_id) {
          void insertNotification({
            user_id: post.user_id,
            title: 'Post published!',
            body: `Your ${post.platform} post is live.`,
            type: 'post_published',
            link: publishedUrl ?? '/scheduler',
            metadata: publishedUrl ? { url: publishedUrl } : {},
          });
        }
        published++;
      } else if (isFailed) {
        await admin.from('scheduled_posts').update({
          status: 'failed',
          error_message: errorMsg,
        }).eq('id', post.id);
        failed++;
      } else {
        still_pending++;
      }
    } catch (e) {
      console.warn('[sync-post-status] post', post.id, e instanceof Error ? e.message : e);
    }
  }));

  console.log(`[sync-post-status] checked=${posts.length} published=${published} failed=${failed} pending=${still_pending}`);
  return NextResponse.json({ synced: posts.length, published, failed, still_pending });
}
