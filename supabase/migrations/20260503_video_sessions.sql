-- Video sessions — multi-step wizard for Seedance 2 video generation
CREATE TABLE IF NOT EXISTS video_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES brands ON DELETE CASCADE,
  product_id uuid REFERENCES products ON DELETE SET NULL,
  video_style text NOT NULL DEFAULT 'ugc',
  platform text NOT NULL DEFAULT 'tiktok',
  aspect_ratio text NOT NULL DEFAULT '9:16',
  num_scenes integer NOT NULL DEFAULT 5 CHECK (num_scenes >= 4 AND num_scenes <= 9),
  duration integer NOT NULL DEFAULT 15,
  phase text NOT NULL DEFAULT 'script',
  -- 'script' | 'frames' | 'prompt' | 'generating_video' | 'done' | 'failed'
  scenes jsonb DEFAULT '[]'::jsonb,
  -- Array of SceneScript objects (see types/index.ts)
  seedance_prompt text,
  video_url text,
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_sessions_brand_id_idx ON video_sessions(brand_id);
CREATE INDEX IF NOT EXISTS video_sessions_phase_idx ON video_sessions(phase);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their brand video sessions"
  ON video_sessions FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );
