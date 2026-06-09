-- Content plan: per-brand content strategy configuration
CREATE TABLE IF NOT EXISTS content_plan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content_types jsonb NOT NULL DEFAULT '[]',
  product_weights jsonb NOT NULL DEFAULT '{}',
  weekly_posts integer NOT NULL DEFAULT 4,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(brand_id)
);

ALTER TABLE content_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own brand content_plan" ON content_plan
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Topic library: per-brand, per-content-type topic pool with rotation tracking
CREATE TABLE IF NOT EXISTS content_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content_type_key text NOT NULL,
  topic text NOT NULL,
  last_used_at timestamptz,
  usage_count integer NOT NULL DEFAULT 0,
  performance_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own brand content_topics" ON content_topics
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS content_topics_rotation_idx
  ON content_topics(brand_id, content_type_key, last_used_at ASC NULLS FIRST);

-- Content performance: stores post metrics (metric-pulling wired later)
CREATE TABLE IF NOT EXISTS content_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  content_type_key text,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  synced_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id)
);

ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own brand content_performance" ON content_performance
  USING (brand_id IN (SELECT id FROM brands WHERE id = content_performance.brand_id));

-- Add 'approved' status to social_posts
-- Drop and recreate the check constraint to include the new status
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_status_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_status_check
  CHECK (status IN ('draft', 'approved', 'scheduled', 'publishing', 'published', 'failed'));

-- Add content metadata fields to social_posts for traceability
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_type_key text;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES content_topics(id) ON DELETE SET NULL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS topic_used text;
