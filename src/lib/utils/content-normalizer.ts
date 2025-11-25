export function normalizeContent(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function extractExcerpt(content: string, maxLength = 200): string {
  const normalized = normalizeContent(content);
  if (normalized.length <= maxLength) return normalized;
  return normalized.substring(0, maxLength).trim() + '...';
}

export function sanitizeTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
