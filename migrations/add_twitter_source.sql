-- Add Twitter Nigeria source to database
INSERT INTO sources (name, type, url, bias_lean, credibility_score, is_active)
VALUES ('Twitter Nigeria', 'twitter', 'https://twitter.com', 'independent', 60, true);

-- Add reactions table for likes/comments
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike', 'bookmark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id, reaction_type)
);

CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX idx_story_reactions_user_id ON story_reactions(user_id);

-- Add comments table
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX idx_story_comments_parent ON story_comments(parent_comment_id);
