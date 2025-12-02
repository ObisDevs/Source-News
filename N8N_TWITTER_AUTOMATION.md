# N8N Twitter Automation Workflow for Source-News

## Auto-Post Top Nigerian News to Twitter (Supabase Version)

This workflow automatically selects the most relevant/popular news from today, generates a tweet, posts to Twitter, and tracks posted stories using Supabase.

**Note**: The `posted_tweets` table is ONLY for n8n automation tracking. It does not add any features to the Source-News app - it simply stores which stories have been tweeted to prevent duplicate posts.

---

## Workflow Structure (8 Nodes)

```
[Schedule: 5pm Daily] 
  ↓
[HTTP: Get Top Stories] 
  ↓
[Split In Batches] 
  ↓
[HTTP: Check if Posted] 
  ↓
[IF: Not Posted Yet] 
  ↓
[OpenAI: Generate Tweet] 
  ↓
[Twitter: Post Tweet] 
  ↓
[HTTP: Mark as Posted]
```

---

## Prerequisites

### 1. Database Setup ✅
Run this in Supabase SQL Editor:
```sql
-- File: /migrations/posted_tweets_table.sql
CREATE TABLE IF NOT EXISTS posted_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories_raw(id) ON DELETE CASCADE,
  story_url TEXT UNIQUE NOT NULL,
  title TEXT,
  tweet_text TEXT,
  tweet_url TEXT,
  category TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posted_tweets_story_url ON posted_tweets(story_url);
```

### 2. API Endpoints ✅
Three endpoints are ready:
- `GET /api/social/top-stories` - Fetches top 10 stories
- `POST /api/social/check-posted` - Checks if already posted
- `POST /api/social/mark-posted` - Records posted tweet

### 3. Test APIs
```bash
# Production URL
curl https://source-news.vercel.app/api/social/top-stories \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
```

---

## N8N Workflow Configuration

### Node 1: Schedule Trigger

**Type**: Schedule Trigger
- **Mode**: Cron
- **Cron Expression**: `0 17 * * *`
- **Timezone**: Africa/Lagos (WAT)

**Purpose**: Triggers workflow daily at 5pm Nigerian time

---

### Node 2: HTTP Request - Get Top Stories

**Type**: HTTP Request
- **Method**: GET
- **URL**: `https://source-news.vercel.app/api/social/top-stories`
- **Authentication**: Generic Credential Type
  - **Name**: Authorization
  - **Value**: `Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`
- **Options**:
  - Response Format: JSON
  - JSON/RAW Parameters: Enabled

**Output**: 
```json
{
  "stories": [
    {
      "id": "uuid",
      "title": "Story title",
      "url": "https://source.com/article",
      "story_url": "https://source-news.vercel.app/story/uuid",
      "category": "Politics",
      "source_name": "Vanguard",
      "bias_lean": "centre"
    }
  ]
}
```

**Access data**: `{{ $json.stories }}`

---

### Node 3: Split In Batches

**Type**: Split In Batches
- **Batch Size**: 1
- **Options**: Reset after each batch

**Purpose**: Process one story at a time to check if already posted

---

### Node 4: HTTP Request - Check if Posted

**Type**: HTTP Request
- **Method**: POST
- **URL**: `https://source-news.vercel.app/api/social/check-posted`
- **Authentication**: Same as Node 2
- **Send Body**: Yes
- **Body Content Type**: JSON
- **Specify Body**: Using JSON
- **JSON**:
  ```json
  {
    "story_url": "={{ $json.url }}"
  }
  ```

**Output**:
```json
{
  "already_posted": false,
  "posted_at": null
}
```

---

### Node 5: IF - Not Posted Yet

**Type**: IF
- **Conditions**:
  - **Condition 1**:
    - Value 1: `={{ $json.already_posted }}`
    - Operation: Equal
    - Value 2: `false`

**Routing**:
- **True**: Continue to OpenAI (Node 6)
- **False**: End (skip this story)

