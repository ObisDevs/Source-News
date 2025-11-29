# Setup Complete

## Current Status

✅ **Homepage** - Shows raw stories from database
✅ **RSS Ingestion** - Fetches from 10+ Nigerian news sources
✅ **NewsAPI Integration** - Fetches top Nigerian headlines
✅ **Twitter Trends** - Placeholder (requires API access)
✅ **Vercel Cron** - Runs once daily at 1 AM (Hobby plan limit)
⚠️ **Supabase Cron** - Needs configuration (see below)

## Cron Jobs

### Vercel Cron (Active)
- Runs once daily at 1:00 AM UTC
- `/api/worker/ingest` - Ingests RSS + NewsAPI + Twitter
- `/api/worker/process` - Generates embeddings and clusters

### Supabase pg_cron (Needs Fix)
- Should run every 15 minutes
- Currently using placeholder values
- **Fix:** See `FIX_SUPABASE_CRON.md`

## Quick Fix for Supabase Cron

1. Test endpoints:
```bash
./scripts/test-cron-setup.sh https://YOUR_VERCEL_URL
```

2. Update cron jobs:
   - Open `/migrations/fix_pg_cron.sql`
   - Replace `YOUR_VERCEL_URL` with actual URL
   - Run in Supabase SQL Editor

3. Verify after 15 minutes:
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 5;
```

## Manual Testing

### Test Ingestion Locally
```bash
curl -X POST http://localhost:3000/api/worker/ingest \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
```

### Test Ingestion on Vercel
```bash
curl -X POST https://YOUR_VERCEL_URL/api/worker/ingest \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
```

## Environment Variables

Make sure these are set in Vercel:
- `CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`
- `NEWSAPI_KEY=82b5f44cbe324bd1ae9a8b8b05e3f11b`
- All Supabase keys
- All AI provider keys

## Next Steps

1. Fix Supabase cron (see `FIX_SUPABASE_CRON.md`)
2. Add AI chat to main page
3. Monitor ingestion logs
4. Check story counts in database
