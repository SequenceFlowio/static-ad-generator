-- Track generation usage per user per month
CREATE TABLE IF NOT EXISTS generation_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  month text NOT NULL, -- format: "2026-04"
  used integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);

ALTER TABLE generation_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own usage"
  ON generation_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages writes (insert/update via server-side Supabase client)
