# CODING AGENT PROMPT: SOURCE-NEWS PLATFORM

## 🎯 BACKGROUND

You are building **Source-News**, a Nigerian-focused news intelligence platform that aggregates stories from multiple sources, uses AI to cluster similar stories, detect bias, analyze sentiment, and provide multi-viewpoint comparisons. Think of it as "Ground News for Nigeria" with enhanced AI capabilities.

### Business Context
- **Target Market**: Nigerian news consumers seeking unbiased, comprehensive coverage
- **Problem Solved**: News fragmentation, bias blindness, information overload
- **Unique Value**: AI-powered story clustering, bias detection, multi-source viewpoint comparison
- **Monetization**: Freemium model (Free/Premium/Gold tiers)

### Technical Context
- **Scale**: Handle 100+ stories/hour ingestion
- **Performance**: <3s page loads, <2s AI responses
- **Users**: Start with 1K users, scale to 100K+
- **Compliance**: Nigerian data laws, source licensing, DMCA takedowns

---

## 🎯 MISSION

Build a production-ready, full-stack news intelligence platform with:

1. **News Aggregation System** - Ingest from RSS feeds, APIs, Twitter signals
2. **AI Clustering Engine** - Group similar stories using embeddings
3. **Bias & Sentiment Analysis** - Classify viewpoints (Left/Centre/Right/Government)
4. **User Platform** - Feed, story detail pages, bookmarking, tiered access
5. **Admin Dashboard** - Source management, moderation, analytics

**Success Criteria:**
- Ingest and cluster 100+ stories daily
- 85%+ clustering accuracy
- <3s AI explanation generation
- 60%+ cache hit rate
- Mobile-first, accessible, fast

---

## 🔧 ACTIONS

### PHASE 1: PROJECT INITIALIZATION (Priority: CRITICAL)

#### Step 1.1: Set Up Next.js Project
```bash
npx create-next-app@latest source-news --typescript --tailwind --app --src-dir
cd source-news
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @vercel/kv swr zustand
npm install shadcn-ui lucide-react
npm install rss-parser openai @google/generative-ai
```

#### Step 1.2: Initialize Supabase
1. Create project at supabase.com
2. Enable pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
3. Copy connection string and anon key to `.env.local`

#### Step 1.3: Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_kv_token
GOOGLE_GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 1.4: Create Database Schema
Execute SQL from blueprint section 2.1 in Supabase SQL editor.

---

### PHASE 2: CORE BACKEND INFRASTRUCTURE (Priority: CRITICAL)

#### Step 2.1: Create Supabase Client (`lib/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

#### Step 2.2: Create Redis Client (`lib/redis/client.ts`)
```typescript
import { kv } from '@vercel/kv';

export async function getCached<T>(key: string): Promise<T | null> {
  return await kv.get<T>(key);
}

export async function setCache(key: string, value: any, ttl: number) {
  await kv.set(key, value, { ex: ttl });
}

export async function checkFingerprint(hash: string): Promise<boolean> {
  const exists = await kv.get(`fingerprint:${hash}`);
  return exists !== null;
}

export async function setFingerprint(hash: string) {
  await kv.set(`fingerprint:${hash}`, '1', { ex: 604800 }); // 7 days
}
```

#### Step 2.3: Create AI Orchestrator (`lib/ai/orchestrator.ts`)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { kv } from '@vercel/kv';

type AIProvider = 'gemini' | 'openai' | 'groq' | 'grok';

const providers: AIProvider[] = ['gemini', 'openai', 'groq', 'grok'];

async function checkProviderHealth(provider: AIProvider): Promise<boolean> {
  const health = await kv.get(`ai:health:${provider}`);
  return health !== 'down';
}

async function markProviderDown(provider: AIProvider) {
  await kv.set(`ai:health:${provider}`, 'down', { ex: 300 }); // 5 min
}

export async function generateAICompletion(
  prompt: string,
  type: 'summary' | 'explanation' | 'sentiment'
): Promise<string> {
  for (const provider of providers) {
    if (!(await checkProviderHealth(provider))) continue;

    try {
      switch (provider) {
        case 'gemini':
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
          const result = await model.generateContent(prompt);
          return result.response.text();

        case 'openai':
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });
          return completion.choices[0].message.content || '';

        // Add groq and grok cases similarly
        default:
          continue;
      }
    } catch (error) {
      console.error(`${provider} failed:`, error);
      await markProviderDown(provider);
      continue;
    }
  }

  throw new Error('All AI providers unavailable');
}
```

---

### PHASE 3: DATA INGESTION SYSTEM (Priority: HIGH)

#### Step 3.1: Create RSS Ingestion Worker (`lib/workers/rss-ingest.ts`)
```typescript
import Parser from 'rss-parser';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/client';
import { checkFingerprint, setFingerprint } from '@/lib/redis/client';

