export type SubscriptionTier = 'free' | 'premium';

export interface TierLimits {
  aiExplanationsPerDay: number;
  aiSummariesPerDay: number;
  bookmarksLimit: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    aiExplanationsPerDay: 3,
    aiSummariesPerDay: 5,
    bookmarksLimit: 10,
  },
  premium: {
    aiExplanationsPerDay: 100,
    aiSummariesPerDay: 200,
    bookmarksLimit: 1000,
  },
};

export interface UsageRecord {
  userId: string;
  date: string;
  aiExplanations: number;
  aiSummaries: number;
}
