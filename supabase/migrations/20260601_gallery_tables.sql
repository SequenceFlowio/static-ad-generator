CREATE TABLE IF NOT EXISTS gallery_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text,
  gender text,
  age_range text,
  style text,
  extra_description text,
  prompt_hint text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gallery_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand owner" ON gallery_avatars FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS gallery_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text,
  env_type text,
  lighting text,
  extra_description text,
  prompt_hint text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE gallery_environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand owner" ON gallery_environments FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
