-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_explanations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  explanation_type text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_explanations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  query text NOT NULL,
  response text NOT NULL,
  stories_referenced ARRAY,
  personality text,
  was_helpful boolean,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_interactions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cluster_items (
  cluster_id uuid NOT NULL,
  story_id uuid NOT NULL,
  relevance_score double precision DEFAULT 0.8 CHECK (relevance_score >= 0::double precision AND relevance_score <= 1::double precision),
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cluster_items_pkey PRIMARY KEY (cluster_id, story_id),
  CONSTRAINT cluster_items_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.story_clusters(id),
  CONSTRAINT cluster_items_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_comment_id uuid,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  is_flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid UNIQUE,
  title_vector USER-DEFINED,
  content_vector USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT embeddings_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.fact_check_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text])),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fact_check_requests_pkey PRIMARY KEY (id),
  CONSTRAINT fact_check_requests_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id),
  CONSTRAINT fact_check_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.knowledge_graph (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  related_entities jsonb,
  story_ids ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_graph_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posted_tweets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid,
  story_url text NOT NULL UNIQUE,
  title text,
  tweet_text text,
  tweet_url text,
  category text,
  posted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT posted_tweets_pkey PRIMARY KEY (id),
  CONSTRAINT posted_tweets_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.reading_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reading_history_pkey PRIMARY KEY (id),
  CONSTRAINT reading_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reading_history_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  story_id uuid,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text])),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reports_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.social_sentiment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid,
  platform text CHECK (platform = ANY (ARRAY['twitter'::text, 'facebook'::text, 'reddit'::text, 'instagram'::text])),
  positive_count integer DEFAULT 0,
  negative_count integer DEFAULT 0,
  neutral_count integer DEFAULT 0,
  total_count integer DEFAULT 0,
  keywords ARRAY DEFAULT '{}'::text[],
  analyzed_at timestamp with time zone DEFAULT now(),
  sample_tweets jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT social_sentiment_pkey PRIMARY KEY (id),
  CONSTRAINT social_sentiment_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type = ANY (ARRAY['rss'::text, 'api'::text, 'twitter'::text, 'government'::text])),
  url text,
  credibility_score integer DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  bias_lean text CHECK (bias_lean = ANY (ARRAY['left'::text, 'centre'::text, 'right'::text, 'government'::text, 'independent'::text])),
  is_active boolean DEFAULT true,
  license_status text DEFAULT 'pending'::text CHECK (license_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  rss_url text,
  CONSTRAINT sources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stories_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid,
  title text NOT NULL,
  content text,
  url text NOT NULL UNIQUE,
  canonical_url text,
  fingerprint text UNIQUE,
  published_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  ingested_at timestamp with time zone DEFAULT now(),
  processed boolean DEFAULT false,
  category text,
  CONSTRAINT stories_raw_pkey PRIMARY KEY (id),
  CONSTRAINT stories_raw_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.story_clusters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  primary_title text NOT NULL,
  summary text,
  news_score integer DEFAULT 0 CHECK (news_score >= 0 AND news_score <= 100),
  engagement_score integer DEFAULT 0,
  sentiment_score double precision CHECK (sentiment_score >= '-1'::integer::double precision AND sentiment_score <= 1::double precision),
  bias_distribution jsonb DEFAULT '{"left": 0, "right": 0, "centre": 0, "government": 0, "independent": 0}'::jsonb,
  category text,
  is_trending boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_clusters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.story_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type = ANY (ARRAY['accurate'::text, 'misleading'::text, 'important'::text, 'biased'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT story_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id),
  CONSTRAINT story_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.story_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid UNIQUE,
  summary text NOT NULL,
  key_entities jsonb,
  key_facts ARRAY,
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT story_summaries_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id)
);
CREATE TABLE public.story_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL,
  story_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['initial'::text, 'update'::text, 'correction'::text, 'development'::text])),
  title text NOT NULL,
  summary text,
  source_id uuid,
  published_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_timeline_pkey PRIMARY KEY (id),
  CONSTRAINT story_timeline_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id),
  CONSTRAINT story_timeline_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id)
);
CREATE TABLE public.subscription_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT 'NGN'::text,
  features jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  follow_type text NOT NULL CHECK (follow_type = ANY (ARRAY['category'::text, 'source'::text, 'topic'::text])),
  follow_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferred_categories ARRAY DEFAULT '{}'::text[],
  preferred_sources ARRAY DEFAULT '{}'::uuid[],
  preferred_bias_lean ARRAY DEFAULT '{}'::text[],
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  theme_preference text DEFAULT 'light'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier_id uuid,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text])),
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_subscriptions_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.subscription_tiers(id)
);
CREATE TABLE public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  date date DEFAULT CURRENT_DATE,
  ai_explanations_used integer DEFAULT 0,
  bias_checks_used integer DEFAULT 0,
  searches_performed integer DEFAULT 0,
  CONSTRAINT user_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text UNIQUE,
  full_name text,
  plan_tier text DEFAULT 'free'::text CHECK (plan_tier = ANY (ARRAY['free'::text, 'premium'::text, 'gold'::text])),
  preferences jsonb DEFAULT '{"theme": "light", "bias_filter": "all"}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);