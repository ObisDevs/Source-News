'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    setStatus('Fetching news...');
    
    try {
      // Step 1: Ingest new stories
      const ingestResponse = await fetch('/api/worker/ingest', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev_secret_123',
        },
      });
      
      if (!ingestResponse.ok) {
        throw new Error('Ingestion failed');
      }
      
      const ingestData = await ingestResponse.json();
      console.log('Ingestion result:', ingestData);
      
      const { ingested, skipped, errors } = ingestData.results || { ingested: 0, skipped: 0, errors: 0 };
      console.log(`Ingested: ${ingested}, Skipped: ${skipped}, Errors: ${errors}`);
      
      if (errors > 0) {
        setStatus(`Warning: ${errors} errors occurred`);
      }
      
      // Process if stories were ingested
      if (ingested > 0) {
        setStatus(`Ingested ${ingestData.results.ingested} stories. Processing...`);
        
        // Step 2: Process stories (embeddings + clustering)
        const processResponse = await fetch('/api/worker/process', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer dev_secret_123',
          },
        });
        
        if (processResponse.ok) {
          const processData = await processResponse.json();
          console.log('Processing result:', processData);
          setStatus('Done! Refreshing view...');
        }
      } else {
        setStatus('No new stories. Refreshing view...');
      }
      
      // Step 3: Refresh the data without full page reload
      setTimeout(() => {
        router.refresh();
        setStatus('');
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Refresh error:', error);
      setStatus('Failed to fetch news');
      setTimeout(() => {
        setStatus('');
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        title="Fetch latest news"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </button>
      {status && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {status}
        </span>
      )}
    </div>
  );
}
