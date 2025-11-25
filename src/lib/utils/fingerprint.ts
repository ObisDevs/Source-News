import crypto from 'crypto';

export function generateFingerprint(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking params
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_content');
    parsed.searchParams.delete('utm_term');
    return parsed.toString();
  } catch {
    return url;
  }
}
