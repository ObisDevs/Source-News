// Check if we have any clusters
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fgpsrnwlctxjdpnkndqw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHNybndsY3R4amRwbmtuZHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2MDcyNiwiZXhwIjoyMDc5NDM2NzI2fQ.RA8G3VtpbmHP3DQc4CmFymL-4QAoxZla5APDezNuUnY'
);

async function check() {
  const { data: clusters, error } = await supabase
    .from('story_clusters')
    .select('id, primary_title')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Clusters found:', clusters?.length || 0);
  if (clusters && clusters.length > 0) {
    console.log('\nSample clusters:');
    clusters.forEach(c => console.log(`  - ${c.primary_title}`));
    console.log('\nTest URL: http://localhost:3000/story/' + clusters[0].id);
  } else {
    console.log('\n⚠️  No clusters found. Story detail pages won\'t work.');
    console.log('Run the processing worker to create clusters:');
    console.log('  curl http://localhost:3000/api/worker/process');
  }
}

check();
