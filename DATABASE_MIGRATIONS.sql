-- ============================================
-- COMPLETE SOURCE-NEWS DATABASE MIGRATIONS
-- Consolidated from all migration scripts
-- ============================================

-- ============================================
-- 1. SETUP: Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. CREATE CORE TABLES
-- ============================================

-- Sources table
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

-- Stories/articles table
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

-- Story clusters (grouped related stories)
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

-- Cluster items (junction table)
CREATE TABLE IF NOT EXISTS cluster_items (
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 0.8 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cluster_id, story_id)
);

-- Embeddings for vector search
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE UNIQUE,
  title_vector VECTOR(1536),
  content_vector VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USER & INTERACTION TABLES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- User reading history
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- AI explanations cache
CREATE TABLE IF NOT EXISTS ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  explanation_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, explanation_type)
);

-- Story reactions (likes, dislikes, bookmarks)
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike', 'bookmark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id, reaction_type)
);

-- Story comments
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_raw_source_id ON stories_raw(source_id);
CREATE INDEX IF NOT EXISTS idx_stories_raw_published_at ON stories_raw(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_raw_fingerprint ON stories_raw(fingerprint);
CREATE INDEX IF NOT EXISTS idx_stories_raw_processed ON stories_raw(processed) WHERE processed = false;

-- Clusters indexes
CREATE INDEX IF NOT EXISTS idx_story_clusters_created_at ON story_clusters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cluster_items_story_id ON cluster_items(story_id);
CREATE INDEX IF NOT EXISTS idx_cluster_items_cluster_id ON cluster_items(cluster_id);

-- Embeddings indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_story_id ON embeddings(story_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_title_vector ON embeddings USING ivfflat (title_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_vector ON embeddings USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_story ON bookmarks(story_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_story ON reading_history(story_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanations_story ON ai_explanations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON story_comments(parent_comment_id);

-- ============================================
-- 5. CREATE FUNCTIONS
-- ============================================

-- Vector similarity search function
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

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Public read access to content
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

DO $$ BEGIN
  CREATE POLICY "AI explanations are public" ON ai_explanations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User-specific access
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own history" ON reading_history FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own history" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role access (for backend services)
DO $$ BEGIN
  CREATE POLICY "Service role bypass sources" ON sources FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass stories" ON stories_raw FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass clusters" ON story_clusters FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass cluster_items" ON cluster_items FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass embeddings" ON embeddings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert AI explanations" ON ai_explanations FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 8. SEED NIGERIAN NEWS SOURCES
-- ============================================

INSERT INTO sources (name, type, url, bias_lean, credibility_score, is_active) VALUES
  ('Premium Times', 'rss', 'https://premiumtimesng.com/feed', 'centre', 85, true),
  ('Punch', 'rss', 'https://punchng.com/feed/', 'centre', 80, true),
  ('Vanguard', 'rss', 'https://www.vanguardngr.com/feed/', 'centre', 80, true),
  ('Channels TV', 'rss', 'https://www.channelstv.com/feed/', 'centre', 90, true),
  ('Techpoint Africa', 'rss', 'https://techpoint.africa/feed/', 'centre', 75, true),
  ('Nairametrics', 'rss', 'https://nairametrics.com/feed/', 'centre', 75, true),
  ('The Guardian NG', 'rss', 'https://guardian.ng/feed/', 'centre', 80, true),
  ('Daily Trust', 'rss', 'https://dailytrust.com/feed/', 'centre', 75, true),
  ('BusinessDay', 'rss', 'https://businessday.ng/feed/', 'centre', 80, true),
  ('This Day', 'rss', 'https://www.thisdaylive.com/index.php/feed/', 'centre', 75, true),
  ('NewsAPI Nigeria', 'api', 'https://newsapi.org', 'centre', 80, true),
  ('Twitter Nigeria', 'twitter', 'https://twitter.com', 'independent', 60, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Check setup completion
SELECT COUNT(*) as source_count FROM sources;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- View all sources
SELECT name, url, bias_lean, is_active FROM sources ORDER BY name;