const RSS_SOURCES = [
  { name: 'Premium Times', url: 'https://premiumtimesng.com/feed', bias: 'centre' },
  { name: 'Punch', url: 'https://punchng.com/feed/', bias: 'centre' },
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/', bias: 'centre' },
  // Add more sources
];

export async function ingestRSSFeeds() {
  const parser = new Parser();
  const results = { ingested: 0, skipped: 0, errors: 0 };

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        // Generate fingerprint
        const fingerprint = crypto
          .createHash('sha256')
          .update(item.link || item.guid || item.title || '')
          .digest('hex');

        // Check if already exists
        if (await checkFingerprint(fingerprint)) {
          results.skipped++;
          continue;
        }

        // Insert story
        const { data, error } = await supabaseAdmin
          .from('stories_raw')
          .insert({
            title: item.title,
            content: item.contentSnippet || item.content,
            url: item.link,
            canonical_url: normalizeURL(item.link || ''),
            fingerprint,
            published_at: item.pubDate,
            metadata: {
              source: source.name,
              bias: source.bias,
            },
          })
          .select()
          .single();

        if (!error) {
          await setFingerprint(fingerprint);
          results.ingested++;
        } else {
          results.errors++;
          console.error('Insert error:', error);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error);
      results.errors++;
    }
  }

  return results;
}

function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking params
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    return parsed.toString();
  } catch {
    return url;
  }
}
```

#### Step 3.2: Create API Route for Ingestion (`app/api/worker/ingest/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ingestRSSFeeds } from '@/lib/workers/rss-ingest';

export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await ingestRSSFeeds();
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

#### Step 3.3: Set Up Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/worker/ingest",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### PHASE 4: EMBEDDING & CLUSTERING (Priority: HIGH)

#### Step 4.1: Create Embedding Generator (`lib/embeddings/generator.ts`)
```typescript
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function processStoryEmbeddings(storyId: string) {
  // Fetch story
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content')
    .eq('id', storyId)
    .single();

  if (!story) throw new Error('Story not found');

  // Generate embeddings
  const titleVector = await generateEmbedding(story.title);
  const contentVector = await generateEmbedding(
    story.content?.substring(0, 1000) || story.title
  );

  // Store embeddings
  await supabaseAdmin.from('embeddings').insert({
    story_id: storyId,
    title_vector: titleVector,
    content_vector: contentVector,
  });
}
```

#### Step 4.2: Create Clustering Engine (`lib/clustering/engine.ts`)
```typescript
import { supabaseAdmin } from '@/lib/supabase/client';

const SIMILARITY_THRESHOLD = 0.75;

export async function findSimilarStories(storyId: string): Promise<string[]> {
  // Get story embedding
  const { data: embedding } = await supabaseAdmin
    .from('embeddings')
    .select('title_vector')
    .eq('story_id', storyId)
    .single();

  if (!embedding) return [];

  // Find similar stories using pgvector
  const { data: similar } = await supabaseAdmin.rpc('match_stories', {
    query_embedding: embedding.title_vector,
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: 10,
  });

  return similar?.map((s: any) => s.story_id) || [];
}

export async function assignToCluster(storyId: string) {
  const similarStories = await findSimilarStories(storyId);

  if (similarStories.length > 0) {
    // Find existing cluster
    const { data: existingCluster } = await supabaseAdmin
      .from('cluster_items')
      .select('cluster_id')
      .in('story_id', similarStories)
      .limit(1)
      .single();

    if (existingCluster) {
      // Add to existing cluster
      await supabaseAdmin.from('cluster_items').insert({
        cluster_id: existingCluster.cluster_id,
        story_id: storyId,
      });
      return existingCluster.cluster_id;
    }
  }

  // Create new cluster
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('title')
    .eq('id', storyId)
    .single();

  const { data: newCluster } = await supabaseAdmin
    .from('story_clusters')
    .insert({
      primary_title: story?.title || 'Untitled',
    })
    .select()
    .single();

  if (newCluster) {
    await supabaseAdmin.from('cluster_items').insert({
      cluster_id: newCluster.id,
      story_id: storyId,
    });
    return newCluster.id;
  }
}
```

#### Step 4.3: Add pgvector Function (Execute in Supabase)
```sql
CREATE OR REPLACE FUNCTION match_stories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  story_id uuid,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.story_id,
    1 - (e.title_vector <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 1 - (e.title_vector <=> query_embedding) > match_threshold
  ORDER BY e.title_vector <=> query_embedding
  LIMIT match_count;
$$;
```

---

### PHASE 5: FRONTEND CORE (Priority: HIGH)

