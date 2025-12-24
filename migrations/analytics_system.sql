-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  session_id text NOT NULL,
  story_id uuid,
  event_data jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  page_url text,
  referrer text,
  ip_hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT analytics_events_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories_raw(id) ON DELETE CASCADE
);

CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_story ON public.analytics_events(story_id);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- Materialized view for dashboard aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_dashboard AS
SELECT
  DATE_TRUNC('hour', created_at) as time_bucket,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT story_id) as unique_stories
FROM public.analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY time_bucket, event_type;

CREATE UNIQUE INDEX ON public.analytics_dashboard(time_bucket, event_type);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_dashboard;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage analytics"
  ON public.analytics_events FOR ALL
  USING (true);

CREATE POLICY "Users can insert own analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
