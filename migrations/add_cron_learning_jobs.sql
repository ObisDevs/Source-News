-- Add cron jobs for continuous learning system

-- Generate summaries every 30 minutes
SELECT cron.schedule(
  'generate-story-summaries',
  '*/30 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://source-news.vercel.app/api/cron/generate-summaries',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a'),
    body := '{}'::jsonb
  );
  $$
);

-- Extract entities every hour
SELECT cron.schedule(
  'extract-entities',
  '0 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://source-news.vercel.app/api/cron/extract-entities',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a'),
    body := '{}'::jsonb
  );
  $$
);
