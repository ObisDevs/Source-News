import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function extractEntities(storyId: string) {
  console.log('\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\x1b[1m\x1b[33m[ENTITY EXTRACTOR]\x1b[0m Starting entity extraction');
  console.log('\x1b[90m└─ Story ID:\x1b[0m', storyId);
  
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content')
    .eq('id', storyId)
    .single();

  if (!story) {
    console.log('\x1b[31m✗ Story not found\x1b[0m');
    return null;
  }

  console.log('\x1b[32m✓\x1b[0m Story fetched:', story.title.substring(0, 60) + '...');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Extract Nigerian political/news entities from this story.

Story: ${story.title}
${story.content}

Return JSON array:
[
  {"type": "person", "name": "Bola Tinubu"},
  {"type": "organization", "name": "INEC"},
  {"type": "location", "name": "Lagos"}
]`;

  console.log('\x1b[33m⚡\x1b[0m Calling Gemini API...');
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('\x1b[32m✓\x1b[0m AI response received');
  
  const entities = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
  console.log('\x1b[32m✓\x1b[0m Found', entities.length, 'entities');

  for (const entity of entities) {
    console.log('\x1b[90m  └─\x1b[0m', entity.type + ':', '\x1b[1m' + entity.name + '\x1b[0m');
    const { data: existing } = await supabaseAdmin
      .from('knowledge_graph')
      .select('story_ids')
      .eq('entity_type', entity.type)
      .eq('entity_name', entity.name)
      .single();

    const storyIds = existing?.story_ids || [];
    if (!storyIds.includes(storyId)) {
      storyIds.push(storyId);
    }

    await supabaseAdmin.from('knowledge_graph').upsert({
      entity_type: entity.type,
      entity_name: entity.name,
      story_ids: storyIds,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'entity_type,entity_name' });
  }

  console.log('\x1b[32m✓ Entities saved to knowledge graph\x1b[0m');
  console.log('\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return entities;
}

export async function getEntityStories(entityName: string) {
  const { data } = await supabaseAdmin
    .from('knowledge_graph')
    .select('story_ids')
    .ilike('entity_name', entityName)
    .single();

  if (!data?.story_ids) return [];

  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select('*')
    .in('id', data.story_ids)
    .order('published_at', { ascending: false });

  return stories || [];
}
