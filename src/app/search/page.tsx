import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q: query = '', category, sort = 'date' } = await searchParams;
  
  let stories: any[] = [];
  
  if (query) {
    let dbQuery = supabaseAdmin
      .from('stories_raw')
      .select(`
        id,
        title,
        content,
        url,
        published_at,
        metadata,
        category,
        sources (name, bias_lean)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    
    if (category && category !== 'All') {
      dbQuery = dbQuery.eq('category', category);
    }
    
    if (sort === 'date') {
      dbQuery = dbQuery.order('published_at', { ascending: false });
    } else if (sort === 'source') {
      dbQuery = dbQuery.order('source_id', { ascending: true });
    }
    
    dbQuery = dbQuery.limit(50);
    
    const { data } = await dbQuery;
    stories = data || [];
  }

  const categories = ['All', 'Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'Health', 'General'];

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Search Results</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {query ? `Found ${stories.length} results for "${query}"` : 'Enter a search query'}
        </p>

        {query && (
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</label>
              <div className="flex gap-1">
                {categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/search?q=${query}&category=${cat}&sort=${sort}`}
                    className={`px-3 py-1 text-xs rounded transition ${
                      (category || 'All') === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
              <select
                value={sort}
                onChange={(e) => window.location.href = `/search?q=${query}&category=${category || 'All'}&sort=${e.target.value}`}
                className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="date">Latest First</option>
                <option value="source">By Source</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => {
            const imageUrl = story.metadata?.image || story.metadata?.og_image || story.metadata?.urlToImage;
            return (
              <Link
                key={story.id}
                href={`/story/${story.id}`}
                className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
              >
                {imageUrl && (
                  <img src={imageUrl} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3 line-clamp-3 text-gray-900 dark:text-gray-100">
                    {story.title}
                  </h3>
                  
                  <div className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{story.sources?.name}</span>
                    {story.published_at && (
                      <span className="text-xs">{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {story.category && (
                      <span className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {story.category}
                      </span>
                    )}
                    {story.sources?.bias_lean && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                        {story.sources.bias_lean}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {query && stories.length === 0 && (
          <p className="text-center text-gray-500 mt-12">
            No stories found. Try a different search term.
          </p>
        )}
      </div>
    </main>
  );
}
