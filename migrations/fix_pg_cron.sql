-- Fix Supabase pg_cron jobs with actual credentials
-- Run this in Supabase SQL Editor

-- First, unschedule any existing jobs
SELECT cron.unschedule('ingest_news_pgcron');
SELECT cron.unschedule('process_stories_pgcron');

-- Schedule ingestion every 15 minutes using Supabase's http extension
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

-- Schedule processing every 15 minutes (offset by 2 minutes)
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

-- Verify the jobs are scheduled
SELECT jobid, jobname, schedule, command, active 
FROM cron.job 
WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron');

-- Check recent job runs (after waiting 15 minutes)
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron'))
-- ORDER BY start_time DESC 
-- LIMIT 10;
