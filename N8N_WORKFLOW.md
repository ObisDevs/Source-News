# N8N Workflow Setup for Source-News

## Option 1: Simple Single-Call Workflow (RECOMMENDED)

### Workflow Structure
```
[Schedule Trigger] → [HTTP Request] → [Notification]
```

### Configuration

**1. Schedule Trigger**
- Trigger: Every 15 minutes
- Cron: `*/15 * * * *`

**2. HTTP Request Node**
- Method: `POST`
- URL: `https://source-news.vercel.app/api/cron/orchestrate`
- Authentication: None
- Headers:
  ```json
  {
    "Authorization": "Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a",
    "Content-Type": "application/json"
  }
  ```
- Body: `{}`
- Timeout: 300000 (5 minutes)

**3. Notification Node (Optional)**
- Send success/failure notification via Slack/Discord/Email

---

## Option 2: Multi-Step Workflow (More Control)

### Workflow Structure
```
[Schedule] → [Ingest] → [Wait 2min] → [Summaries] → [Entities] → [Notify]
```

### Configuration

**1. Schedule Trigger**
- Cron: `*/15 * * * *`

**2. HTTP Request: Ingestion**
- Method: `POST`
- URL: `https://source-news.vercel.app/api/cron/ingest`
- Headers:
  ```json
  {
    "Authorization": "Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a"
  }
  ```

**3. Wait Node**
- Duration: 2 minutes

**4. HTTP Request: Generate Summaries**
- Method: `POST`
- URL: `https://source-news.vercel.app/api/cron/generate-summaries`
- Headers: Same as above

**5. HTTP Request: Extract Entities**
- Method: `POST`
- URL: `https://source-news.vercel.app/api/cron/extract-entities`
- Headers: Same as above

**6. Notification**
- Condition: On success/error
- Message: Include results from all steps

---

## Endpoints Available

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `/api/cron/orchestrate` | Run all jobs sequentially | Every 15 min |
| `/api/cron/ingest` | Fetch new stories from RSS | Every 15 min |
| `/api/cron/generate-summaries` | Generate AI summaries | After ingestion |
| `/api/cron/extract-entities` | Extract entities for knowledge graph | After summaries |

---

## Environment Variables Needed

Add to n8n environment or workflow:
```
CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a
BASE_URL=https://source-news.vercel.app
```

---

## Testing

Test the orchestrator manually:
```bash
curl -X POST https://source-news.vercel.app/api/cron/orchestrate \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a" \
  -H "Content-Type: application/json"
```

---

## Monitoring

Check logs in:
1. n8n execution history
2. Vercel function logs
3. Supabase logs (for database operations)

---

## Recommended Schedule

- **Every 15 minutes**: Full orchestration (ingestion + AI training)
- **Peak hours (8am-10pm)**: More frequent (every 10 minutes)
- **Off-peak (10pm-8am)**: Less frequent (every 30 minutes)

Use n8n's schedule node with multiple triggers for different times.
