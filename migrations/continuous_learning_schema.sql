-- Phase 2: Story Summaries
CREATE TABLE IF NOT EXISTS story_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_entities JSONB,
  key_facts TEXT[],
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_summaries_story_id ON story_summaries(story_id);
CREATE INDEX IF NOT EXISTS idx_story_summaries_generated_at ON story_summaries(generated_at DESC);

-- Phase 4: Knowledge Graph
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  related_entities JSONB,
  story_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_name)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_entity ON knowledge_graph(entity_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_story_ids ON knowledge_graph USING GIN(story_ids);

-- Phase 5: AI Interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  stories_referenced UUID[],
  personality TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);

-- Disable RLS for learning tables
ALTER TABLE story_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions DISABLE ROW LEVEL SECURITY;