---

### Node 6: OpenAI - Generate Tweet

**Type**: OpenAI
- **Resource**: Chat
- **Operation**: Message a Model
- **Model**: gpt-4o-mini
- **Prompt**:
  ```
  Generate a compelling tweet for this Nigerian news story.
  
  Title: {{ $('Split In Batches').item.json.title }}
  Category: {{ $('Split In Batches').item.json.category }}
  Source: {{ $('Split In Batches').item.json.source_name }}
  
  Requirements:
  - Maximum 200 characters (leave room for URL)
  - Use Nigerian context and tone
  - NO emojis (minimalistic style)
  - Make it engaging and newsworthy
  - Don't use hashtags
  - Be direct and factual
  
  Return ONLY the tweet text, nothing else.
  ```

**Options**:
- Temperature: 0.7
- Max Tokens: 100

**Output**: `{{ $json.message.content }}`

---

### Node 7: Twitter - Post Tweet

**Type**: Twitter
- **Credential**: Twitter OAuth1 API
- **Resource**: Tweet
- **Operation**: Create
- **Text**:
  ```
  {{ $json.message.content }}

  {{ $('Split In Batches').item.json.story_url }}
  ```

**Twitter API Credentials**:
- **API Key**: `9EKuIs5hxUj1hObCTPomnpFOA`
- **API Secret**: `BU0wf2twkmItbZ5fYi0dVXdP7oCj6a25U0k3j2QFrxDVM9IYwP`
- **Access Token**: (Generate from developer.twitter.com)
- **Access Token Secret**: (Generate from developer.twitter.com)

**Output**: Tweet object with URL in `{{ $json.url }}`

---

### Node 8: HTTP Request - Mark as Posted

**Type**: HTTP Request
- **Method**: POST
- **URL**: `https://source-news.vercel.app/api/social/mark-posted`
- **Authentication**: Same as Node 2
- **Send Body**: Yes
- **Body Content Type**: JSON
- **Specify Body**: Using JSON
- **JSON**:
  ```json
  {
    "story_id": "={{ $('Split In Batches').item.json.id }}",
    "story_url": "={{ $('Split In Batches').item.json.url }}",
    "title": "={{ $('Split In Batches').item.json.title }}",
    "tweet_text": "={{ $('OpenAI').item.json.message.content }}",
    "tweet_url": "={{ $json.url }}",
    "category": "={{ $('Split In Batches').item.json.category }}"
  }
  ```

**Purpose**: Records tweet in Supabase `posted_tweets` table to prevent duplicates

**Important**: This table is ONLY used by n8n for tracking. It has no impact on the Source-News app functionality.

---

## Alternative: Webhook Trigger (Instead of Schedule)

If you want to trigger manually or via API instead of schedule:

### Node 1: Webhook Trigger

**Type**: Webhook
- **HTTP Method**: GET or POST
- **Path**: `twitter-post` (or any custom path)
- **Authentication**: Header Auth
  - **Name**: Authorization
  - **Value**: `Bearer YOUR_WEBHOOK_SECRET`
- **Response Mode**: When Last Node Finishes
- **Response Code**: 200

**Webhook URL**: `https://your-n8n-instance.com/webhook/twitter-post`

**To trigger**:
```bash
curl -X POST https://your-n8n-instance.com/webhook/twitter-post \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET"
```

**Then connect to Node 2 (HTTP Request - Get Top Stories)**

---

## Testing Workflow

### 1. Test Each Node Individually

1. **Test Node 2**: Click "Execute Node" to fetch stories
2. **Test Node 4**: Verify it checks Supabase correctly
3. **Test Node 6**: Check AI generates good tweets (NO emojis)
4. **Test Node 7**: Post a test tweet (use test account first)

### 2. Test Full Workflow

1. Click "Execute Workflow" in n8n
2. Watch each node execute
3. Check Supabase `posted_tweets` table
4. Verify tweet on Twitter
5. Run again to test duplicate prevention

