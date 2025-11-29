# Supabase Cron Fix - Summary

## What Was Wrong

Your Supabase pg_cron jobs were created with placeholder values and never actually ran:

```sql
-- Old (broken)
url := 'https://YOUR_VERCEL_URL/api/worker/ingest'
headers := '{"Authorization":"Bearer CRON_SECRET"}'
```

## What You Need to Do

### 1. Get Your Vercel URL

Find your production URL (e.g., `https://source-news.vercel.app`)

### 2. Run Test Script

```bash
cd /workspaces/Source-News
./scripts/test-cron-setup.sh https://source-news.vercel.app
```

This verifies your endpoints are working before configuring cron.

### 3. Update Supabase Cron Jobs

1. Open `/migrations/fix_pg_cron.sql`
2. Replace `YOUR_VERCEL_URL` with your actual Vercel URL
3. Copy the entire file
4. Paste into Supabase SQL Editor
5. Execute

### 4. Verify It Worked

Wait 15 minutes, then check in Supabase SQL Editor:

```sql
SELECT 
  j.jobname,
  r.start_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname IN ('ingest_news_pgcron', 'process_stories_pgcron')
ORDER BY r.start_time DESC 
LIMIT 5;
```

You should see recent runs with `status = 'succeeded'`.

## Files Created

1. **`/migrations/fix_pg_cron.sql`** - SQL script to fix the cron jobs
2. **`/scripts/test-cron-setup.sh`** - Bash script to test endpoints
3. **`FIX_SUPABASE_CRON.md`** - Quick reference guide
4. **`CRON_TROUBLESHOOTING.md`** - Detailed troubleshooting
5. **`SUPABASE_PGCRON_SETUP.md`** - Updated with actual credentials

## What Happens After Fix

Once fixed, your ingestion will run automatically:

- **Every 15 minutes** via Supabase pg_cron
- **Once daily** via Vercel cron (1 AM UTC)

This ensures:
- Fresh news every 15 minutes
- No manual intervention needed
- Redundancy (both schedulers active)

## Credentials

Your CRON_SECRET is already configured:
```
8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a
```

Make sure this is in:
- ✅ `.env` file (already there)
- ⚠️ Vercel environment variables (verify this)

## Quick Commands

```bash
# Test endpoints
./scripts/test-cron-setup.sh https://YOUR_VERCEL_URL

# Manual ingestion (local)
curl -X POST http://localhost:3000/api/worker/ingest \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"

# Manual ingestion (production)
curl -X POST https://YOUR_VERCEL_URL/api/worker/ingest \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
```

## Troubleshooting

If jobs still don't run after 15 minutes:

1. Check `CRON_TROUBLESHOOTING.md`
2. Verify Vercel has `CRON_SECRET` in environment variables
3. Check Supabase logs for HTTP errors
4. Check Vercel logs for incoming requests
5. Ensure pg_cron extension is enabled

## Next: AI Chat

Once cron is fixed, we'll add AI chat to the main page.
