-- ============================================================
-- HookClip — Notifications Table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  body         TEXT,
  type         TEXT        NOT NULL DEFAULT 'info'
                           CHECK (type IN ('clip_ready', 'credits_low', 'upgrade', 'info', 'warning')),
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  link         TEXT,
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert on behalf of users (used by API routes)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- Indexes for fast unread lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, read)
  WHERE read = FALSE;
