# Category Fix Documentation

## Problem
Only "All" category was showing content because stories weren't being categorized during ingestion.

## Solution Applied

### 1. Updated Ingestion Workers
- **RSS Ingest** (`src/lib/workers/rss-ingest.ts`): Now categorizes stories on ingestion
- **NewsAPI Ingest** (`src/lib/workers/newsapi-ingest.ts`): Now categorizes stories on ingestion

### 2. Enhanced Categorization
Added keyword-based categorization with Nigerian-specific terms:
- **Politics**: government, election, president, tinubu, pdp, apc, etc.
- **Business**: economy, naira, cbn, inflation, etc.
- **Sports**: football, super eagles, afcon, etc.
- **Technology**: tech, fintech, blockchain, crypto, etc.
- **Entertainment**: nollywood, wizkid, davido, etc.
- **Health**: medical, lassa, cholera, etc.
- **General**: Default for uncategorized content

### 3. Updated UI
- Added "General" category to header navigation
- All categories now properly filter stories

## How to Reingest and Categorize

### Option 1: Using the Script (Recommended)
```bash
cd /workspaces/Source-News
./scripts/reingest-and-categorize.sh
```

### Option 2: Manual API Calls

1. **Categorize existing stories:**
```bash
curl -X GET "http://localhost:3000/api/worker/categorize" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

2. **Ingest fresh news:**
```bash
curl -X GET "http://localhost:3000/api/worker/ingest" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 3: Direct Browser Access
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/worker/categorize`
3. Visit: `http://localhost:3000/api/worker/ingest`

## Verification
After running the script, check:
- Each category tab should show relevant stories
- Stories should have appropriate categories based on content
- "All" tab shows all stories regardless of category

## Automatic Categorization
All new stories ingested will be automatically categorized based on their title and content keywords.


&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&


in admin, injestion is showing undefined: it should show the number:

Starting ingestion...
✓ Ingested: undefined
⊘ Skipped: undefined
✗ Errors: undefined
Ingestion complete!


add a page in admin where admin can use to insert new source of news.

ref of source table: 

create table public.sources (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text null,
  url text null,
  credibility_score integer null default 50,
  bias_lean text null,
  is_active boolean null default true,
  license_status text null default 'pending'::text,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sources_pkey primary key (id),
  constraint sources_bias_lean_check check (
    (
      bias_lean = any (
        array[
          'left'::text,
          'centre'::text,
          'right'::text,
          'government'::text,
          'independent'::text
        ]
      )
    )
  ),
  constraint sources_credibility_score_check check (
    (
      (credibility_score >= 0)
      and (credibility_score <= 100)
    )
  ),
  constraint sources_license_status_check check (
    (
      license_status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  ),
  constraint sources_type_check check (
    (
      type = any (
        array[
          'rss'::text,
          'api'::text,
          'twitter'::text,
          'government'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_sources_updated_at BEFORE
update on sources for EACH row
execute FUNCTION update_updated_at_column ();