-- Make user admin
INSERT INTO users (id, email, full_name, plan_tier, preferences)
VALUES (
  '551b99a5-eaf2-4513-b218-eda99c1d1f3b',
  'obisdev@gmail.com',
  'Admin',
  'premium',
  '{"role": "admin", "theme": "dark"}'
)
ON CONFLICT (id) 
DO UPDATE SET 
  preferences = '{"role": "admin", "theme": "dark"}',
  plan_tier = 'premium';
