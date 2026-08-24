-- Add upload-specific columns to clips table
ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS source        text        NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS retention_days  smallint,
  ADD COLUMN IF NOT EXISTS delete_after    timestamptz;

-- Index for fast cron cleanup queries
CREATE INDEX IF NOT EXISTS clips_delete_after_idx ON clips (delete_after) WHERE delete_after IS NOT NULL;
-- Index for daily cap count
CREATE INDEX IF NOT EXISTS clips_upload_daily_idx ON clips (user_id, source, created_at) WHERE source = 'upload';