#### Step 5.1: Create Home Page (`app/page.tsx`)
```typescript
import { supabase } from '@/lib/supabase/client';
import StoryCard from '@/components/story-card';
import { getCached, setCache } from '@/lib/redis/client';

export const revalidate = 300; // 5 minutes

async function getLatestClusters() {
  // Try cache first
  const cached = await getCached<any[]>('feed:latest');
  if (cached) return cached;

  // Fetch from database
  const { data: clusters } = await supabase
    .from('story_clusters')
    .select(`
      *,
      cluster_items!inner (
        story_id,
        stories_raw (
          title,
          url,
          source_id,
          metadata
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Cache for 5 minutes
  if (clusters) {
    await setCache('feed:latest', clusters, 300);
  }

  return clusters || [];
}

export default async function HomePage() {
  const clusters = await getLatestClusters();

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Latest News</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster: any) => (
            <StoryCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

#### Step 5.2: Create Story Card Component (`components/story-card.tsx`)
```typescript
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface StoryCardProps {
  cluster: {
    id: string;
    primary_title: string;
    news_score: number;
    cluster_items: any[];
  };
}

export default function StoryCard({ cluster }: StoryCardProps) {
  const sourceCount = cluster.cluster_items?.length || 0;

  return (
    <Link href={`/story/${cluster.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-3">
            {cluster.primary_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{sourceCount} sources</span>
            <span>NewsScore: {cluster.news_score}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

#### Step 5.3: Create Story Detail Page (`app/story/[id]/page.tsx`)
```typescript
import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import AIExplanationButton from '@/components/ai-explanation-button';

async function getStoryCluster(id: string) {
  const { data } = await supabase
    .from('story_clusters')
    .select(`
      *,
      cluster_items (
        stories_raw (
          id,
          title,
          url,
          content,
          metadata,
          published_at
        )
      )
    `)
    .eq('id', id)
    .single();

  return data;
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const cluster = await getStoryCluster(params.id);

  if (!cluster) {
    notFound();
  }

  // Group stories by bias
  const leftStories = cluster.cluster_items.filter(
    (item: any) => item.stories_raw.metadata?.bias === 'left'
  );
  const centreStories = cluster.cluster_items.filter(
    (item: any) => item.stories_raw.metadata?.bias === 'centre'
  );
  const rightStories = cluster.cluster_items.filter(
    (item: any) => item.stories_raw.metadata?.bias === 'right'
  );

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{cluster.primary_title}</h1>

        {/* Viewpoint Columns */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <ViewpointColumn title="Left" stories={leftStories} />
          <ViewpointColumn title="Centre" stories={centreStories} />
          <ViewpointColumn title="Right" stories={rightStories} />
        </div>

        {/* Floating AI Button */}
        <AIExplanationButton storyId={cluster.id} />
      </div>
    </main>
  );
}

function ViewpointColumn({ title, stories }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold border-b pb-2">{title}</h2>
      {stories.map((item: any) => (
        <article key={item.stories_raw.id} className="p-4 border rounded">
          <a
            href={item.stories_raw.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
          >
            {item.stories_raw.title}
          </a>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {item.stories_raw.metadata?.source}
          </p>
        </article>
      ))}
    </div>
  );
}
```

---

### PHASE 6: AI EXPLANATION FEATURE (Priority: MEDIUM)

#### Step 6.1: Create AI Explanation API (`app/api/story/[id]/explain/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai/orchestrator';
import { getCached, setCache } from '@/lib/redis/client';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await request.json();

  // Check usage limits (implement tier checking)
  // ...

  // Check cache first
  const cacheKey = `story:explanation:${params.id}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ explanation: cached, cached: true });
  }

  // Fetch story data
  const { data: cluster } = await supabase
    .from('story_clusters')
    .select('primary_title, summary')
    .eq('id', params.id)
    .single();

  if (!cluster) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Generate AI explanation
  const prompt = `
Analyze this Nigerian news story and provide:
1. A concise explanation (2-3 sentences)
2. Key facts (3-5 bullet points)
3. Sentiment analysis (positive/neutral/negative)
4. Potential biases to watch for

Story: ${cluster.primary_title}
Summary: ${cluster.summary || 'No summary available'}

Format your response as JSON.
`;

  try {
    const explanation = await generateAICompletion(prompt, 'explanation');

    // Cache for 12 hours
    await setCache(cacheKey, explanation, 43200);

    // Update user usage
    // ...

    return NextResponse.json({ explanation, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }
}
```

---

## 📊 DELIVERABLES

### Immediate Outputs (End of Each Phase)

**Phase 1:**
- [ ] Next.js project initialized
- [ ] Supabase connected
- [ ] Redis configured
- [ ] Environment variables set
- [ ] Database schema deployed

**Phase 2:**
- [ ] Supabase client library
- [ ] Redis client library
- [ ] AI orchestrator with fallback
- [ ] Basic error handling

**Phase 3:**
- [ ] RSS ingestion worker
- [ ] Fingerprinting system
- [ ] API route for ingestion
- [ ] Vercel cron job configured
- [ ] Successfully ingesting 10+ sources

**Phase 4:**
- [ ] Embedding generation system
- [ ] Clustering algorithm
- [ ] pgvector similarity search
- [ ] Auto-assignment to clusters
- [ ] 85%+ clustering accuracy

**Phase 5:**
- [ ] Home page with story feed
- [ ] Story detail page with viewpoints
- [ ] Responsive design (mobile + desktop)
- [ ] Dark/light theme toggle
- [ ] <3s page load times

**Phase 6:**
- [ ] AI explanation API
- [ ] Floating AI button component
- [ ] Usage tracking
- [ ] Rate limiting by tier
- [ ] Response caching

### Final Deliverable

A fully functional Source-News platform with:
1. ✅ Live news feed updated every 5 minutes
2. ✅ AI-powered story clustering
3. ✅ Multi-viewpoint comparison
4. ✅ User authentication
5. ✅ Tiered access control
6. ✅ Admin dashboard
7. ✅ Mobile-optimized UI
8. ✅ Production deployment on Vercel

---

## 🎯 CRITICAL IMPLEMENTATION RULES

### DO's ✅
1. **Always fingerprint before insert** - Avoid duplicates
2. **Cache AI responses aggressively** - Expensive operations
3. **Use Server Components by default** - Better performance
4. **Implement RLS policies** - Security first
5. **Log all errors** - Debug production issues
6. **Test with real Nigerian news** - Ensure cultural relevance
7. **Use TypeScript strictly** - Catch errors early
8. **Optimize images** - Use Next/Image everywhere
9. **Rate limit per user** - Fair resource distribution
10. **Monitor AI provider health** - Auto-fallback

### DON'Ts ❌
1. **Never skip fingerprint check** - Will create duplicates
2. **Never bypass tier limits** - Protect revenue model
3. **Never expose API keys** - Use environment variables
4. **Never store raw HTML** - Security risk
5. **Never hardcode URLs** - Use env variables
6. **Never skip error boundaries** - App will crash
7. **Never ignore CORS** - API will break
8. **Never skip input validation** - Security vulnerability
9. **Never use client-side secrets** - Will be exposed
10. **Never deploy without testing** - Will break production

---

## 🔍 TESTING CHECKLIST

Before marking any phase complete:

- [ ] All TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API endpoints return correct data
- [ ] UI renders without errors
- [ ] Mobile responsive (test on 375px width)
- [ ] Dark mode works correctly
- [ ] Rate limiting enforced
- [ ] Caching working (verify Redis)
- [ ] AI fallback tested (disable Gemini, ensure OpenAI works)

---

## 📈 SUCCESS METRICS TO TRACK

Monitor these KPIs:
- **Ingestion Rate**: Stories per hour (target: 100+)
- **Clustering Accuracy**: Same-story grouping (target: 85%+)
- **AI Response Time**: Average seconds (target: <3s)
- **Cache Hit Rate**: Percentage (target: 60%+)
- **Page Load Time**: LCP metric (target: <2.5s)
- **Error Rate**: Failed requests (target: <1%)

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial Source-News implementation"
git remote add origin your-repo-url
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Import project from GitHub
2. Add environment variables in Vercel dashboard
3. Enable cron jobs
4. Deploy

### Step 3: Configure n8n (if used)
1. Create workflows for RSS ingestion
2. Set webhook URLs
3. Test manually before activating

### Step 4: Monitor
1. Check Vercel logs
2. Monitor Supabase dashboard
3. Verify Redis metrics
4. Test end-to-end user flow

---

## 🆘 TROUBLESHOOTING GUIDE

**Problem: Stories not ingesting**
- Check RSS source URLs are accessible
- Verify Supabase insert permissions
- Check fingerprint Redis connection
- Review API route logs in Vercel

**Problem: Clustering inaccurate**
- Tune SIMILARITY_THRESHOLD (try 0.70, 0.75, 0.80)
- Check embedding quality (use better models)
- Verify pgvector index created
- Test with manual similarity searches

**Problem: AI responses slow**
- Enable Redis caching
- Switch to faster model (Gemini Flash)
- Reduce prompt length
- Check provider API status

**Problem: High database costs**
- Implement aggressive caching
- Use connection pooling
- Archive old stories (>30 days)
- Optimize queries (add indexes)

---

## 📚 ADDITIONAL RESOURCES

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**NOW BEGIN PHASE 1. Report progress after each completed step.**