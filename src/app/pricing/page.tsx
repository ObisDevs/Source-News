'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price');
    
    setTiers(data || []);
    setLoading(false);
  };

  const handleSubscribe = async (tierId: string) => {
    setProcessingTier(tierId);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login?redirect=/pricing');
        return;
      }

      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert('Failed to initialize payment');
      }
    } catch (error) {
      alert('Failed to process subscription');
    } finally {
      setProcessingTier(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Get access to AI-powered news analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {tiers.map((tier) => (
            <div key={tier.id} className={`bg-white dark:bg-gray-900 border-2 rounded-lg p-8 ${
              tier.name === 'Premium' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-800'
            }`}>
              {tier.name === 'Premium' && (
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                  POPULAR
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₦{tier.price.toLocaleString()}
                </span>
                {tier.price > 0 && <span className="text-gray-600 dark:text-gray-400">/month</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.ai_explanations && (
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {tier.limits.ai_explanations_per_day > 0 
                      ? `${tier.limits.ai_explanations_per_day} AI explanations/day`
                      : 'AI explanations'}
                  </li>
                )}
                {tier.features.bookmarks && (
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {tier.limits.bookmarks === -1 ? 'Unlimited' : tier.limits.bookmarks} bookmarks
                  </li>
                )}
                {tier.features.ad_free && (
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Ad-free experience
                  </li>
                )}
                {tier.features.priority_support && (
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={processingTier === tier.id || tier.price === 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  tier.name === 'Premium'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : tier.price === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
                } disabled:opacity-50`}
              >
                {processingTier === tier.id ? 'Processing...' : tier.price === 0 ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
