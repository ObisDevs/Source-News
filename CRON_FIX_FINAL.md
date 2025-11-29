# Supabase Cron - Final Fix

## The Real Problem

The error `schema "net" does not exist` means Supabase doesn't have the `net` extension for HTTP calls.

## Solution 1: Use extensions.http_post (Quick Fix)

Run the updated `/migrations/fix_pg_cron.sql` in Supabase SQL Editor.

**Changes:**
- `net.http_post` → `extensions.http_post`
- Fixed double slash in URL
- Added `body` parameter

```sql
SELECT cron.unschedule('ingest_news_pgcron');
SELECT cron.unschedule('process_stories_pgcron');

SELECT cron.schedule(
  'ingest_news_pgcron',
  '*/15 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://source-news.vercel.app/api/worker/ingest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'process_stories_pgcron',
  '2-59/15 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://source-news.vercel.app/api/worker/process',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

## Solution 2: Supabase Edge Functions (Recommended)

More reliable with better logging. See `alternative_edge_function_cron.md` for full setup.

**Quick steps:**
1. Install Supabase CLI: `npm install -g supabase`
2. Create Edge Functions for ingestion and processing
3. Schedule them in Supabase Dashboard
4. Monitor via Edge Functions logs

## Verify It Works

After running the fix, wait 15 minutes and check:

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

**Expected:** `status = 'succeeded'` with recent timestamps

## If Still Failing

Check the `return_message` field for errors:

- **401 Unauthorized**: CRON_SECRET mismatch (verify in Vercel env vars)
- **Connection timeout**: Wrong URL or Vercel app not deployed
- **Function not found**: Use Edge Functions instead

## Current Status

✅ Jobs are scheduled and active (jobid 3 and 4)
❌ Using wrong HTTP function (`net.http_post`)
🔧 Fix: Run updated SQL script with `extensions.http_post`

## Next Steps

1. Run the updated `/migrations/fix_pg_cron.sql`
2. Wait 15 minutes
3. Check job run history
4. If successful, move on to AI chat feature
5. If still failing, use Edge Functions approach
