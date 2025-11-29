# Continuous AI Learning Implementation Plan

## Current Status
✅ **RAG System Active**
- AI searches 50-100 stories per query (was 15-30)
- Vector embeddings for semantic search
- Full content access
- 5-message conversation memory

## Phase 1: Immediate (Implemented)
✅ Increased story access: 50 normal / 100 deep thinking
✅ Lower similarity threshold: 0.3 (was 0.4)
✅ Broader keyword matching

## Phase 2: Knowledge Cache (Next - 1 week)

### Story Summaries Table
```sql
CREATE TABLE story_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_entities JSONB, -- Politicians, locations, organizations
  key_facts TEXT[],
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_summaries_story_id ON story_summaries(story_id);
```

### Benefits:
- AI can scan 500+ story summaries quickly
- Identify relevant stories, then load full content
- Faster responses

## Phase 3: Fine-tuning (Monthly - 2 weeks setup)

### Training Data Generation
After each ingestion, generate:
```json
{
  "prompt": "What happened with Tinubu's ambassadorial appointments?",
  "completion": "President Tinubu nominated 32 ambassadors including Fani-Kayode and Reno Omokri on Nov 29, 2025..."
}
```

### Fine-tuning Process:
1. **Collect**: Generate Q&A pairs from each story
2. **Format**: JSONL format for Gemini/GPT fine-tuning
3. **Train**: Monthly fine-tune with 1000+ examples
4. **Deploy**: Update model endpoint

### Cost:
- Gemini fine-tuning: ~$10-50/month
- GPT-3.5 fine-tuning: ~$20-100/month

## Phase 4: Knowledge Graph (Advanced - 1 month)

### Entity Relationships Table
```sql
CREATE TABLE knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT, -- person, organization, location, event
  entity_name TEXT,
  related_entities JSONB,
  story_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example:
```json
{
  "entity_name": "Bola Tinubu",
  "entity_type": "person",
  "related_entities": {
    "appointments": ["Fani-Kayode", "Reno Omokri"],
    "topics": ["security", "ambassadors", "INEC"],
    "locations": ["Nigeria", "Guinea-Bissau"]
  },
  "story_ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Phase 5: Conversation Learning (Advanced - 2 weeks)

### User Interaction Table
```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT,
  response TEXT,
  stories_referenced UUID[],
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Learning Loop:
1. Track which stories AI references
2. Track user satisfaction (implicit: follow-up questions)
3. Improve search relevance based on patterns
4. Generate better training data

## Implementation Priority

### Now (Done ✅)
- Expanded story access to 50/100
- Better keyword matching

### Week 1-2
- [ ] Create story_summaries table
- [ ] Generate summaries for existing stories
- [ ] Auto-generate summaries on ingestion
- [ ] Update AI to use summaries for broad search

### Month 1
- [ ] Set up fine-tuning pipeline
- [ ] Generate training data from stories
- [ ] Fine-tune Gemini model
- [ ] A/B test fine-tuned vs base model

### Month 2-3
- [ ] Build knowledge graph
- [ ] Extract entities from stories
- [ ] Connect related entities
- [ ] Enable graph-based queries

## Cost Estimate

| Feature | Monthly Cost | Benefit |
|---------|-------------|---------|
| Current RAG | $0 (included) | Good |
| Story Summaries | $0 (storage only) | Better |
| Fine-tuning | $20-100 | Best |
| Knowledge Graph | $0 (storage only) | Advanced |

## Recommended Next Step

**Implement Story Summaries (Week 1-2)**
- Low cost, high impact
- Enables AI to scan 500+ stories
- Foundation for fine-tuning
- Improves response speed

Would you like me to implement the story summaries system first?
