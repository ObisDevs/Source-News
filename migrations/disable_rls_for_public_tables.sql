-- Disable RLS on public content tables for read access
-- This allows the AI chat to access all news data

-- Stories and related tables should be publicly readable
ALTER TABLE stories_raw DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_sentiment DISABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stories_raw', 'sources', 'social_sentiment', 'embeddings', 'story_reactions', 'comments', 'ai_explanations');

-- Expected result: rowsecurity = false for all tables
