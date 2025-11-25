# Setup Complete

## What Changed

1. **Homepage now shows raw stories** - No refresh button needed
2. **Stories load automatically** from database on page load
3. **Background ingestion** runs every 30 minutes via Vercel Cron
4. **Duplicate handling** - Silently skips duplicates instead of showing errors

## How It Works

- Stories are fetched from `stories_raw` table
- Each story links directly to the original article
- Shows source name, publish time, and bias lean
- Auto-refreshes every page load (no caching)

## Cron Jobs (Vercel)

- `/api/worker/ingest` - Every 30 minutes (fetches RSS feeds)
- `/api/worker/process` - Every 30 minutes (processes stories with AI)

## Local Development

Stories will show immediately if you have data in `stories_raw` table.

To manually trigger ingestion:
```bash
curl http://localhost:3000/api/worker/ingest
```

## Next Steps

1. Deploy to Vercel
2. Cron jobs will run automatically
3. Stories will accumulate over time
4. No user action needed
