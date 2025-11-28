-- Add sample_tweets column to social_sentiment table

ALTER TABLE social_sentiment 
ADD COLUMN IF NOT EXISTS sample_tweets JSONB DEFAULT '[]';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_social_sentiment_sample_tweets ON social_sentiment USING GIN (sample_tweets);
