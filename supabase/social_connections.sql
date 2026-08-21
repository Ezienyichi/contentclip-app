-- Social Connections — Phase 1 (Post for Me integration)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.social_connections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL
                              CHECK (platform IN ('tiktok','instagram','youtube','facebook','twitter')),
  pfm_account_id  TEXT        NOT NULL,   -- Post for Me's stable account reference
  account_name    TEXT,                   -- display handle/channel name from PfM
  account_avatar  TEXT,                   -- profile image URL from PfM
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','disconnected','error')),
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate active connections for the same account
  UNIQUE (user_id, platform, pfm_account_id)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read their own connections
CREATE POLICY "Users view own connections"
  ON public.social_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only soft-delete (mark disconnected) their own connections
CREATE POLICY "Users delete own connections"
  ON public.social_connections FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT and UPDATE have no policy (implicit DENY for all clients).
-- Only the server-side callback route writes to this table,
-- using the service role key which bypasses RLS entirely.

CREATE INDEX IF NOT EXISTS idx_social_connections_user
  ON public.social_connections (user_id, status);
