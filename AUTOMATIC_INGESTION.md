# Automatic Ingestion Setup

## Option 1: Supabase pg_cron (Recommended)

Run this SQL in Supabase SQL Editor to set up automatic ingestion:
1
1
1
1

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule ingestion every 5 minutes
SELECT cron.schedule(
  'ingest-news',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_VERCEL_URL/api/worker/ingest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer dev_secret_123"}'::jsonb
  );
  $$
);

-- Schedule processing every 10 minutes
SELECT cron.schedule(
  'process-stories',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_VERCEL_URL/api/worker/process',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer dev_secret_123"}'::jsonb
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('ingest-news');
```

**Note**: Replace `YOUR_VERCEL_URL` with your actual deployment URL or use `ngrok` for local testing.

## Option 2: Vercel Cron (Already Configured)

Your `vercel.json` already has cron jobs configured. NOTE: if you're on the Vercel **Hobby** plan, cron behavior is restricted — Hobby only guarantees cron invocations once per day and timing may vary (e.g. a job scheduled at `0 1 * * *` may run anywhere between 01:00 and 01:59). Hobby accounts are limited to 2 cron jobs per account that run once daily.

Example `vercel.json` configured for Hobby (daily at 1:00):

```json
{
  "crons": [
    {
      "path": "/api/worker/ingest",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/worker/process",
      "schedule": "0 1 * * *"
    }
  ]
}
```

**If you are on Hobby and need more frequent scheduling (for example every 15 minutes), use one of these alternatives:**

- Use Supabase `pg_cron` (runs inside Supabase and is not subject to Vercel Hobby cron limits). See Option 1 above.
- Use an external scheduler such as GitHub Actions (recommended). Add a small workflow that POSTs to your `/api/worker/ingest` and `/api/worker/process` endpoints on the schedule you need (example workflow is in the repo suggestions earlier).

If you keep Vercel crons on Hobby, set them to daily and accept the timing variability.

## Option 3: Manual Trigger on Page Load (Quick Fix)

For development, trigger ingestion when homepage loads if no stories exist.

Already implemented in `src/app/page.tsx` - it will show empty state with instructions.

## Quick Start for Development

1. **Run the setup SQL**:
   - Go to Supabase SQL Editor
   - Copy and paste `SUPABASE_SETUP.sql`
   - Execute

2. **Manually trigger first ingestion**:
   ```bash
   curl -X POST http://localhost:3000/api/worker/ingest \
     -H "Authorization: Bearer dev_secret_123"
   ```

3. **Manually trigger processing**:
   ```bash
   curl -X POST http://localhost:3000/api/worker/process \
     -H "Authorization: Bearer dev_secret_123"
   ```

4. **Refresh homepage** - you should see stories!

## For Production

1. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

2. **Cron jobs will run automatically** every 5 and 10 minutes

3. **Or use Supabase pg_cron** with your production URL

## Troubleshooting

**No stories showing?**
- Check Supabase credentials in `.env.local`
- Run `SUPABASE_SETUP.sql` to create tables and seed data
- Manually trigger ingestion once
- Check browser console for errors

**Ingestion failing?**
- Verify RSS feeds are accessible
- Check Supabase service role key is correct
- Look at API logs in Vercel dashboard

**Processing failing?**
- Verify OpenAI API key is set
- Check API quota/billing
- Look for errors in Vercel logs
