# Data Ingestion System

## Testing the Ingestion Pipeline

### 1. Test RSS Parsing
```bash
curl http://localhost:3000/api/worker/test-ingest
```

Expected response:
```json
{
  "success": true,
  "feedTitle": "Premium Times Nigeria",
  "itemCount": 15,
  "sampleItems": [...]
}
```

### 2. Test Full Ingestion (Manual)
```bash
curl -X POST http://localhost:3000/api/worker/ingest \
  -H "Authorization: Bearer dev_secret_123"
```

Expected response:
```json
{
  "success": true,
  "results": {
    "ingested": 50,
    "skipped": 10,
    "errors": 0
  },
  "timestamp": "2024-11-23T..."
}
```

### 3. Verify in Database

Check Supabase dashboard:
```sql
SELECT COUNT(*) FROM stories_raw;
SELECT title, url, created_at FROM stories_raw ORDER BY created_at DESC LIMIT 10;
```

## Automated Ingestion

### Vercel Cron (Production)
- Configured in `vercel.json`
- Runs every 5 minutes: `*/5 * * * *`
- Automatically calls `/api/worker/ingest`

### Manual Trigger (Development)
```bash
# Using the GET endpoint
curl http://localhost:3000/api/worker/ingest?secret=dev_secret_123
```

## RSS Sources

Currently configured sources (10):
1. Premium Times - https://premiumtimesng.com/feed
2. Punch - https://punchng.com/feed/
3. Vanguard - https://www.vanguardngr.com/feed/
4. The Cable - https://www.thecable.ng/feed
5. Channels TV - https://www.channelstv.com/feed/
6. Techpoint Africa - https://techpoint.africa/feed/
7. Nairametrics - https://nairametrics.com/feed/
8. The Guardian NG - https://guardian.ng/feed/
9. Daily Trust - https://dailytrust.com/feed/
10. Sahara Reporters - https://saharareporters.com/feeds/latest/feed

## Duplicate Detection

- Uses SHA-256 fingerprinting of canonical URLs
- Cached in Redis with 7-day TTL
- Prevents re-ingestion of same articles

## Error Handling

- Failed feeds are logged but don't stop the process
- Individual item errors are caught and counted
- Returns summary: `{ ingested, skipped, errors }`
