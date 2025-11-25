import { supabaseAdmin } from './client';
import type { Database } from '@/lib/types/database';

type Source = Database['public']['Tables']['sources']['Row'];
type Story = Database['public']['Tables']['stories_raw']['Row'];
type Cluster = Database['public']['Tables']['story_clusters']['Row'];

export async function getActiveSources(): Promise<Source[]> {
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function insertStory(story: {
  title: string;
  content?: string;
  url: string;
  canonical_url?: string;
  fingerprint: string;
  source_id?: string;
  published_at?: string;
  metadata?: Record<string, unknown>;
}): Promise<Story> {
  const { data, error } = await supabaseAdmin
    .from('stories_raw')
    .insert(story)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestClusters(limit = 50): Promise<Cluster[]> {
  const { data, error } = await supabaseAdmin
    .from('story_clusters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getClusterById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('story_clusters')
    .select(`
      *,
      cluster_items (
        story_id,
        relevance_score,
        stories_raw (
          id,
          title,
          url,
          content,
          published_at,
          metadata,
          source_id,
          sources (
            name,
            bias_lean,
            credibility_score
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
