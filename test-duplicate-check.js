// Test if duplicate check is working
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://fgpsrnwlctxjdpnkndqw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHNybndsY3R4amRwbmtuZHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2MDcyNiwiZXhwIjoyMDc5NDM2NzI2fQ.RA8G3VtpbmHP3DQc4CmFymL-4QAoxZla5APDezNuUnY'
);

function normalizeURL(url) {
  return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, 'https://').replace(/\/$/, '');
}

function generateFingerprint(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

async function test() {
  // Get a sample URL from database
  const { data: stories } = await supabase
    .from('stories_raw')
    .select('url, canonical_url, fingerprint')
    .limit(1);
  
  if (!stories || stories.length === 0) {
    console.log('No stories in database');
    return;
  }
  
  const story = stories[0];
  console.log('Sample story from DB:');
  console.log('  URL:', story.url);
  console.log('  Canonical:', story.canonical_url);
  console.log('  Fingerprint:', story.fingerprint);
  
  // Test our fingerprint generation
  const canonical = normalizeURL(story.url);
  const fingerprint = generateFingerprint(canonical);
  
  console.log('\nOur calculation:');
  console.log('  Canonical:', canonical);
  console.log('  Fingerprint:', fingerprint);
  console.log('  Match:', fingerprint === story.fingerprint ? '✓ YES' : '✗ NO');
  
  // Test duplicate check
  const { data: existing } = await supabase
    .from('stories_raw')
    .select('id')
    .eq('fingerprint', fingerprint)
    .single();
  
  console.log('\nDuplicate check:', existing ? '✓ Found (will skip)' : '✗ Not found (will insert)');
}

test();