### 3. Test Duplicate Prevention

Run workflow twice - second run should skip already-posted stories

---

## Monitoring & Analytics

### Query Supabase

```sql
-- Total tweets posted
SELECT COUNT(*) FROM posted_tweets;

-- Tweets posted today
SELECT COUNT(*) FROM posted_tweets 
WHERE posted_at::date = CURRENT_DATE;

-- Most posted categories
SELECT category, COUNT(*) as count 
FROM posted_tweets 
GROUP BY category 
ORDER BY count DESC;

-- Recent tweets
SELECT title, tweet_url, posted_at 
FROM posted_tweets 
ORDER BY posted_at DESC 
LIMIT 10;
```

---

## Workflow Variations

### Option A: Post Multiple Times Daily

Change Node 1 cron to: `0 9,13,17,21 * * *` (9am, 1pm, 5pm, 9pm)

### Option B: Post Only 1 Story

Keep Node 3 batch size at 1, but add IF node after Node 2 to check if any stories exist, then only process first one

### Option C: Category-Specific Times

Add IF node after Node 2:
- Politics: 5pm
- Business: 9am  
- Sports: 8pm

---

## Safety Features

✅ **Duplicate Prevention**: Checks Supabase before posting (UNIQUE constraint)  
✅ **Today's News Only**: API filters by published_at date  
✅ **Recency Ranking**: Posts newest stories first  
✅ **Error Handling**: IF node skips already-posted stories  
✅ **Audit Trail**: Full history in Supabase `posted_tweets` table  
✅ **No Emojis**: Follows graphic_rule.md (minimalistic style)

---

## Required Credentials

### 1. Source-News API
- **CRON_SECRET**: `8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a` (already in .env)

### 2. Twitter API
- **API Key**: `9EKuIs5hxUj1hObCTPomnpFOA` (already in .env)
- **API Secret**: `BU0wf2twkmItbZ5fYi0dVXdP7oCj6a25U0k3j2QFrxDVM9IYwP` (already in .env)
- **Access Token**: Generate at developer.twitter.com
- **Access Token Secret**: Generate at developer.twitter.com

### 3. OpenAI API
- Get API key from platform.openai.com
- Add to n8n credentials
- Model: gpt-4o-mini (fast and cheap)

---

## Expected Output

**Daily at 5pm:**
- ✅ Fetches top 10 stories from today
- ✅ Checks which ones haven't been posted
- ✅ Generates engaging tweet with AI (NO emojis)
- ✅ Posts to Twitter with Source-News URL
- ✅ Records in Supabase
- ✅ Prevents duplicates automatically

**Example Tweet:**
```
President Tinubu nominates 32 new ambassadors including Fani-Kayode 
and Reno Omokri. Major diplomatic reshuffle underway.

https://source-news.vercel.app/story/abc123
```

**Note**: No emojis per graphic_rule.md - minimalistic style with red/blue for sentiments only.

---

## Troubleshooting

### Issue: "Unauthorized" error
- Check Authorization header has correct CRON_SECRET
- Verify Bearer token format: `Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`

### Issue: No stories returned
- Check if there are stories from today in database
- Test API directly with curl

### Issue: Duplicate tweets
- Verify Node 4 is checking correctly
- Check Supabase `posted_tweets` table has UNIQUE constraint on story_url

### Issue: Tweet too long
- Reduce OpenAI max characters to 180
- Adjust prompt to be more concise

---

## Production Checklist

- [ ] Database migration run in Supabase
- [ ] All 3 API endpoints tested
- [ ] Twitter API credentials generated
- [ ] OpenAI API key added to n8n
- [ ] Workflow tested with manual execution
- [ ] Duplicate prevention verified
- [ ] Schedule set to correct timezone (Africa/Lagos)
- [ ] Production URL updated in all HTTP nodes
- [ ] Monitoring queries saved
- [ ] Error notifications configured in n8n

---

**Ready to automate! 🚀**
