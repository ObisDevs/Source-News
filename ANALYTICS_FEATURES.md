# Analytics Features - Source-News

## Current Working Features ✅

### 1. **Searches Tracking**
- Tracks every search query performed by users
- Stored in `user_usage` table with daily counts
- Incremented via `increment_user_usage()` function
- Location: `/api/search/results`

### 2. **AI Chats Tracking**
- Tracks all AI chat interactions
- Stored in `ai_interactions` table with full conversation history
- Daily counts in `user_usage` table
- Includes personality type, deep thinking mode, and referenced stories
- Location: `/api/chat`

### 3. **Bookmarks Tracking**
- Tracks all bookmark additions
- Stored in `bookmarks` table
- Daily counts in `user_usage` table
- Location: `/api/bookmarks`

### 4. **Story Views**
- Tracks reading history
- Stored in `reading_history` table
- Includes timestamp and user association

### 5. **User Reactions**
- Tracks accurate/misleading/important/biased reactions
- Stored in `story_reactions` table

### 6. **Comments & Engagement**
- Full comment system with likes
- Nested comments support
- Flagging system

---

## 5 NEW Analytics Features to Implement 🚀

### 1. **Reading Time Analytics** 📖
**Purpose**: Track how long users spend reading each story

**Implementation**:
```sql
-- Add to analytics_events or create new table
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  story_id UUID REFERENCES stories_raw(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  scroll_depth INTEGER, -- 0-100%
  completed BOOLEAN DEFAULT false,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_story ON reading_sessions(story_id);
```

**Metrics to Show**:
- Average reading time per story
- Average reading time per category
- Completion rate (% who read to end)
- Peak reading hours
- Reading speed (words per minute)

**Dashboard Visualization**:
- Heatmap of reading times by hour/day
- Story completion funnel
- Category engagement time comparison

---

### 2. **Source Credibility Trends** 🎯
**Purpose**: Track which sources users trust most over time

**Implementation**:
```sql
-- Add to existing tables
ALTER TABLE story_reactions ADD COLUMN source_id UUID REFERENCES sources(id);

-- Create aggregation view
CREATE MATERIALIZED VIEW source_trust_metrics AS
SELECT 
  s.id,
  s.name,
  s.bias_lean,
  s.credibility_score,
  COUNT(DISTINCT sr.user_id) as unique_readers,
  COUNT(CASE WHEN sr.reaction_type = 'accurate' THEN 1 END) as accurate_votes,
  COUNT(CASE WHEN sr.reaction_type = 'misleading' THEN 1 END) as misleading_votes,
  COUNT(b.id) as bookmark_count,
  AVG(rs.duration_seconds) as avg_read_time
FROM sources s
LEFT JOIN stories_raw st ON st.source_id = s.id
LEFT JOIN story_reactions sr ON sr.story_id = st.id
LEFT JOIN bookmarks b ON b.story_id = st.id
LEFT JOIN reading_sessions rs ON rs.story_id = st.id
GROUP BY s.id, s.name, s.bias_lean, s.credibility_score;

REFRESH MATERIALIZED VIEW source_trust_metrics;
```

**Metrics to Show**:
- Trust score = (accurate_votes - misleading_votes) / total_votes
- Engagement rate per source
- Source credibility vs user trust comparison
- Trending sources (gaining/losing trust)

**Dashboard Visualization**:
- Line chart: Source trust over time
- Scatter plot: Credibility score vs user trust
- Bar chart: Most/least trusted sources
- Trend indicators (↑↓) for each source

---

### 3. **Category Preference Heatmap** 🗺️
**Purpose**: Visual map of user interests by time of day/week

**Implementation**:
```sql
-- Query for heatmap data
CREATE OR REPLACE FUNCTION get_category_heatmap(
  p_user_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  category TEXT,
  hour_of_day INTEGER,
  day_of_week INTEGER,
  view_count BIGINT,
  avg_engagement NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.category,
    EXTRACT(HOUR FROM rh.viewed_at)::INTEGER as hour_of_day,
    EXTRACT(DOW FROM rh.viewed_at)::INTEGER as day_of_week,
    COUNT(*) as view_count,
    AVG(EXTRACT(EPOCH FROM (rh.viewed_at - LAG(rh.viewed_at) OVER (PARTITION BY rh.user_id ORDER BY rh.viewed_at))))::NUMERIC as avg_engagement
  FROM reading_history rh
  JOIN stories_raw sr ON sr.id = rh.story_id
  WHERE (p_user_id IS NULL OR rh.user_id = p_user_id)
    AND rh.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sr.category, hour_of_day, day_of_week;
END;
$$ LANGUAGE plpgsql;
```

**Metrics to Show**:
- Category views by hour (0-23)
- Category views by day (Mon-Sun)
- Peak engagement times per category
- User preference patterns

**Dashboard Visualization**:
- 2D Heatmap: Categories (Y-axis) × Time (X-axis)
- Color intensity = engagement level
- Interactive: Click to drill down
- Personal vs Platform-wide comparison

---

### 4. **Bias Balance Score** ⚖️
**Purpose**: Track if users are reading diverse viewpoints

