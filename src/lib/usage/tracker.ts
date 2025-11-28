import { getCached, setCache } from '@/lib/redis/client';
import { UsageRecord } from '@/lib/types/subscription';

const getTodayKey = (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  return `usage:${userId}:${today}`;
};

export async function getUsage(userId: string): Promise<UsageRecord> {
  const key = getTodayKey(userId);
  const cached = await getCached<UsageRecord>(key);
  
  if (cached) return cached;
  
  const today = new Date().toISOString().split('T')[0];
  return {
    userId,
    date: today,
    aiExplanations: 0,
    aiSummaries: 0,
  };
}

export async function incrementUsage(
  userId: string,
  type: 'aiExplanations' | 'aiSummaries'
): Promise<UsageRecord> {
  const usage = await getUsage(userId);
  usage[type]++;
  
  const key = getTodayKey(userId);
  await setCache(key, usage, 86400);
  
  return usage;
}

export async function checkLimit(
  userId: string,
  type: 'aiExplanations' | 'aiSummaries',
  limit: number
): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage[type] < limit;
}
