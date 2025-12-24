# Analytics System Implementation

## Overview
Comprehensive analytics system integrated into Source-News admin panel to track user behavior and site metrics.

## Database Schema

### analytics_events Table
```sql
- id: uuid (primary key)
- event_type: text (indexed)
- user_id: uuid (nullable, foreign key to auth.users)
- session_id: text (indexed)
- story_id: uuid (nullable, foreign key to stories_raw)
- event_data: jsonb
- device_info: jsonb
- page_url: text
- referrer: text
- ip_hash: text
- created_at: timestamptz (indexed)
```

### analytics_dashboard Materialized View
Aggregates events by hour and type for fast dashboard queries.

## 15 Analytics Features Implemented

### 1. **Story Engagement Metrics**
- Tracks: views, time spent, scroll depth, completion rate
- Location: `story_view`, `story_complete` events
- Uses: reading_history table + analytics_events

### 2. **Source Credibility Impact**
- Tracks: bookmarks, shares, external clicks per source
- Location: bookmarks table + analytics_events
- Validates credibility scores

### 3. **Bias Filter Usage**
- Tracks: bias filter selections and story views by bias
- Location: `bias_filter` events
- Identifies echo chamber behavior

### 4. **AI Chat Analytics**
- Tracks: personality usage, deep thinking, satisfaction
- Location: ai_interactions table + `ai_chat` events
- Optimizes AI responses

### 5. **Search Behavior**
- Tracks: queries, refinements, result clicks
- Location: `search`, `search_click` events
- Improves search relevance

### 6. **Category Performance**
- Tracks: views, time spent, engagement by category
- Location: reading_history + analytics_events
- Guides content strategy

### 7. **User Journey Mapping**
- Tracks: navigation paths, entry/exit points
- Location: session_id grouping in analytics_events
- Optimizes user flow

### 8. **Reaction Patterns**
- Tracks: quick reactions, sentiment distribution
- Location: story_reactions table
- Validates AI sentiment accuracy

### 9. **Bookmark & Reading List**
- Tracks: save behavior, revisit patterns
- Location: bookmarks table
- Measures content value

### 10. **Timeline & Event Map Usage**
- Tracks: visualization interactions
- Location: `timeline_interaction`, `event_map_interaction` events
- Justifies feature development

### 11. **Subscription Conversion Funnel**
- Tracks: free-to-paid conversion journey
- Location: user_usage + user_subscriptions tables
- Optimizes pricing

### 12. **Social Sentiment Widget**
- Tracks: widget engagement
- Location: `social_sentiment_view` events + social_sentiment table
- Validates Twitter integration

### 13. **Performance Metrics**
- Tracks: load times, device types, connection speeds
- Location: device_info in analytics_events
- Identifies bottlenecks

### 14. **Content Discovery Patterns**
- Tracks: how users find stories
- Location: referrer + page_url in analytics_events
- Optimizes content placement

### 15. **Cluster Quality Metrics**
- Tracks: clustering accuracy via user behavior
- Location: reading_history + story_clusters
- Improves clustering algorithm

## Files Created

1. `/migrations/analytics_system.sql` - Database schema
2. `/src/lib/analytics/tracker.ts` - Client-side tracker
3. `/src/app/api/analytics/route.ts` - API endpoint
4. `/src/app/admin/analytics/page.tsx` - Admin dashboard
5. `/src/components/page-view-tracker.tsx` - Page view tracking
6. `/src/components/story-view-tracker.tsx` - Story engagement tracking

## Files Modified

1. `/src/app/page.tsx` - Added PageViewTracker
2. `/src/app/story/[id]/page.tsx` - Added StoryViewTracker
3. `/src/app/admin/dashboard/page.tsx` - Added Analytics link
4. `/src/components/bookmark-button.tsx` - Added analytics tracking
5. `/src/components/quick-reactions.tsx` - Added analytics tracking

## Usage

### Client-Side Tracking
```typescript
import { analytics } from '@/lib/analytics/tracker';

// Track page view
analytics.pageView('home');

// Track story view
analytics.storyView(storyId, timeSpent, scrollDepth);

// Track search
analytics.search(query, resultsCount, filters);

// Track AI chat
analytics.aiChat(personality, deepThinking, storyAttached);

// Track bookmark
analytics.bookmark(storyId, 'add');

// Track reaction
analytics.reaction(storyId, reactionType);
```

### Admin Dashboard
Access at `/admin/analytics` to view:
- Total events, sessions, users
- Story views, searches, AI chats
- Category and source engagement
- User reactions and AI personalities
- Search queries and user tiers
- Session duration and bounce rate

## Privacy & Performance

- **Privacy-First**: Anonymous tracking for non-authenticated users
- **Non-Blocking**: Uses `navigator.sendBeacon` for async tracking
- **Efficient**: Materialized view for fast dashboard queries
- **GDPR-Compliant**: No PII stored, hashed IPs only
- **Minimal Overhead**: Single table, batch inserts

## Next Steps

1. Run migration: `psql < migrations/analytics_system.sql`
2. Refresh materialized view every 5 minutes (cron job)
3. Set up data retention policy (90 days)
4. Add real-time dashboard updates (Supabase subscriptions)
5. Export analytics reports (CSV/PDF)
