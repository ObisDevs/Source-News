import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000), // Limit to 8k chars
  });
  return response.data[0].embedding;
}

export async function processStoryEmbeddings(storyId: string): Promise<void> {
  const { data: story } = await supabaseAdmin
    .from('stories_raw')
    .select('title, content')
    .eq('id', storyId)
    .single();

  if (!story) throw new Error('Story not found');

  const titleVector = await generateEmbedding(story.title);
  const contentVector = await generateEmbedding(
    story.content?.substring(0, 1000) || story.title
  );

  await supabaseAdmin.from('embeddings').upsert({
    story_id: storyId,
    title_vector: titleVector,
    content_vector: contentVector,
  });
}

export async function batchProcessEmbeddings(limit = 10): Promise<number> {
  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select('id')
    .is('processed', false)
    .limit(limit);

  if (!stories || stories.length === 0) return 0;

  let processed = 0;
  for (const story of stories) {
    try {
      await processStoryEmbeddings(story.id);
      await supabaseAdmin
        .from('stories_raw')
        .update({ processed: true })
        .eq('id', story.id);
      processed++;
    } catch (error) {
      console.error(`Failed to process story ${story.id}:`, error);
    }
  }

  return processed;
}
