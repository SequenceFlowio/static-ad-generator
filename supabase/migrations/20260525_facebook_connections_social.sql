-- Add page_id, page_name, ig_user_id to facebook_connections
-- These are needed for organic page posts + Instagram publishing
ALTER TABLE facebook_connections
  ADD COLUMN IF NOT EXISTS page_id TEXT,
  ADD COLUMN IF NOT EXISTS page_name TEXT,
  ADD COLUMN IF NOT EXISTS ig_user_id TEXT;
