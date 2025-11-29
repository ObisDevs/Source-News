import { supabaseAdmin } from '@/lib/supabase/client';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function searchSourceNews(query: string) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  const { data: similarStories } = await supabaseAdmin.rpc('match_stories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.6,
    match_count: 10,
  });

  const storyIds = similarStories?.map((s: any) => s.story_id) || [];
  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content, url, published_at, sources(name)')
    .in('id', storyIds);

  return stories?.map((s: any) => ({
    title: s.title,
    source: s.sources?.name,
    url: s.url,
    snippet: s.content?.substring(0, 200),
  })) || [];
}

export async function searchGoogle(query: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query + ' Nigeria news')}`
    );
    const data = await response.json();
    
    return data.items?.slice(0, 5).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    })) || [];
  } catch (error) {
    console.error('Google search error:', error);
    return [];
  }
}

export const tools = [
  {
    type: 'function',
    function: {
      name: 'search_source_news',
      description: 'Search within Source-News database for Nigerian news stories using semantic search',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for finding relevant news stories',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_google',
      description: 'Search Google for additional Nigerian news information not in database',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for Google search',
          },
        },
        required: ['query'],
      },
    },
  },
];

export async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case 'search_source_news':
      return await searchSourceNews(args.query);
    case 'search_google':
      return await searchGoogle(args.query);
    default:
      return null;
  }
}
