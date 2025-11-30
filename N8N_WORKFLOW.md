# N8N Workflow Setup for Source-News

## Automated News Ingestion & AI Training

This workflow automatically fetches news, generates AI summaries, and extracts entities every 15 minutes.

---

## Workflow Structure

```
[Schedule Trigger] → [HTTP Request: Orchestrate] → [Notification]
```

---

## Setup Instructions

### 1. Schedule Trigger Node

**Configuration:**
- **Trigger Type**: Cron
- **Cron Expression**: `*/15 * * * *` (every 15 minutes)
- **Description**: Runs ingestion and AI training every 15 minutes

---

### 2. HTTP Request Node

**Configuration:**
- **Method**: `POST`
- **URL**: `https://source-news.vercel.app/api/cron/orchestrate`
- **Authentication**: None
- **Headers**:
  ```json
  {
    "Authorization": "Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a",
    "Content-Type": "application/json"
  }
  ```
- **Body**: `{}`
- **Timeout**: 300000 (5 minutes)

**What it does:**
1. Fetches new stories from RSS feeds
2. Waits 2 minutes for ingestion to complete
3. Generates AI summaries for new stories
4. Extracts entities for knowledge graph

---

### 3. Notification Node (Optional)

**Configuration:**
- **Trigger**: On workflow completion
- **Condition**: Success or Error
- **Message Template**:
  ```
  Source-News Automation:
  Status: {{$json.success ? "✅ Success" : "❌ Failed"}}
  Ingestion: {{$json.results.ingestion}}
  Summaries: {{$json.results.summaries}}
  Entities: {{$json.results.entities}}
  ```

**Supported Channels:**
- Slack
- Discord
- Email
- Telegram

---

## Testing

Test the endpoint manually before setting up n8n:

```bash
curl -X POST https://source-news.vercel.app/api/cron/orchestrate \
  -H "Authorization: Bearer 8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "ingestion": { "processed": 25 },
    "summaries": { "processed": 20 },
    "entities": { "processed": 15 }
  }
}
```

---

## Monitoring

**Check execution logs:**
1. **n8n**: Workflow execution history
2. **Vercel**: Function logs at https://vercel.com/logs
3. **Supabase**: Database logs for data operations

**Key Metrics:**
- Execution time (should be ~3-5 minutes)
- Success rate (aim for >95%)
- Stories processed per run

---

## Recommended Schedules

| Time Period | Frequency | Cron Expression |
|-------------|-----------|----------------|
| Peak Hours (8am-10pm) | Every 10 minutes | `*/10 8-22 * * *` |
| Off-Peak (10pm-8am) | Every 30 minutes | `*/30 22-8 * * *` |
| Default | Every 15 minutes | `*/15 * * * *` |

**Tip**: Create multiple schedule triggers in n8n for different time periods.

---

## Troubleshooting

**Workflow fails with 401 Unauthorized:**
- Check Authorization header has correct CRON_SECRET

**Workflow times out:**
- Increase timeout to 600000 (10 minutes)
- Check Vercel function logs for errors

**No new stories processed:**
- Verify RSS feeds are active
- Check Supabase for existing stories

---

## What Gets Automated

✅ **News Ingestion**: Fetches latest stories from 10+ Nigerian news sources  
✅ **AI Summaries**: Generates 2-sentence summaries with key facts  
✅ **Entity Extraction**: Identifies people, organizations, locations  
✅ **Knowledge Graph**: Builds relationships between entities  
✅ **Embeddings**: Creates vector embeddings for semantic search  

All running automatically every 15 minutes with zero manual intervention.
