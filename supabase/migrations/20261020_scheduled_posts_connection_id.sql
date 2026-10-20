ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS social_connection_id uuid
    REFERENCES social_connections(id) ON DELETE SET NULL;
