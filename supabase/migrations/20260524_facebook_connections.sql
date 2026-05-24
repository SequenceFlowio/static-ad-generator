CREATE TABLE facebook_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  fb_user_id TEXT,
  fb_account_id TEXT NOT NULL,
  fb_account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON facebook_connections USING (user_id = auth.uid());
