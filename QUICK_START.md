# 🚀 QUICK START GUIDE

## Step 1: Run the SQL Setup (5 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Copy the entire contents of `SUPABASE_SETUP.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

✅ This will:
- Create all tables
- Add indexes
- Seed 10 Nigerian news sources
- Create 3 sample story clusters (so you see content immediately!)
- Set up permissions

## Step 2: Verify Setup

Run these queries in SQL Editor to confirm:

```sql
-- Should return 10
SELECT COUNT(*) FROM sources;

-- Should return 3
SELECT COUNT(*) FROM story_clusters;

-- View the sample stories
SELECT primary_title, news_score FROM story_clusters;
```

## Step 3: Refresh Your App

1. Go back to http://localhost:3000
2. Refresh the page
3. You should now see 3 sample story clusters!

## Step 4: Fetch Real News (Optional)

To get real news from Nigerian sources:

```bash
# Terminal 1: Keep dev server running
npm run dev

# Terminal 2: Trigger ingestion
curl -X POST http://localhost:3000/api/worker/ingest \
  -H "Authorization: Bearer dev_secret_123"
```

Wait 30 seconds, then:

```bash
# Process the stories (generate embeddings & clusters)
curl -X POST http://localhost:3000/api/worker/process \
  -H "Authorization: Bearer dev_secret_123"
```

Refresh your browser - you'll see real Nigerian news!

## Automatic Ingestion (Production)

When you deploy to Vercel, ingestion happens automatically every 5 minutes via the cron jobs in `vercel.json`.

For local development, you can:
1. Manually trigger with curl (shown above)
2. Set up Supabase pg_cron (see `AUTOMATIC_INGESTION.md`)
3. Use a tool like `ngrok` to expose localhost and configure pg_cron

## Troubleshooting

**Still seeing "No stories available"?**
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Make sure you ran `SUPABASE_SETUP.sql`
- Try refreshing the page (Ctrl+Shift+R)

**Ingestion failing?**
- Check your Supabase service role key is correct
- Verify the `sources` table has 10 entries
- Check API logs for errors

**Need help?**
- Check `README_INGESTION.md` for detailed ingestion docs
- Check `AUTOMATIC_INGESTION.md` for automatic setup
- Review `MS3_COMPLETED.md` for ingestion milestone details

---

## What You Get

After setup, you'll have:
- ✅ 3 sample story clusters (visible immediately)
- ✅ 10 Nigerian news sources configured
- ✅ Full database schema deployed
- ✅ Ready to ingest real news
- ✅ Ready to deploy to production

**Total setup time: ~5 minutes** ⚡
