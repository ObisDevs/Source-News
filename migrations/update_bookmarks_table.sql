-- Update bookmarks table to support story_id
-- Run this in Supabase SQL Editor

-- Drop existing unique constraint
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_cluster_id_key;

-- Add story_id column if it doesn't exist
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE;

-- Add new unique constraint for story_id
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_story_id_key UNIQUE(user_id, story_id);

-- Add check constraint to ensure either story_id or cluster_id is set
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_check_id CHECK (story_id IS NOT NULL OR cluster_id IS NOT NULL);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_story_id ON bookmarks(story_id);

-- Update comment
COMMENT ON TABLE bookmarks IS 'User-saved stories and story clusters';
