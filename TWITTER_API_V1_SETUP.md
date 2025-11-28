# Twitter API v1 Integration Guide

## What You Can Do With Twitter API v1 Free

With Twitter API v1 free tier, you get:
- **Search tweets**: Up to 100 tweets per request
- **Rate limit**: 180 requests per 15 minutes
- **Real-time data**: Actual tweets from the last 7 days
- **Hashtags**: Extract trending hashtags
- **Engagement**: See retweet and like counts

---

## Setup Instructions

### 1. Get Twitter API Credentials

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app (or use existing)
3. Go to "Keys and tokens" tab
4. Copy your credentials:
   - API Key
   - API Secret Key
   - Bearer Token

### 2. Add to Environment Variables

Add to your `.env` file:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 3. Test the Integration

```bash
npm run dev

# Visit any story page
# The widget will now show REAL Twitter data!
```

---

## How It Works

### Flow with Real Twitter Data

```
Story Page → API Call → Check Cache
                ↓
         Not Cached? → Extract Topics
                ↓
         Search Twitter API v1 (100 tweets)
                ↓
         Analyze Sentiment (AI + keyword matching)
                ↓
         Extract Real Hashtags
                ↓
         Save to DB → Display Results
```

### Fallback System

If Twitter API fails (rate limit, no credentials, etc.):
1. Falls back to AI simulation
2. Still provides sentiment analysis
3. User sees results either way

---

## Features Implemented

### 1. Real Tweet Search ✅
- Searches Twitter for story topics
- Gets up to 100 recent tweets
- Filters by language (English)
- Adds "Nigeria" to search for relevance

### 2. Sentiment Analysis ✅
- AI analyzes tweet content
- Keyword matching for quick sentiment
- Returns positive/negative/neutral percentages

### 3. Hashtag Extraction ✅
- Extracts real hashtags from tweets
- Shows top 5 trending hashtags
- Displays as clickable tags

### 4. Engagement Metrics ✅
- Shows total tweet count
- Real numbers from Twitter API
- Updates every hour (cached)

---

## API Limits & Best Practices

### Rate Limits
- **180 requests per 15 minutes**
- **100 tweets per request**
- **7 days of historical data**

### Optimization Strategies

1. **Aggressive Caching**
   ```typescript
   // Cache for 1 hour
   await setCache(cacheKey, sentiment, 3600);
   ```

2. **Smart Search Queries**
   ```typescript
   // Use 2-3 keywords max
   const searchQuery = `${topics.join(' OR ')} Nigeria`;
   ```

3. **Batch Processing**
   - Don't analyze every story immediately
   - Process popular stories first
   - Use background workers

---

## Code Examples

### Search Twitter

```typescript
import { searchTwitterV1 } from '@/lib/workers/twitter-api-v1';

const { tweets, totalCount } = await searchTwitterV1('Nigeria economy');
console.log(`Found ${totalCount} tweets`);
```

### Analyze Sentiment

```typescript
import { analyzeTweetsSentiment } from '@/lib/workers/twitter-api-v1';

const sentiment = await analyzeTweetsSentiment(tweets);
// { positive: 45, negative: 30, neutral: 25 }
```

### Extract Hashtags

```typescript
import { extractHashtags } from '@/lib/workers/twitter-api-v1';

const hashtags = extractHashtags(tweets);
// ['Nigeria', 'Economy', 'Policy', 'News', 'Breaking']
```

---

## Monitoring Usage

### Check Rate Limits

Twitter API returns rate limit info in headers:
- `x-rate-limit-limit`: Total requests allowed
- `x-rate-limit-remaining`: Requests remaining
- `x-rate-limit-reset`: When limit resets

### Track in Database

```sql
-- See how many stories have real Twitter data
SELECT COUNT(*) FROM social_sentiment 
WHERE platform = 'twitter' 
AND total_count > 0;

-- Average sentiment
SELECT 
  AVG(positive_count) as avg_positive,
  AVG(negative_count) as avg_negative
FROM social_sentiment
WHERE total_count > 0;
```

---

## Troubleshooting

### No Tweets Found

**Possible causes:**
1. Search query too specific
2. No recent tweets about topic
3. Rate limit exceeded

**Solutions:**
- Broaden search terms
- Add "Nigeria" to query
- Wait for rate limit reset
- Falls back to AI simulation

### Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solutions:**
1. Implement request queue
2. Increase cache duration
3. Process fewer stories
4. Use background workers

### Invalid Credentials

**Error**: `401 Unauthorized`

**Solutions:**
1. Check `.env` file has correct tokens
2. Regenerate tokens in Twitter dashboard
3. Verify app has search permissions

---

## Advanced Features (Future)

### 1. Tweet Streaming
- Real-time tweet monitoring
- Requires elevated access
- Not available in free tier

### 2. User Timeline
- Get tweets from specific accounts
- Track Nigerian news accounts
- Requires v1.1 endpoints

### 3. Geo-location
- Filter tweets by location
- Focus on Nigerian tweets
- Requires coordinates

---

## Cost Comparison

### Free Tier (Current)
- **Cost**: $0
- **Limit**: 180 requests/15 min
- **Data**: Last 7 days
- **Perfect for**: Testing, small apps

### Basic Tier ($100/month)
- **Cost**: $100/month
- **Limit**: 10,000 tweets/month
- **Data**: Full archive
- **Perfect for**: Production apps

### Pro Tier ($5,000/month)
- **Cost**: $5,000/month
- **Limit**: 1M tweets/month
- **Data**: Full archive + streaming
- **Perfect for**: Enterprise

---

## Testing Checklist

- [ ] Add Twitter credentials to `.env`
- [ ] Restart dev server
- [ ] Visit story page
- [ ] Check widget shows real tweet count
- [ ] Verify hashtags are real
- [ ] Test with different stories
- [ ] Monitor rate limits
- [ ] Check fallback works (remove credentials)

---

## Files Modified

```
src/lib/workers/
├── twitter-api-v1.ts          ✅ NEW - Real API integration
└── twitter-scraper.ts         ✅ UPDATED - Uses real API

src/app/api/story/[id]/social-sentiment/
└── route.ts                   ✅ UPDATED - Better search query

.env.example                   ✅ UPDATED - Twitter credentials
```

---

## Next Steps

1. **Add credentials** to `.env`
2. **Test integration** on story pages
3. **Monitor usage** in Twitter dashboard
4. **Optimize queries** based on results
5. **Consider upgrade** if hitting limits

---

**Status**: ✅ Ready to use with Twitter API v1 free tier!

**Fallback**: ✅ AI simulation if API unavailable

**Rate Limit**: 180 requests per 15 minutes
