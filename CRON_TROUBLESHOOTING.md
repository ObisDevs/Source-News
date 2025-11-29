# Cron Job Troubleshooting Guide

## Problem: Supabase pg_cron not running

### Quick Diagnosis

Run this in Supabase SQL Editor:

```sql
-- 1. Check if jobs exist and are active
SELECT jobid, jobname, schedule, active, command 
FROM cron.job 
WHERE jobname IN ('ingest_news_pgcron', 'process_stories_pgcron');
```

**Expected Result:** 2 rows with `active = true`

**If no rows:** Jobs were never created or were unscheduled. Run `/migrations/fix_pg_cron.sql`

**If `active = false`:** Jobs are disabled. Re-enable or recreate them.

### Check Job Run History

```sql
-- 2. Check recent job runs
SELECT 
  j.jobname,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname IN ('ingest_news_pgcron', 'process_stories_pgcron')
ORDER BY r.start_time DESC 
LIMIT 10;
```

**Expected Result:** Rows with recent timestamps (within last 15 minutes)

**If no rows:** Jobs have never run. Check if pg_cron extension is enabled.

**If status = 'failed':** Check `return_message` for error details.

### Common Issues

#### Issue 1: "relation cron.job does not exist"

**Cause:** pg_cron extension not enabled

**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### Issue 2: "schema net does not exist" or "function net.http_post does not exist"

**Cause:** Supabase doesn't have the `net` extension

**Fix Option 1:** Use `extensions.http_post` instead (updated in fix_pg_cron.sql)

**Fix Option 2:** Use Supabase Edge Functions (recommended - see `alternative_edge_function_cron.md`)

Edge Functions are more reliable and have better logging.

#### Issue 3: Jobs run but return 401 Unauthorized

**Cause:** CRON_SECRET mismatch

**Fix:**
1. Check Vercel environment variables: `CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a`
2. Verify the secret in your pg_cron command matches exactly
3. Redeploy Vercel after updating env vars

#### Issue 4: Jobs run but return connection timeout

**Cause:** Wrong Vercel URL or app not deployed

**Fix:**
1. Verify your Vercel URL is correct and publicly accessible
2. Test manually: `curl https://YOUR_VERCEL_URL/api/worker/ingest -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"`
3. Update pg_cron jobs with correct URL

#### Issue 5: Jobs created but never run

**Cause:** pg_cron scheduler not running

**Fix:**
```sql
-- Check pg_cron background worker status
SELECT * FROM pg_stat_activity WHERE application_name = 'pg_cron';
```

If no results, pg_cron background worker is not running. This requires database restart or Supabase support.

## Manual Testing

### Test Ingestion Endpoint

```bash
# From your terminal
curl -X POST https://YOUR_VERCEL_URL/api/worker/ingest \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "rss": { "ingested": 10, "skipped": 5, "errors": 0 },
    "newsapi": { "ingested": 20, "skipped": 0, "errors": 0 },
    "twitter": { "ingested": 0, "skipped": 0, "errors": 0 },
    "total": { "ingested": 30, "skipped": 5, "errors": 0 }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Test Processing Endpoint

```bash
curl -X POST https://YOUR_VERCEL_URL/api/worker/process \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a" \
  -H "Content-Type: application/json"
```

## Alternative: Use Supabase Edge Functions

If pg_cron continues to fail, you can use Supabase Edge Functions as an alternative:

1. Create Edge Function that calls your Vercel endpoints
2. Use Supabase's built-in cron scheduling for Edge Functions
3. No need for HTTP calls from database

See: https://supabase.com/docs/guides/functions/schedule-functions

## Verification Checklist

- [ ] pg_cron extension is enabled
- [ ] Jobs are created and active
- [ ] Jobs have run in the last 15 minutes
- [ ] Job runs show successful status
- [ ] Vercel URL is correct and accessible
- [ ] CRON_SECRET matches in both Supabase and Vercel
- [ ] Vercel logs show incoming requests from Supabase
- [ ] Stories are being ingested (check `stories_raw` table)

## Get Help

If issues persist:
1. Check Supabase status: https://status.supabase.com/
2. Check Vercel status: https://www.vercel-status.com/
3. Review Supabase logs for HTTP errors
4. Review Vercel logs for API errors
5. Contact Supabase support if pg_cron is not working
