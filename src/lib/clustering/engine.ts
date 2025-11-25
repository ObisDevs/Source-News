import { supabaseAdmin } from '@/lib/supabase/client';

const SIMILARITY_THRESHOLD = 0.75;

export async function findSimilarStories(storyId: string): Promise<Array<{ story_id: string; similarity: number }>> {
  const { data: embedding } = await supabaseAdmin
    .from('embeddings')
    .select('title_vector')
    .eq('story_id', storyId)
    .single();

  if (!embedding) return [];

  const { data: similar } = await supabaseAdmin.rpc('match_stories', {
    query_embedding: embedding.title_vector,
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: 10,
  });

  return similar || [];
}

export async function assignToCluster(storyId: string): Promise<string | null> {
  const similarStories = await findSimilarStories(storyId);

  if (similarStories.length > 0) {
    const { data: existingCluster } = await supabaseAdmin
      .from('cluster_items')
      .select('cluster_id')
      .in('story_id', similarStories.map(s => s.story_id))
      .limit(1)
      .single();

    if (existingCluster) {
      await supabaseAdmin.from('cluster_items').insert({
        cluster_id: existingCluster.cluster_id,
        story_id: storyId,
        relevance_score: similarStories[0].similarity,
      });
      return existingCluster.cluster_id;
    }
  }

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
      relevance_score: 1.0,
    });
    return newCluster.id;
  }

  return null;
}

export async function batchProcessClustering(limit = 10): Promise<number> {
  const { data: stories } = await supabaseAdmin
    .from('stories_raw')
    .select('id')
    .eq('processed', true)
    .not('id', 'in', supabaseAdmin.from('cluster_items').select('story_id'))
    .limit(limit);

  if (!stories || stories.length === 0) return 0;

  let clustered = 0;
  for (const story of stories) {
    try {
      await assignToCluster(story.id);
      clustered++;
    } catch (error) {
      console.error(`Failed to cluster story ${story.id}:`, error);
    }
  }

  return clustered;
}
