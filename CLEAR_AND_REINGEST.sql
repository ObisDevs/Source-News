-- Run this in Supabase SQL Editor to start fresh

-- 1. Clear all existing stories
DELETE FROM stories_raw;

-- 2. Clear all sources
DELETE FROM sources;

-- 3. Add sources (skip Premium Times - has XML issues)
INSERT INTO sources (name, type, url, bias_lean, credibility_score, is_active) VALUES
  ('Vanguard', 'rss', 'https://www.vanguardngr.com/feed/', 'centre', 80, true),
  ('Channels TV', 'rss', 'https://www.channelstv.com/feed/', 'centre', 90, true),
  ('Techpoint Africa', 'rss', 'https://techpoint.africa/feed/', 'centre', 75, true),
  ('Nairametrics', 'rss', 'https://nairametrics.com/feed/', 'centre', 75, true),
  ('The Guardian NG', 'rss', 'https://guardian.ng/feed/', 'centre', 80, true),
  ('Daily Trust', 'rss', 'https://dailytrust.com/feed/', 'centre', 75, true),
  ('BusinessDay', 'rss', 'https://businessday.ng/feed/', 'centre', 80, true),
  ('This Day', 'rss', 'https://www.thisdaylive.com/index.php/feed/', 'centre', 75, true),
  ('NewsAPI Nigeria', 'api', 'https://newsapi.org', 'centre', 80, true);

-- 4. Verify
SELECT COUNT(*) as total_sources FROM sources;
SELECT COUNT(*) as total_stories FROM stories_raw;