**Implementation**:
```sql
-- Calculate user bias balance
CREATE OR REPLACE FUNCTION calculate_bias_balance(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH user_reads AS (
    SELECT 
      s.bias_lean,
      COUNT(*) as read_count
    FROM reading_history rh
    JOIN stories_raw sr ON sr.id = rh.story_id
    JOIN sources s ON s.id = sr.source_id
    WHERE rh.user_id = p_user_id
      AND rh.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY s.bias_lean
  ),
  total_reads AS (
    SELECT SUM(read_count) as total FROM user_reads
  ),
  bias_distribution AS (
    SELECT 
      ur.bias_lean,
      ur.read_count,
      ROUND((ur.read_count::NUMERIC / tr.total * 100), 2) as percentage
    FROM user_reads ur, total_reads tr
  ),
  balance_score AS (
    SELECT 
      CASE 
        WHEN COUNT(DISTINCT bias_lean) >= 3 THEN 100
        WHEN COUNT(DISTINCT bias_lean) = 2 THEN 60
        ELSE 20
      END as diversity_score,
      -- Calculate variance (lower = more balanced)
      ROUND(VARIANCE(percentage), 2) as variance
    FROM bias_distribution
  )
  SELECT json_build_object(
    'diversity_score', bs.diversity_score,
    'variance', bs.variance,
    'distribution', (SELECT json_agg(bd) FROM bias_distribution bd),
    'recommendation', CASE 
      WHEN bs.diversity_score < 50 THEN 'Try reading from different perspectives'
      WHEN bs.diversity_score < 80 THEN 'Good balance, explore more viewpoints'
      ELSE 'Excellent diverse reading habits!'
    END
  ) INTO result
  FROM balance_score bs;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Metrics to Show**:
- Diversity Score (0-100)
- Bias distribution pie chart
- Comparison to platform average
- Personalized recommendations
- Streak tracking (days of balanced reading)

**Dashboard Visualization**:
- Circular gauge: Bias Balance Score
- Pie chart: Left/Center/Right distribution
- Timeline: Balance score over time
- Badges: "Balanced Reader", "Open Mind", etc.

---

### 5. **Engagement Funnel Analytics** 🎯
**Purpose**: Track View → Read → React → Comment → Share conversion rates

**Implementation**:
```sql
-- Create engagement funnel view
CREATE MATERIALIZED VIEW engagement_funnel AS
WITH funnel_data AS (
  SELECT 
    sr.id as story_id,
    sr.title,
    sr.category,
    COUNT(DISTINCT rh.user_id) as viewers,
    COUNT(DISTINCT CASE WHEN rs.completed THEN rs.user_id END) as readers,
    COUNT(DISTINCT str.user_id) as reactors,
    COUNT(DISTINCT c.user_id) as commenters,
    COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.event_type = 'share') as sharers
  FROM stories_raw sr
  LEFT JOIN reading_history rh ON rh.story_id = sr.id
  LEFT JOIN reading_sessions rs ON rs.story_id = sr.id
  LEFT JOIN story_reactions str ON str.story_id = sr.id
  LEFT JOIN comments c ON c.story_id = sr.id
  LEFT JOIN analytics_events ae ON ae.story_id = sr.id
  WHERE sr.published_at >= NOW() - INTERVAL '30 days'
  GROUP BY sr.id, sr.title, sr.category
)
SELECT 
  *,
  ROUND((readers::NUMERIC / NULLIF(viewers, 0) * 100), 2) as read_rate,
  ROUND((reactors::NUMERIC / NULLIF(readers, 0) * 100), 2) as reaction_rate,
  ROUND((commenters::NUMERIC / NULLIF(reactors, 0) * 100), 2) as comment_rate,
  ROUND((sharers::NUMERIC / NULLIF(commenters, 0) * 100), 2) as share_rate,
  ROUND((sharers::NUMERIC / NULLIF(viewers, 0) * 100), 2) as overall_conversion
FROM funnel_data;

CREATE INDEX idx_engagement_funnel_story ON engagement_funnel(story_id);
CREATE INDEX idx_engagement_funnel_category ON engagement_funnel(category);
```

**Metrics to Show**:
- View → Read conversion (%)
- Read → React conversion (%)
- React → Comment conversion (%)
- Comment → Share conversion (%)
- Overall conversion rate
- Drop-off points
- Category-wise funnel performance

**Dashboard Visualization**:
- Funnel chart with drop-off percentages
- Comparison: Story vs Category vs Platform average
- Time-series: Funnel performance over time
- Heatmap: Best/worst performing stories
- Actionable insights: "Stories with X% read rate get Y% more shares"

---

## Implementation Priority

1. **Reading Time Analytics** - Easy, high value
2. **Engagement Funnel** - Medium, critical for optimization
3. **Bias Balance Score** - Medium, unique differentiator
4. **Category Heatmap** - Medium, great UX insight
5. **Source Credibility Trends** - Complex, long-term value

---

## Database Migration Order

1. Run `migrations/user_usage_tracking.sql` (already created)
2. Add reading_sessions table
3. Add source trust metrics view
4. Add category heatmap function
5. Add bias balance function
6. Add engagement funnel view

---

## API Endpoints Needed

```typescript
// GET /api/analytics/reading-time?userId=xxx&storyId=xxx
// GET /api/analytics/source-trust?sourceId=xxx&days=30
// GET /api/analytics/category-heatmap?userId=xxx
// GET /api/analytics/bias-balance?userId=xxx
// GET /api/analytics/engagement-funnel?storyId=xxx&category=xxx
```
