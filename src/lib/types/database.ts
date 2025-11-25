export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string
          name: string
          type: string | null
          url: string | null
          credibility_score: number | null
          bias_lean: string | null
          is_active: boolean | null
          license_status: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
      }
      stories_raw: {
        Row: {
          id: string
          source_id: string | null
          title: string
          content: string | null
          url: string
          canonical_url: string | null
          fingerprint: string | null
          published_at: string | null
          metadata: Json | null
          ingested_at: string | null
          processed: boolean | null
        }
      }
      story_clusters: {
        Row: {
          id: string
          primary_title: string
          summary: string | null
          news_score: number | null
          engagement_score: number | null
          sentiment_score: number | null
          bias_distribution: Json | null
          category: string | null
          is_trending: boolean | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
      }
    }
  }
}
