CREATE TABLE facebook_ad_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  fb_ad_id TEXT NOT NULL,
  fb_campaign_id TEXT,
  fb_adset_id TEXT,
  ad_name TEXT,
  campaign_name TEXT,
  adset_name TEXT,
  ad_status TEXT,
  creative_image_url TEXT,
  date_start DATE,
  date_stop DATE,
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  frequency DECIMAL(5,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  purchase_roas DECIMAL(8,4) DEFAULT 0,
  purchase_value DECIMAL(10,2) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  cpp DECIMAL(10,2) DEFAULT 0,
  ai_recommendation TEXT,
  ai_reason TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, fb_ad_id, date_start, date_stop)
);
ALTER TABLE facebook_ad_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON facebook_ad_insights
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));
