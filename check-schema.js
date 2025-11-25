// Check actual table schema
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fgpsrnwlctxjdpnkndqw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHNybndsY3R4amRwbmtuZHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2MDcyNiwiZXhwIjoyMDc5NDM2NzI2fQ.RA8G3VtpbmHP3DQc4CmFymL-4QAoxZla5APDezNuUnY'
);

async function check() {
  // Get one story to see columns
  const { data, error } = await supabase
    .from('stories_raw')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data[0]) {
    console.log('Available columns:');
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
    console.log('\nSample story:');
    console.log(data[0]);
  }
}

check();
