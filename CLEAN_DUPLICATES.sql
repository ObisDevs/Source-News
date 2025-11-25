-- Clean duplicate sources
-- Run this in Supabase SQL Editor

-- Delete all sources (we'll re-add them)
DELETE FROM sources;

-- Re-insert sources (only once)
INSERT INTO sources (name, type, url, bias_lean, credibility_score, is_active) VALUES
  ('Premium Times', 'rss', 'https://premiumtimesng.com/feed', 'centre', 85, true),
  ('Punch', 'rss', 'https://punchng.com/feed/', 'centre', 80, true),
  ('Vanguard', 'rss', 'https://www.vanguardngr.com/feed/', 'centre', 80, true),
  ('Channels TV', 'rss', 'https://www.channelstv.com/feed/', 'centre', 90, true),
  ('Techpoint Africa', 'rss', 'https://techpoint.africa/feed/', 'centre', 75, true),
  ('Nairametrics', 'rss', 'https://nairametrics.com/feed/', 'centre', 75, true),
  ('The Guardian NG', 'rss', 'https://guardian.ng/feed/', 'centre', 80, true),
  ('Daily Trust', 'rss', 'https://dailytrust.com/feed/', 'centre', 75, true),
  ('BusinessDay', 'rss', 'https://businessday.ng/feed/', 'centre', 80, true),
  ('This Day', 'rss', 'https://www.thisdaylive.com/index.php/feed/', 'centre', 75, true),
  ('NewsAPI Nigeria', 'api', 'https://newsapi.org', 'centre', 80, true);

-- Verify - should return 11
SELECT COUNT(*) FROM sources;

-- Note: Removed The Cable (malformed XML) and Sahara Reporters (404)
-- Added BusinessDay, This Day, and NewsAPI as replacements

-- View sources
SELECT name, url FROM sources;
