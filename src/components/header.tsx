'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { SearchBar } from './search-bar';
import { useAuth } from './auth/auth-provider';
import { useState, useEffect } from 'react';

const CATEGORIES = ['Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'Health', 'General'];

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'All';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Source News
          </Link>
          
          <div className="flex items-center gap-2">
            <Link
              href="/timeline"
              className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Timeline
            </Link>
            <ThemeToggle />
            {mounted && (
              user ? (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Login
                </Link>
              )
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <Link
            href="/"
            className={`px-3 py-1 text-xs whitespace-nowrap rounded transition ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            All
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/?category=${cat}`}
              className={`px-3 py-1 text-xs whitespace-nowrap rounded transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
        
        <SearchBar />
      </div>
    </header>
  );
}
