import { ingestRSSFeeds } from '../src/lib/workers/rss-ingest';

async function main() {
  console.log('Starting manual RSS ingestion with image extraction...\n');
  
  try {
    const result = await ingestRSSFeeds();
    console.log('\n✅ Ingestion completed!');
    console.log('Results:', result);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
