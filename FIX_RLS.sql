-- Fix RLS policies to allow service role access
-- Run this in Supabase SQL Editor

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role full access sources" ON sources;
DROP POLICY IF EXISTS "Service role full access stories" ON stories_raw;
DROP POLICY IF EXISTS "Service role full access clusters" ON story_clusters;
DROP POLICY IF EXISTS "Service role full access cluster_items" ON cluster_items;
DROP POLICY IF EXISTS "Service role full access embeddings" ON embeddings;

-- Create new policies that work with service role
CREATE POLICY "Service role bypass" ON sources FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role bypass stories" ON stories_raw FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role bypass clusters" ON story_clusters FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role bypass cluster_items" ON cluster_items FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role bypass embeddings" ON embeddings FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify sources are now accessible
SELECT COUNT(*) FROM sources;
SELECT name FROM sources LIMIT 5;
