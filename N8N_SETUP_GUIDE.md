# N8N Twitter Automation - Quick Start Guide

## What You Need to Start

### 1. Database Setup (5 minutes)
Run this SQL in your Supabase SQL Editor:

```sql
-- Execute the migration file
-- File: /migrations/posted_tweets_table.sql
```

This creates the `posted_tweets` table to track what's been posted.

### 2. API Endpoints (Already Created ✅)

Three new endpoints are ready:
- `GET /api/social/top-stories` - Fetches top 10 stories from today
- `POST /api/social/check-posted` - Checks if story already posted
- `POST /api/social/mark-posted` - Records posted tweet

All use existing `stories_raw` table - no modifications needed!

### 3. N8N Workflow (7 Nodes)

**Node 1: Schedule Trigger**
- Cron: `0 17 * * *` (5pm daily WAT)

**Node 2: HTTP Request**
- GET `https://your-domain.vercel.app/api/social/top-stories`
- Header: `Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`

**Node 3: Split In Batches**
- Batch Size: 1

**Node 4: HTTP Request**
- POST `https://your-domain.vercel.app/api/social/check-posted`
- Body: `{"story_url": "{{ $json.url }}"}`

**Node 5: IF**
- Condition: `{{ $json.already_posted }}` equals `false`

**Node 6: OpenAI**
- Model: gpt-4o-mini
- Prompt: Generate tweet (NO emojis, 200 chars max)

**Node 7: Twitter**
- Post tweet with story URL

**Node 8: HTTP Request**
- POST `https://your-domain.vercel.app/api/social/mark-posted`
- Records tweet in database

## Testing Steps

1. **Test APIs locally:**
```bash
curl http://localhost:3000/api/social/top-stories \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
```

2. **Run migration in Supabase**

3. **Build n8n workflow** (follow node configs above)

4. **Execute manually** in n8n to test

5. **Check Supabase** `posted_tweets` table for entry

## What Changed in Your Project

✅ Added 3 API routes in `/src/app/api/social/`
✅ Created migration file for `posted_tweets` table
✅ Uses existing `stories_raw` table (no changes needed)
✅ Follows graphic_rule.md (no emojis)

## Next Steps

1. Run the Supabase migration
2. Test the API endpoints
3. Set up n8n workflow
4. Generate Twitter API tokens
5. Test manually before scheduling

See `N8N_TWITTER_AUTOMATION.md` for detailed node configurations.
