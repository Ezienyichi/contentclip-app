-- Extend notifications.type to include post event types.
-- Non-destructive: drops and recreates the check constraint only — no data loss.
-- Run in Supabase SQL Editor after the original notifications.sql has been applied.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'clip_ready',
    'credits_low',
    'upgrade',
    'info',
    'warning',
    'post_published',
    'post_failed',
    'post_scheduled'
  ));
