-- Non-destructive additions to clip_jobs for durable job tracking.
-- Run once; safe to re-run (all guards use IF NOT EXISTS or IF EXISTS).

ALTER TABLE clip_jobs ADD COLUMN IF NOT EXISTS source           text        DEFAULT 'url';
ALTER TABLE clip_jobs ADD COLUMN IF NOT EXISTS source_name      text;
ALTER TABLE clip_jobs ADD COLUMN IF NOT EXISTS clips_saved      boolean     NOT NULL DEFAULT false;
ALTER TABLE clip_jobs ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE clip_jobs ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_clip_jobs_updated_at'
      AND tgrelid = 'clip_jobs'::regclass
  ) THEN
    CREATE TRIGGER update_clip_jobs_updated_at
      BEFORE UPDATE ON clip_jobs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS: browser client (anon key) must be able to SELECT own rows so the
-- import page can query in-progress jobs on mount.
DO $$ BEGIN
  BEGIN
    ALTER TABLE clip_jobs ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clip_jobs' AND policyname = 'clip_jobs_select_own'
  ) THEN
    CREATE POLICY clip_jobs_select_own ON clip_jobs
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
