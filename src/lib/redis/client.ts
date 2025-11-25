// Mock Redis client for development (replace with actual KV in production)
type CacheValue = string | number | object | null;

const cache = new Map<string, { value: CacheValue; expires: number }>();

export async function getCached<T>(key: string): Promise<T | null> {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.value as T;
}

export async function setCache(key: string, value: CacheValue, ttl: number): Promise<void> {
  cache.set(key, {
    value,
    expires: Date.now() + ttl * 1000,
  });
}

export async function checkFingerprint(hash: string): Promise<boolean> {
  return (await getCached(`fingerprint:${hash}`)) !== null;
}

export async function setFingerprint(hash: string): Promise<void> {
  await setCache(`fingerprint:${hash}`, '1', 604800); // 7 days
}

export async function deleteCache(key: string): Promise<void> {
  cache.delete(key);
}
