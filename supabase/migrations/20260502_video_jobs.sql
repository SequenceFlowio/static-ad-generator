-- Video jobs — Seedance 2 UGC/lifestyle video generation
CREATE TABLE IF NOT EXISTS video_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES brands ON DELETE CASCADE,
  product_id uuid REFERENCES products ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  -- 'pending' | 'generating_scenes' | 'generating_video' | 'done' | 'failed'
  video_url text,
  video_prompt text,
  script text,
  scene_image_urls text[] DEFAULT '{}',
  reference_image_urls text[] DEFAULT '{}',
  duration integer NOT NULL DEFAULT 15,
  aspect_ratio text NOT NULL DEFAULT '9:16',
  video_style text NOT NULL DEFAULT 'ugc',
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_jobs_brand_id_idx ON video_jobs(brand_id);
CREATE INDEX IF NOT EXISTS video_jobs_status_idx ON video_jobs(status);

ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their brand video jobs"
  ON video_jobs FOR ALL
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );
