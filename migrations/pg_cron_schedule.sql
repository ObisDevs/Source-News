-- Supabase pg_cron schedule for more frequent ingestion/processing
-- RUN THIS IN SUPABASE SQL EDITOR (do NOT commit secrets into the repository)
-- Replace YOUR_VERCEL_URL and CRON_SECRET placeholder with your actual values in the Supabase SQL editor.

-- Enable pg_cron extension (requires superuser; Supabase may already provide this)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Optional: ensure the `net` extension exists for HTTP calls (Supabase provides http client functions)
-- CREATE EXTENSION IF NOT EXISTS net; -- Uncomment if available in your Supabase instance

-- Schedule ingestion every 15 minutes
SELECT cron.schedule(
  'ingest_news_pgcron',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_VERCEL_URL/api/worker/ingest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer CRON_SECRET"}'::jsonb
  );
  $$
);

-- Schedule processing every 15 minutes (offset by 2 minutes to reduce contention)
SELECT cron.schedule(
  'process_stories_pgcron',
  '2-59/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_VERCEL_URL/api/worker/process',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer CRON_SECRET"}'::jsonb
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To remove a job later:
-- SELECT cron.unschedule('ingest_news_pgcron');
-- SELECT cron.unschedule('process_stories_pgcron');
