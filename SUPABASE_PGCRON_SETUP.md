# Supabase pg_cron Setup Guide

## Quick Fix

**Current CRON_SECRET:** `8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`

### Steps to Fix:

1. **Get your Vercel deployment URL** (e.g., `https://source-news.vercel.app`)

2. **Run the fix script in Supabase SQL Editor:**
   - Open `/migrations/fix_pg_cron.sql`
   - Replace `YOUR_VERCEL_URL` with your actual Vercel URL
   - Copy and paste into Supabase SQL Editor
   - Execute the script

3. **Verify the jobs are scheduled:**
```sql
SELECT jobid, jobname, schedule, command, active 
FROM cron.job 
WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron');
```

4. **Wait 15 minutes and check job runs:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron'))
ORDER BY start_time DESC 
LIMIT 10;
```

## What's Configured

✅ **CRON_SECRET** is already set in `.env`: `8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`
✅ **API routes** are protected with Bearer token authentication
✅ **Vercel cron** runs once daily at 1 AM (Hobby plan limit)
✅ **Supabase pg_cron** will run every 15 minutes (no plan limits)

## Schedule Details

- **ingest_news_pgcron**: Every 15 minutes (`:00, :15, :30, :45`)
- **process_stories_pgcron**: Every 15 minutes offset by 2 minutes (`:02, :17, :32, :47`)

This ensures ingestion completes before processing starts

## Monitoring

### Check Supabase Logs
1. Go to **Supabase → Project → Logs**
2. Filter for HTTP requests
3. Look for POST calls to your Vercel URL
4. Check for `200 OK` responses

### Check Vercel Logs
1. Go to **Vercel → Project → Logs**
2. Look for `/api/worker/ingest` and `/api/worker/process` requests
3. Verify successful responses with ingestion counts

### Check Job Run History
```sql
SELECT 
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%pgcron')
ORDER BY start_time DESC 
LIMIT 20;
```

## Troubleshooting

**401 Unauthorized Error:**
- CRON_SECRET mismatch between Supabase SQL and Vercel env
- Make sure Vercel has `CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a` in environment variables

**Connection Timeout:**
- Vercel URL is incorrect or not deployed
- Use production URL, not localhost

**Jobs Not Running:**
```sql
-- Check if jobs are active
SELECT * FROM cron.job WHERE active = true;

-- Manually trigger a job to test
SELECT cron.schedule('test_ingest', '* * * * *', $$
  SELECT net.http_post(
    url := 'https://YOUR_VERCEL_URL/api/worker/ingest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"}'::jsonb
  );
$$);

-- Wait 1 minute, then check results and unschedule
SELECT * FROM cron.job_run_details WHERE jobname = 'test_ingest';
SELECT cron.unschedule('test_ingest');
```

**Disable Cron Jobs:**
```sql
SELECT cron.unschedule('ingest_news_pgcron');
SELECT cron.unschedule('process_stories_pgcron');
```

## Notes

- Supabase pg_cron runs **inside your database** (no Vercel plan limits)
- Vercel cron (once daily) + Supabase cron (every 15 min) = both will run
- This is intentional for redundancy and frequent updates
- pg_cron is more reliable for frequent scheduling
