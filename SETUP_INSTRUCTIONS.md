# Setup Instructions for Source-News

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Project Settings** → **API**
4. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

5. Go to **SQL Editor** and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

6. Copy SQL from `DATABASE_SCHEMA.md` sections in order:
   - Extensions
   - Core Tables
   - Indexes
   - Functions
   - RLS Policies
   - Triggers
   - Initial Data Seeding
   
   **Note**: Skip the "Vacuum and Analyze" section - those commands cannot run in SQL Editor (transaction block). Supabase handles vacuuming automatically.

## Step 2: Environment Variables

Update `.env.local` with your actual values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Providers (at least one required)
GOOGLE_GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret
```

## Step 3: Get API Keys

### Google Gemini (Recommended - Free tier available)
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new API key
4. Copy to `GOOGLE_GEMINI_API_KEY`

### OpenAI (Optional - Fallback)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy to `OPENAI_API_KEY`

## Step 4: Verify Setup

Run the following commands:

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Start dev server
npm run dev
```

Visit http://localhost:3000 - you should see the Source News homepage.

## Next Steps

Proceed to **Milestone 2** in `DEVELOPMENT_MILESTONES.md` to build the backend infrastructure.
