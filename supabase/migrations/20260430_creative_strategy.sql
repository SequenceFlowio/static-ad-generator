-- Creative Strategy Layer — per-brand strategy config
CREATE TABLE IF NOT EXISTS creative_strategies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES brands ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Strategy',
  creative_angles jsonb NOT NULL DEFAULT '[]',
  content_pillars jsonb NOT NULL DEFAULT '[]',
  hook_library jsonb NOT NULL DEFAULT '[]',
  visual_styles jsonb NOT NULL DEFAULT '[]',
  forbidden_elements jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

ALTER TABLE creative_strategies ENABLE ROW LEVEL SECURITY;

-- Brand owners can read/write their own strategy
CREATE POLICY "Users can manage own brand creative strategy"
  ON creative_strategies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = creative_strategies.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- Add performance tracking columns to generation_jobs (schema-only, no logic yet)
ALTER TABLE generation_jobs
  ADD COLUMN IF NOT EXISTS performance_score float,
  ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false;
