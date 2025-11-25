-- ============================================
-- COMPLETE SUPABASE SETUP SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('rss', 'api', 'twitter', 'government')),
  url TEXT,
  credibility_score INTEGER DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  bias_lean TEXT CHECK (bias_lean IN ('left', 'centre', 'right', 'government', 'independent')),
  is_active BOOLEAN DEFAULT true,
  license_status TEXT DEFAULT 'pending' CHECK (license_status IN ('pending', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stories_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL,
  canonical_url TEXT,
  fingerprint TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  CONSTRAINT unique_url UNIQUE (url)
);

CREATE TABLE IF NOT EXISTS story_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_title TEXT NOT NULL,
  summary TEXT,
  news_score INTEGER DEFAULT 0 CHECK (news_score >= 0 AND news_score <= 100),
  engagement_score INTEGER DEFAULT 0,
  sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  bias_distribution JSONB DEFAULT '{"left": 0, "centre": 0, "right": 0, "government": 0, "independent": 0}',
  category TEXT,
  is_trending BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cluster_items (
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 0.8 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cluster_id, story_id)
);

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE UNIQUE,
  title_vector VECTOR(1536),
  content_vector VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_stories_raw_source_id ON stories_raw(source_id);
CREATE INDEX IF NOT EXISTS idx_stories_raw_published_at ON stories_raw(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_raw_fingerprint ON stories_raw(fingerprint);
CREATE INDEX IF NOT EXISTS idx_stories_raw_processed ON stories_raw(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_story_clusters_created_at ON story_clusters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cluster_items_story_id ON cluster_items(story_id);
CREATE INDEX IF NOT EXISTS idx_cluster_items_cluster_id ON cluster_items(cluster_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_story_id ON embeddings(story_id);

-- 4. Create pgvector Indexes (may take time on large datasets)
CREATE INDEX IF NOT EXISTS idx_embeddings_title_vector ON embeddings USING ivfflat (title_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_vector ON embeddings USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

-- 5. Create Functions
CREATE OR REPLACE FUNCTION match_stories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  story_id UUID,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.story_id,
    1 - (e.title_vector <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 1 - (e.title_vector <=> query_embedding) > match_threshold
  ORDER BY e.title_vector <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Seed Nigerian News Sources
INSERT INTO sources (name, type, url, bias_lean, credibility_score, is_active) VALUES
  ('Premium Times', 'rss', 'https://premiumtimesng.com/feed', 'centre', 85, true),
  ('Punch', 'rss', 'https://punchng.com/feed/', 'centre', 80, true),
  ('Vanguard', 'rss', 'https://www.vanguardngr.com/feed/', 'centre', 80, true),
  ('The Cable', 'rss', 'https://www.thecable.ng/feed', 'centre', 85, true),
  ('Channels TV', 'rss', 'https://www.channelstv.com/feed/', 'centre', 90, true),
  ('Techpoint Africa', 'rss', 'https://techpoint.africa/feed/', 'centre', 75, true),
  ('Nairametrics', 'rss', 'https://nairametrics.com/feed/', 'centre', 75, true),
  ('The Guardian NG', 'rss', 'https://guardian.ng/feed/', 'centre', 80, true),
  ('Daily Trust', 'rss', 'https://dailytrust.com/feed/', 'centre', 75, true),
  ('Sahara Reporters', 'rss', 'https://saharareporters.com/feeds/latest/feed', 'left', 70, true)
ON CONFLICT DO NOTHING;

-- 7. Enable RLS (Row Level Security)
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (Public Read Access)
DO $$ BEGIN
  CREATE POLICY "Public can view active sources" ON sources FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view stories" ON stories_raw FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view clusters" ON story_clusters FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view cluster items" ON cluster_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view embeddings" ON embeddings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. Service role can do everything
DO $$ BEGIN
  CREATE POLICY "Service role full access sources" ON sources FOR ALL USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access stories" ON stories_raw FOR ALL USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access clusters" ON story_clusters FOR ALL USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access cluster_items" ON cluster_items FOR ALL USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access embeddings" ON embeddings FOR ALL USING (auth.jwt()->>'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. Delete sample data (optional - run if you want to remove demo stories)
-- DELETE FROM story_clusters WHERE primary_title IN (
--   'Nigeria Economy Shows Growth in Q4 2024',
--   'Tech Startups Raise $500M in Funding',
--   'Education Reform Bill Passes Senate'
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if sources were created
SELECT COUNT(*) as source_count FROM sources;

-- Check if sample clusters were created
SELECT COUNT(*) as cluster_count FROM story_clusters;

-- View all sources
SELECT name, url, bias_lean, is_active FROM sources;

-- View sample clusters
SELECT primary_title, news_score, created_at FROM story_clusters ORDER BY created_at DESC LIMIT 5;
