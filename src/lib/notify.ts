import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type NotifType =
  | 'clip_ready'
  | 'credits_low'
  | 'upgrade'
  | 'info'
  | 'warning'
  | 'post_published'
  | 'post_failed'
  | 'post_scheduled';

export async function insertNotification(opts: {
  user_id: string;
  title: string;
  body?: string;
  type: NotifType;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id:  opts.user_id,
    title:    opts.title,
    body:     opts.body ?? null,
    type:     opts.type,
    link:     opts.link ?? null,
    metadata: opts.metadata ?? {},
  });
  if (error) console.error('[notify] insert error', error.message);
}
