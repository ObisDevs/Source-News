# Alternative: Supabase Edge Functions for Cron

If `extensions.http_post` doesn't work, use Supabase Edge Functions instead.

## Why Edge Functions?

- More reliable than pg_cron HTTP calls
- Built-in cron scheduling
- Better error handling and logging
- No schema issues

## Setup Steps

### 1. Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2. Link Your Project

```bash
supabase link --project-ref fgpsrnwlctxjdpnkndqw
```

### 3. Create Edge Function

```bash
supabase functions new ingest-cron
```

### 4. Edit the Function

File: `supabase/functions/ingest-cron/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const VERCEL_URL = "https://source-news.vercel.app"
    const CRON_SECRET = Deno.env.get("CRON_SECRET")

    // Call ingestion endpoint
    const ingestResponse = await fetch(`${VERCEL_URL}/api/worker/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`
      }
    })

    const ingestData = await ingestResponse.json()

    // Call processing endpoint (2 minutes later via separate function)
    // Or just return ingestion results
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        ingestion: ingestData,
        timestamp: new Date().toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### 5. Deploy the Function

```bash
supabase functions deploy ingest-cron --no-verify-jwt
```

### 6. Set Environment Variable

```bash
supabase secrets set CRON_SECRET=8f3c2b9e1a7d5f4c6b8e2a9f3d5c7b1a
```

### 7. Schedule the Function

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `ingest-cron`
3. Go to **Settings** tab
4. Enable **Cron Jobs**
5. Set schedule: `*/15 * * * *` (every 15 minutes)

## Create Processing Function

Repeat for processing:

```bash
supabase functions new process-cron
```

File: `supabase/functions/process-cron/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const VERCEL_URL = "https://source-news.vercel.app"
    const CRON_SECRET = Deno.env.get("CRON_SECRET")

    const response = await fetch(`${VERCEL_URL}/api/worker/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`
      }
    })

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ success: true, processing: data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

Deploy:
```bash
supabase functions deploy process-cron --no-verify-jwt
```

Schedule: `2-59/15 * * * *` (every 15 minutes, offset by 2)

## Benefits

✅ No pg_cron schema issues
✅ Better logging in Supabase dashboard
✅ Easier to debug and monitor
✅ Can add retry logic
✅ Can add notifications on failure

## Monitoring

View logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on function name
3. View **Logs** tab
4. See all executions and errors
