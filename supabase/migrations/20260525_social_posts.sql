-- Social posts: scheduled + published organic content for Instagram + Facebook
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL DEFAULT '{"instagram"}',
  media_type TEXT NOT NULL DEFAULT 'image',         -- 'image' | 'video' | 'carousel'
  image_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  caption TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',             -- 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  fb_post_id TEXT,
  ig_post_id TEXT,
  source TEXT DEFAULT 'manual',                     -- 'manual' | 'generated' | 'ads_bridge'
  source_creative_url TEXT,                         -- image URL when bridged from an ad creative
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON social_posts USING (user_id = auth.uid());

-- Per-brand auto-poster settings
CREATE TABLE social_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  platforms TEXT[] DEFAULT '{"instagram"}',
  frequency TEXT DEFAULT 'daily',                   -- 'daily' | '2x_week' | '3x_week'
  post_time TIME DEFAULT '09:00',
  content_types TEXT[] DEFAULT '{"product","lifestyle"}',
  require_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE social_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON social_settings USING (user_id = auth.uid());
