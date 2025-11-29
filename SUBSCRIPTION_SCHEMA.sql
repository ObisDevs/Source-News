-- Create subscription tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES subscription_tiers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, date)
);

-- Create increment usage function
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_date DATE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_usage (user_id, feature, date, count)
  VALUES (p_user_id, p_feature, p_date, 1)
  ON CONFLICT (user_id, feature, date)
  DO UPDATE SET count = user_usage.count + 1;
END;
$$ LANGUAGE plpgsql;

-- Insert default tiers
INSERT INTO subscription_tiers (name, price, features, limits) VALUES
('Free', 0, '{"ai_explanations": false, "bookmarks": true, "search": true}', '{"ai_explanations_per_day": 0, "bookmarks": 10}'),
('Basic', 1500, '{"ai_explanations": true, "bookmarks": true, "search": true, "ad_free": true}', '{"ai_explanations_per_day": 10, "bookmarks": 100}'),
('Premium', 5000, '{"ai_explanations": true, "bookmarks": true, "search": true, "ad_free": true, "priority_support": true}', '{"ai_explanations_per_day": 100, "bookmarks": -1}')
ON CONFLICT DO NOTHING;
