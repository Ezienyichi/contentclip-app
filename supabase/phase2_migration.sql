-- Phase 2: Add pfm_post_id to scheduled_posts
-- Non-destructive: ADD COLUMN IF NOT EXISTS, no data loss.

ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS pfm_post_id TEXT;

-- Index so webhook lookups by pfm_post_id are fast
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_pfm_post_id
  ON public.scheduled_posts (pfm_post_id)
  WHERE pfm_post_id IS NOT NULL;
