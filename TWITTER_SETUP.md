# Twitter/X Integration Setup

## Overview
The system now supports ingesting trending Nigerian news from Twitter/X with engagement metrics (likes, retweets, replies).

## Setup Steps

### 1. Get Twitter API Access
1. Go to https://developer.twitter.com/
2. Create a developer account
3. Create a new App
4. Generate Bearer Token (API v2)

### 2. Add Environment Variable
Add to `.env.local`:
```bash
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 3. Run Database Migration
Execute in Supabase SQL Editor:
```sql
-- Run migrations/add_twitter_source.sql
```

This creates:
- Twitter Nigeria source
- `story_reactions` table (likes, dislikes, bookmarks)
- `story_comments` table (user comments with threading)

### 4. Features

#### Twitter Ingestion
- Searches for: `(Nigeria OR Nigerian OR Lagos OR Abuja) (news OR breaking)`
- Filters: English language, no retweets
- Minimum engagement: 10+ likes/retweets
- Runs every 15 minutes with other sources

#### Engagement Metrics
Stored in metadata:
- `likes`: Like count
- `retweets`: Retweet count
- `replies`: Reply count
- `engagement_score`: Total engagement
- `tweet_id`: Original tweet ID

#### User Interactions
New tables support:
- **Reactions**: Like, dislike, bookmark stories
- **Comments**: User comments with threading (replies to comments)

## API Endpoints (To Be Created)

### Reactions
- `POST /api/story/[id]/react` - Add reaction
- `GET /api/story/[id]/reactions` - Get reaction counts

### Comments
- `POST /api/story/[id]/comment` - Add comment
- `GET /api/story/[id]/comments` - Get comments
- `POST /api/comment/[id]/reply` - Reply to comment

## Rate Limits
Twitter API v2 (Essential):
- 500,000 tweets/month
- ~16,000 tweets/day
- 50 tweets per request

## Notes
- Twitter content is marked as `independent` bias
- Lower credibility score (60) due to unverified nature
- Engagement metrics help identify trending stories
- Can be disabled by removing `TWITTER_BEARER_TOKEN`
