# SOURCE-NEWS: COMPLETE DATABASE SCHEMA & SQL

## TABLE OF CONTENTS
1. [Extensions](#extensions)
2. [Core Tables](#core-tables)
3. [Indexes](#indexes)
4. [Functions](#functions)
5. [Row Level Security (RLS) Policies](#row-level-security-policies)
6. [Triggers](#triggers)

---

## EXTENSIONS

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## CORE TABLES

### 1. Sources Table

```sql
CREATE TABLE sources (
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

COMMENT ON TABLE sources IS 'News sources and their credibility metrics';
```

### 2. Stories Raw Table

```sql
CREATE TABLE stories_raw (
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

COMMENT ON TABLE stories_raw IS 'Raw ingested news articles before clustering';
COMMENT ON COLUMN stories_raw.fingerprint IS 'SHA-256 hash for duplicate detection';
COMMENT ON COLUMN stories_raw.canonical_url IS 'Normalized URL without tracking parameters';
```

### 3. Story Clusters Table

```sql
CREATE TABLE story_clusters (
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

COMMENT ON TABLE story_clusters IS 'Grouped stories representing the same news event';
COMMENT ON COLUMN story_clusters.news_score IS 'Calculated importance score (0-100)';
COMMENT ON COLUMN story_clusters.sentiment_score IS 'Overall sentiment (-1 to 1)';
```

### 4. Cluster Items Table

```sql
CREATE TABLE cluster_items (
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 0.8 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cluster_id, story_id)
);

COMMENT ON TABLE cluster_items IS 'Junction table linking stories to clusters';
COMMENT ON COLUMN cluster_items.relevance_score IS 'Similarity score (0-1) for this story in cluster';
```

### 5. Embeddings Table

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE UNIQUE,
  title_vector VECTOR(1536),
  content_vector VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE embeddings IS 'Vector embeddings for semantic similarity search';
COMMENT ON COLUMN embeddings.title_vector IS 'OpenAI text-embedding-3-small (1536 dimensions)';
```

### 6. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'premium', 'gold')),
  preferences JSONB DEFAULT '{"theme": "light", "bias_filter": "all"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles and subscription information';
```

### 7. User Usage Table

```sql
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  ai_explanations_used INTEGER DEFAULT 0,
  bias_checks_used INTEGER DEFAULT 0,
  searches_performed INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

COMMENT ON TABLE user_usage IS 'Daily usage tracking for tier enforcement';
```

### 8. Bookmarks Table

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

COMMENT ON TABLE bookmarks IS 'User-saved story clusters';
```

### 9. Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

COMMENT ON TABLE reports IS 'User-reported content for moderation';
```

### 10. AI Explanations Cache Table

```sql
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES story_clusters(id) ON DELETE CASCADE UNIQUE,
  explanation TEXT NOT NULL,
  key_facts JSONB,
  sentiment_analysis JSONB,
  viewpoints JSONB,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 hours')
);

COMMENT ON TABLE ai_explanations IS 'Cached AI-generated explanations';
```

---

## INDEXES

```sql
-- Stories Raw Indexes
CREATE INDEX idx_stories_raw_source_id ON stories_raw(source_id);
CREATE INDEX idx_stories_raw_published_at ON stories_raw(published_at DESC);
CREATE INDEX idx_stories_raw_fingerprint ON stories_raw(fingerprint);
CREATE INDEX idx_stories_raw_processed ON stories_raw(processed) WHERE processed = false;
CREATE INDEX idx_stories_raw_canonical_url ON stories_raw(canonical_url);

-- Story Clusters Indexes
CREATE INDEX idx_story_clusters_created_at ON story_clusters(created_at DESC);
CREATE INDEX idx_story_clusters_trending ON story_clusters(is_trending) WHERE is_trending = true;
CREATE INDEX idx_story_clusters_category ON story_clusters(category);
CREATE INDEX idx_story_clusters_news_score ON story_clusters(news_score DESC);

-- Cluster Items Indexes
CREATE INDEX idx_cluster_items_story_id ON cluster_items(story_id);
CREATE INDEX idx_cluster_items_cluster_id ON cluster_items(cluster_id);

-- Embeddings Indexes (pgvector)
CREATE INDEX idx_embeddings_title_vector ON embeddings USING ivfflat (title_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_content_vector ON embeddings USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_story_id ON embeddings(story_id);

-- User Usage Indexes
CREATE INDEX idx_user_usage_user_date ON user_usage(user_id, date DESC);

-- Bookmarks Indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Reports Indexes
CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- AI Explanations Indexes
CREATE INDEX idx_ai_explanations_cluster_id ON ai_explanations(cluster_id);
CREATE INDEX idx_ai_explanations_expires_at ON ai_explanations(expires_at);
```

---

## FUNCTIONS

### 1. Vector Similarity Search Function

```sql
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

COMMENT ON FUNCTION match_stories IS 'Find similar stories using cosine similarity';
```

### 2. Update Cluster Bias Distribution

```sql
CREATE OR REPLACE FUNCTION update_cluster_bias_distribution(cluster_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  bias_counts JSONB;
BEGIN
  SELECT jsonb_object_agg(
    COALESCE(s.bias_lean, 'independent'),
    count
  )
  INTO bias_counts
  FROM (
    SELECT 
      src.bias_lean,
      COUNT(*) as count
    FROM cluster_items ci
    JOIN stories_raw sr ON ci.story_id = sr.id
    JOIN sources src ON sr.source_id = src.id
    WHERE ci.cluster_id = cluster_uuid
    GROUP BY src.bias_lean
  ) subquery;

  UPDATE story_clusters
  SET 
    bias_distribution = COALESCE(bias_counts, '{}'),
    updated_at = NOW()
  WHERE id = cluster_uuid;
END;
$$;

COMMENT ON FUNCTION update_cluster_bias_distribution IS 'Recalculate bias distribution for a cluster';
```

### 3. Calculate News Score

```sql
CREATE OR REPLACE FUNCTION calculate_news_score(cluster_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  source_count INTEGER;
  avg_credibility FLOAT;
  recency_hours FLOAT;
  score INTEGER;
BEGIN
  SELECT 
    COUNT(DISTINCT sr.source_id),
    AVG(s.credibility_score),
    EXTRACT(EPOCH FROM (NOW() - MAX(sr.published_at))) / 3600
  INTO source_count, avg_credibility, recency_hours
  FROM cluster_items ci
  JOIN stories_raw sr ON ci.story_id = sr.id
  JOIN sources s ON sr.source_id = s.id
  WHERE ci.cluster_id = cluster_uuid;

  -- Score formula: (source_count * 10) + (avg_credibility / 2) - (recency_hours / 24 * 10)
  score := LEAST(100, GREATEST(0, 
    (source_count * 10) + 
    (COALESCE(avg_credibility, 50) / 2) - 
    (COALESCE(recency_hours, 0) / 24 * 10)
  ));

  UPDATE story_clusters
  SET news_score = score, updated_at = NOW()
  WHERE id = cluster_uuid;

  RETURN score;
END;
$$;

COMMENT ON FUNCTION calculate_news_score IS 'Calculate importance score based on sources, credibility, and recency';
```

### 4. Clean Expired AI Explanations

```sql
CREATE OR REPLACE FUNCTION clean_expired_explanations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_explanations
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION clean_expired_explanations IS 'Remove expired AI explanation cache entries';
```

---

## ROW LEVEL SECURITY POLICIES

### Enable RLS on Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
```

### Users Table Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything
CREATE POLICY "Service role full access"
  ON users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

### User Usage Policies

```sql
-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update usage
CREATE POLICY "Service role can manage usage"
  ON user_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

### Bookmarks Policies

```sql
-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);
```

### Reports Policies

```sql
-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin users can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.preferences->>'role' = 'admin'
    )
  );

-- Admin users can update reports
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.preferences->>'role' = 'admin'
    )
  );
```

### Public Read Access for Content

```sql
-- Public can read sources
CREATE POLICY "Public can view active sources"
  ON sources FOR SELECT
  USING (is_active = true);

-- Public can read stories
CREATE POLICY "Public can view stories"
  ON stories_raw FOR SELECT
  USING (true);

-- Public can read clusters
CREATE POLICY "Public can view clusters"
  ON story_clusters FOR SELECT
  USING (true);

-- Public can read cluster items
CREATE POLICY "Public can view cluster items"
  ON cluster_items FOR SELECT
  USING (true);

-- Public can read AI explanations
CREATE POLICY "Public can view AI explanations"
  ON ai_explanations FOR SELECT
  USING (expires_at > NOW());
```

---

## TRIGGERS

### 1. Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_clusters_updated_at
  BEFORE UPDATE ON story_clusters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Auto-create User Profile Trigger

```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

### 3. Update Cluster Stats on Item Add

```sql
CREATE OR REPLACE FUNCTION update_cluster_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update bias distribution
  PERFORM update_cluster_bias_distribution(NEW.cluster_id);
  
  -- Recalculate news score
  PERFORM calculate_news_score(NEW.cluster_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_cluster_item_added
  AFTER INSERT ON cluster_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cluster_stats();
```

---

## INITIAL DATA SEEDING

### Seed Nigerian News Sources

```sql
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
  ('Sahara Reporters', 'rss', 'https://saharareporters.com/feeds/latest/feed', 'left', 70, true);
```

---

## MAINTENANCE QUERIES

### Archive Old Stories (30+ days)

```sql
-- Move to archive table or delete
DELETE FROM stories_raw
WHERE published_at < NOW() - INTERVAL '30 days'
AND id NOT IN (SELECT story_id FROM cluster_items);
```

### Rebuild Vector Indexes

```sql
REINDEX INDEX idx_embeddings_title_vector;
REINDEX INDEX idx_embeddings_content_vector;
```

### Vacuum and Analyze

**Note**: VACUUM cannot run inside a transaction block. Run these commands separately in psql or via direct database connection, not in Supabase SQL Editor.

```sql
-- Run each command separately outside of transactions
VACUUM ANALYZE stories_raw;
```

```sql
VACUUM ANALYZE story_clusters;
```

```sql
VACUUM ANALYZE embeddings;
```

**Alternative**: Use Supabase's automatic VACUUM or run via psql:
```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -c "VACUUM ANALYZE stories_raw;"
```

---

## BACKUP & RESTORE

### Create Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or using pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore Backup

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## PERFORMANCE MONITORING QUERIES

### Check Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Check Slow Queries

```sql
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

**Database schema ready for deployment!**
