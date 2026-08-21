-- scheduled_posts constraint fixes
-- Non-destructive: drops and re-adds constraints only, no data loss.

-- 1. Add facebook + twitter to platform constraint
ALTER TABLE public.scheduled_posts
  DROP CONSTRAINT IF EXISTS scheduled_posts_platform_check;
ALTER TABLE public.scheduled_posts
  ADD CONSTRAINT scheduled_posts_platform_check
  CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'facebook', 'twitter'));

-- 2. Add 'publishing' to status constraint
ALTER TABLE public.scheduled_posts
  DROP CONSTRAINT IF EXISTS scheduled_posts_status_check;
ALTER TABLE public.scheduled_posts
  ADD CONSTRAINT scheduled_posts_status_check
  CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled'));
