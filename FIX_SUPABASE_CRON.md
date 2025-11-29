# Fix Supabase Cron Jobs - Quick Guide

## The Problem

Your Supabase pg_cron jobs were created with placeholder values (`YOUR_VERCEL_URL` and `CRON_SECRET`), so they're not actually calling your Vercel endpoints.

## The Solution (3 Steps)

### Step 1: Test Your Endpoints

Run this from your terminal (replace with your actual Vercel URL):

```bash
./scripts/test-cron-setup.sh https://source-news.vercel.app
```

This will verify:
- ✅ Ingestion endpoint is accessible
- ✅ Processing endpoint is accessible  
- ✅ Authentication is working

### Step 2: Update Supabase Cron Jobs

1. Open Supabase SQL Editor
2. Copy the contents of `/migrations/fix_pg_cron.sql`
3. Replace `YOUR_VERCEL_URL` with your actual Vercel URL (e.g., `https://source-news.vercel.app`)
4. Execute the SQL script

The script will:
- Unschedule old placeholder jobs
- Create new jobs with correct URL and CRON_SECRET
- Verify jobs are active

### Step 3: Verify It's Working

Wait 15 minutes, then run this in Supabase SQL Editor:

```sql
-- Check recent job runs
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

**Expected:** Recent timestamps with `status = 'succeeded'`

## What Gets Fixed

| Before | After |
|--------|-------|
| `url := 'https://YOUR_VERCEL_URL/...'` | `url := 'https://source-news.vercel.app/...'` |
| `"Authorization":"Bearer CRON_SECRET"` | `"Authorization":"Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"` |
| Jobs never run successfully | Jobs run every 15 minutes |

## Credentials Reference

These are already configured in your `.env` file:

```env
CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a
```

Make sure this same value is in your **Vercel Environment Variables**.

## Schedule

Once fixed, your cron jobs will run:

- **Ingestion**: `:00, :15, :30, :45` every hour
- **Processing**: `:02, :17, :32, :47` every hour

This gives ingestion 2 minutes to complete before processing starts.

## Troubleshooting

If jobs still fail after 15 minutes, see `CRON_TROUBLESHOOTING.md` for detailed diagnostics.

### Quick Checks

```sql
-- Are jobs active?
SELECT jobname, active FROM cron.job 
WHERE jobname LIKE '%pgcron';

-- Any recent runs?
SELECT COUNT(*) FROM cron.job_run_details 
WHERE start_time > NOW() - INTERVAL '1 hour';

-- Check for errors
SELECT jobname, status, return_message 
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE status = 'failed'
ORDER BY start_time DESC 
LIMIT 5;
```

## Need Help?

1. Run the test script: `./scripts/test-cron-setup.sh YOUR_VERCEL_URL`
2. Check `CRON_TROUBLESHOOTING.md` for common issues
3. Verify Vercel environment variables include `CRON_SECRET`
4. Check Vercel logs for incoming requests from Supabase
