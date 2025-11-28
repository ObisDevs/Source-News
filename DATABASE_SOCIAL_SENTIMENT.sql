-- Add social_sentiment table for Twitter/X sentiment analysis

CREATE TABLE IF NOT EXISTS social_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('twitter', 'facebook', 'reddit', 'instagram')),
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  keywords TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, platform)
);

COMMENT ON TABLE social_sentiment IS 'Social media sentiment analysis for stories';
COMMENT ON COLUMN social_sentiment.keywords IS 'Trending keywords/hashtags related to the story';

-- Indexes
CREATE INDEX idx_social_sentiment_story_id ON social_sentiment(story_id);
CREATE INDEX idx_social_sentiment_platform ON social_sentiment(platform);
CREATE INDEX idx_social_sentiment_analyzed_at ON social_sentiment(analyzed_at DESC);

-- RLS Policies
ALTER TABLE social_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view social sentiment"
  ON social_sentiment FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage social sentiment"
  ON social_sentiment FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
