import { supabaseAdmin } from '@/lib/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

export default async function HistoryPage() {
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));

  const dailyCounts = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const { count } = await supabaseAdmin
        .from('stories_raw')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', dayStart.toISOString())
        .lte('published_at', dayEnd.toISOString());

      return { date: day, count: count || 0 };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/timeline"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Timeline
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">News History</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Browse news from the past 30 days
            </p>
          </div>
          <Link
            href="/timeline"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Today
          </Link>
        </div>

        <div className="space-y-2">
          {dailyCounts.map(({ date, count }) => {
            const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            return (
              <Link
                key={date.toISOString()}
                href={`/timeline?date=${format(date, 'yyyy-MM-dd')}`}
                className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {format(date, 'd')}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {format(date, 'MMM')}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {isToday ? 'Today' : format(date, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {count} {count === 1 ? 'story' : 'stories'} published
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
