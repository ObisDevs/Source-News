# Supabase pg_cron Setup Guide

Your pg_cron jobs are now active in Supabase. They are scheduled to run every 15 minutes, but they are using **placeholder values** that need to be replaced with actual credentials.

## Status

✅ Two cron jobs created and active:
- `ingest_news_pgcron` – every 15 minutes
- `process_stories_pgcron` – every 15 minutes (offset by 2 minutes)

⚠️ **Jobs are currently failing because they use placeholder values:**
- `YOUR_VERCEL_URL` (should be your Vercel deployment URL)
- `CRON_SECRET` (should be your rotated Bearer token)

## Steps to Finalize

### 1. Rotate Your `CRON_SECRET`

Generate a new secure random secret:
```bash
openssl rand -hex 32
# Example output: 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a9f3c2b9e1a7d5f4c6b8e2a9f3d5c7b
```

Store this securely in:
- **Vercel** → Project Settings → Environment Variables → `CRON_SECRET`
- **Supabase** → As part of the cron job update (below)

### 2. Update the Supabase Cron Jobs

In your Supabase SQL editor, replace the placeholder jobs with actual values:

```sql
-- First, unschedule the old jobs
SELECT cron.unschedule('ingest_news_pgcron');
SELECT cron.unschedule('process_stories_pgcron');

-- Then schedule new jobs with actual credentials
SELECT cron.schedule(
  'ingest_news_pgcron',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://source-news.vercel.app/api/worker/ingest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_NEW_SECRET_HERE"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'process_stories_pgcron',
  '2-59/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://source-news.vercel.app/api/worker/process',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_NEW_SECRET_HERE"}'::jsonb
  );
  $$
);

-- Verify the jobs are active
SELECT * FROM cron.job WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron');
```

**Replace:**
- `https://source-news.vercel.app` with your actual Vercel URL (or preview URL if testing)
- `YOUR_NEW_SECRET_HERE` with the rotated secret from step 1

### 3. Verify in Supabase

After updating:
1. Go to **Supabase → Project → Logs** (or **Extensions → pg_cron**)
2. Watch for successful HTTP POST calls at :15 and :17 (or :02, :17, :32, :47) past each hour
3. Check for any errors in the logs

### 4. Monitor Vercel Logs

In Vercel dashboard:
1. Go to **Project → Logs**
2. Look for incoming requests to `/api/worker/ingest` and `/api/worker/process`
3. Verify `200 OK` responses or check error details if jobs are failing

## Troubleshooting

**Jobs still failing?**
- Confirm Vercel URL is publicly accessible (not localhost)
- Verify `CRON_SECRET` matches between Supabase and Vercel environment variables
- Check Supabase logs for HTTP errors (e.g., 401 Unauthorized = wrong secret)
- Verify the database service role key has permission to call HTTP endpoints

**Need to disable?**
```sql
SELECT cron.unschedule('ingest_news_pgcron');
SELECT cron.unschedule('process_stories_pgcron');
```

## Additional Notes

- Supabase pg_cron runs **inside your database** and is not subject to Vercel Hobby plan limitations
- If you also have Vercel cron jobs enabled (`vercel.json`), both schedulers will run — you may want to disable one to avoid duplicate ingestion
- pg_cron is **more reliable** than Vercel Hobby for frequent scheduling
