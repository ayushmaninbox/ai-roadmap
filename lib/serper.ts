import { Resource, ResourceType } from './types';

const SERPER_API_URL = 'https://google.serper.dev/search';

/**
 * Fetches web resources (docs, articles, tutorials) for a given topic using Serper.dev
 * Returns top 2-3 relevant web resources
 */
export async function fetchWebResources(query: string): Promise<Resource[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error('SERPER_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${query} tutorial guide documentation`,
        num: 20,
        gl: 'us',
        hl: 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.organic || [];

    if (results.length === 0) {
      return [];
    }

    // Score and filter results
    const scoredResults = results
      .map((result: any) => {
        const link = result.link || '';
        const title = result.title || '';
        const snippet = result.snippet || '';
        const domain = extractDomain(link);

        // Skip if no meaningful data
        if (!link || !title || !snippet) return null;

        // Skip video sites (handled by YouTube API)
        if (domain.includes('youtube.com') || domain.includes('vimeo.com')) {
          return null;
        }

        // Skip social media (except Stack Overflow)
        if (
          ['twitter.com', 'facebook.com', 'instagram.com', 'reddit.com'].some(site =>
            domain.includes(site)
          )
        ) {
          return null;
        }

        // Determine resource type
        const resourceType = detectResourceType(domain, title);

        // Calculate score
        let score = 0;

        // Official documentation gets highest priority
        if (
          domain.includes('docs.') ||
          domain.includes('documentation') ||
          title.toLowerCase().includes('official')
        ) {
          score += 10;
        }

        // Well-known educational sites
        const educationalDomains = [
          'developer.mozilla.org',
          'w3schools.com',
          'freecodecamp.org',
          'dev.to',
          'medium.com',
          'stackoverflow.com',
          'github.com',
        ];
        if (educationalDomains.some(site => domain.includes(site))) {
          score += 5;
        }

        // Title relevance (keyword match)
        const queryWords = query.toLowerCase().split(' ');
        const titleLower = title.toLowerCase();
        const matchCount = queryWords.filter(word => titleLower.includes(word)).length;
        score += matchCount;

        // Description quality (prefer 50-300 chars)
        const descLength = snippet.length;
        if (descLength >= 50 && descLength <= 300) {
          score += 1;
        }

        return {
          result,
          score,
          type: resourceType,
          domain,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);

    // Select top results with variety
    const selected: typeof scoredResults = [];
    const usedDomains = new Set<string>();

    // First, add official documentation if exists
    const officialDoc = scoredResults.find(r => r.type === 'documentation' && r.score >= 10);
    if (officialDoc) {
      selected.push(officialDoc);
      usedDomains.add(officialDoc.domain);
    }

    // Then add other resources, avoiding duplicate domains
    for (const item of scoredResults) {
      if (selected.length >= 3) break;
      if (usedDomains.has(item.domain)) continue;

      selected.push(item);
      usedDomains.add(item.domain);
    }

    // Ensure at least 2 resources
    if (selected.length < 2 && scoredResults.length > 0) {
      // Add more even if same domain
      for (const item of scoredResults) {
        if (selected.length >= 2) break;
        if (!selected.includes(item)) {
          selected.push(item);
        }
      }
    }

    // Transform to Resource format
    return selected.slice(0, 3).map((item, index) => {
      const result = item.result;
      return {
        id: `resource_web_${index + 1}`,
        type: item.type,
        title: truncateTitle(result.title),
        url: result.link,
        description: result.snippet.substring(0, 200),
        source: item.domain,
        metadata: {},
      };
    });
  } catch (error) {
    console.error('Serper API error:', error);
    throw new Error('Failed to fetch web resources');
  }
}

/**
 * Extracts domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Detects resource type based on domain and title
 */
function detectResourceType(domain: string, title: string): ResourceType {
  const lowerDomain = domain.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Documentation
  if (
    lowerDomain.includes('docs') ||
    lowerDomain.includes('documentation') ||
    lowerDomain.includes('api')
  ) {
    return 'documentation';
  }

  // Articles
  if (
    lowerDomain.includes('dev.to') ||
    lowerDomain.includes('medium.com') ||
    lowerDomain.includes('blog')
  ) {
    return 'article';
  }

  // Tutorials
  if (lowerTitle.includes('tutorial') || lowerTitle.includes('guide') || lowerTitle.includes('course')) {
    return 'tutorial';
  }

  // Default to article
  return 'article';
}

/**
 * Truncates title to max length
 */
function truncateTitle(title: string, maxLength: number = 80): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}
