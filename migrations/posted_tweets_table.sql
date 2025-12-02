-- Create table to track posted tweets
CREATE TABLE IF NOT EXISTS posted_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  story_url TEXT UNIQUE NOT NULL,
  title TEXT,
  tweet_text TEXT,
  tweet_url TEXT,
  category TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_posted_tweets_story_url ON posted_tweets(story_url);
CREATE INDEX IF NOT EXISTS idx_posted_tweets_story_id ON posted_tweets(story_id);
CREATE INDEX IF NOT EXISTS idx_posted_tweets_posted_at ON posted_tweets(posted_at DESC);

-- Enable RLS
ALTER TABLE posted_tweets ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view posted tweets"
  ON posted_tweets FOR SELECT
  USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can manage posted tweets"
  ON posted_tweets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE posted_tweets IS 'Tracks stories that have been posted to Twitter to prevent duplicates';
