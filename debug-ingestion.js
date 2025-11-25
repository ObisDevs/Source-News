// Quick debug script to check database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fgpsrnwlctxjdpnkndqw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHNybndsY3R4amRwbmtuZHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2MDcyNiwiZXhwIjoyMDc5NDM2NzI2fQ.RA8G3VtpbmHP3DQc4CmFymL-4QAoxZla5APDezNuUnY'
);

async function debug() {
  console.log('=== CHECKING DATABASE ===\n');
  
  // Check sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*');
  
  console.log('Sources:', sources?.length || 0);
  if (sourcesError) console.error('Sources error:', sourcesError);
  if (sources) sources.forEach(s => console.log(`  - ${s.name}`));
  
  console.log('\n');
  
  // Check stories
  const { data: stories, error: storiesError } = await supabase
    .from('stories_raw')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Stories:', stories?.length || 0);
  if (storiesError) console.error('Stories error:', storiesError);
  if (stories) stories.forEach(s => console.log(`  - ${s.title.substring(0, 60)}...`));
  
  // Count total
  const { count } = await supabase
    .from('stories_raw')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nTotal stories in DB:', count);
}

debug();
