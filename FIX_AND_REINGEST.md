# Fix Ingestion Issue

## Problem Found
- You have 140 stories in database with OLD fingerprints
- New ingestion uses DIFFERENT fingerprint calculation
- Result: Everything appears as "duplicate" and gets skipped
- Homepage was querying wrong column (`created_at` vs `ingested_at`)

## Solution: Fresh Start

Run this SQL in Supabase to clear and start fresh:

\`\`\`sql
-- Clear all stories
DELETE FROM stories_raw;

-- Verify
SELECT COUNT(*) FROM stories_raw;  -- Should be 0
SELECT COUNT(*) FROM sources;      -- Should be 10
\`\`\`

Then refresh your app - ingestion will fetch fresh stories.

## What's Fixed
1. ✅ Homepage now uses correct column (`ingested_at`)
2. ✅ Removed broken RSS feeds (Premium Times, Punch)
3. ✅ Added NewsAPI integration
4. ✅ Better error handling

## After Clearing Database
- Visit: http://localhost:3000/api/worker/ingest
- Should ingest ~100+ new stories
- Stories will appear on homepage immediately
