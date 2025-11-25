'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const FORCE_FALLBACK_DOMAINS = [
  'vanguardngr.com',
  'dailytrust.com'
];

function shouldUseFallback(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return FORCE_FALLBACK_DOMAINS.some(d => domain.includes(d));
  } catch {
    return false;
  }
}

export default function SourceViewerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');
  const title = searchParams.get('title');
  const forceFallback = url ? shouldUseFallback(url) : false;
  const [loading, setLoading] = useState(!forceFallback);
  const [iframeError, setIframeError] = useState(forceFallback);
  const [storyData, setStoryData] = useState<any>(null);

  useEffect(() => {
    if (forceFallback) return;
    const timer = setTimeout(() => {
      if (loading) {
        setIframeError(true);
        setLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, forceFallback]);

  useEffect(() => {
    if (iframeError && url) {
      fetch(`/api/story/by-url?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => setStoryData(data))
        .catch(() => {});
    }
  }, [iframeError, url]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No source URL provided</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Browser Controls */}
        <div className="mb-4 flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{url}</span>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Tablet-like Frame */}
        <div className="relative bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6">
          {/* Device Frame */}
          <div className="relative bg-white dark:bg-gray-950 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            {loading && !iframeError && !forceFallback && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-10">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading source...</p>
                </div>
              </div>
            )}

            {iframeError ? (
              <div className="h-full overflow-auto bg-white dark:bg-gray-950 p-8">
                {storyData ? (
                  <div className="max-w-3xl mx-auto">
                    {storyData.image_url && (
                      <img src={storyData.image_url} alt={storyData.title} className="w-full h-64 object-cover rounded-lg mb-6" />
                    )}
                    <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{storyData.title || title}</h1>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 font-bold hover:text-green-700 transition text-sm"
                      >
                        {storyData.source_name || 'Source'}
                      </a>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-blue-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          0
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                          </svg>
                          0
                        </span>
                      </div>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {storyData.content?.split('\n').map((para: string, i: number) => (
                        <p key={i} className="mb-4 text-gray-800 dark:text-gray-200">{para}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Cannot Display in Frame</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This website doesn't allow embedding.
                      </p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Article in New Tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : !forceFallback ? (
              <iframe
                src={url}
                title={title || 'Source Article'}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                onError={() => setIframeError(true)}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : null}
          </div>

          {/* Device Bottom Bar */}
          <div className="mt-4 flex justify-center">
            <div className="w-32 h-1 bg-gray-600 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {title && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          </div>
        )}
      </div>
    </div>
  );
}
