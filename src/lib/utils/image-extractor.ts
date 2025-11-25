import * as cheerio from 'cheerio';

export async function extractImageFromURL(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SourceNewsBot/1.0)',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try multiple methods to find the article image
    const imageSources = [
      // Open Graph image
      $('meta[property="og:image"]').attr('content'),
      $('meta[property="og:image:secure_url"]').attr('content'),
      
      // Twitter Card image
      $('meta[name="twitter:image"]').attr('content'),
      $('meta[name="twitter:image:src"]').attr('content'),
      
      // Article image tags
      $('article img').first().attr('src'),
      $('.article-image img').first().attr('src'),
      $('.post-thumbnail img').first().attr('src'),
      $('.featured-image img').first().attr('src'),
      
      // WordPress specific
      $('.wp-post-image').first().attr('src'),
      
      // Generic first image in content
      $('.entry-content img').first().attr('src'),
      $('.post-content img').first().attr('src'),
    ];

    // Return first valid image URL
    for (const src of imageSources) {
      if (src && src.startsWith('http')) {
        return src;
      }
    }

    return null;
  } catch (error) {
    console.error('Image extraction error:', error);
    return null;
  }
}
