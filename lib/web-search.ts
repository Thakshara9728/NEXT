/**
 * Web Search Integration
 *
 * Supports multiple search providers:
 * - Tavily API (recommended - https://tavily.com/)
 * - Brave Search API (https://brave.com/search/api/)
 *
 * Set WEB_SEARCH_API_KEY and optionally WEB_SEARCH_PROVIDER in .env.local
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export type SearchProvider = 'tavily' | 'brave';

interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

/**
 * Perform web search using Tavily API
 */
async function searchWithTavily(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data: TavilySearchResponse = await response.json();

    return data.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      score: result.score,
    }));
  } catch (error: any) {
    console.error('Tavily search error:', error);
    throw new Error(`Tavily search failed: ${error.message}`);
  }
}

/**
 * Perform web search using Brave Search API
 */
async function searchWithBrave(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.append('q', query);
    url.searchParams.append('count', '5');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
    }

    const data: BraveSearchResponse = await response.json();

    if (!data.web?.results) {
      return [];
    }

    return data.web.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
    }));
  } catch (error: any) {
    console.error('Brave search error:', error);
    throw new Error(`Brave search failed: ${error.message}`);
  }
}

/**
 * Perform web search using the configured provider
 *
 * @param query - The search query
 * @param apiKey - API key for the search provider
 * @param provider - Search provider to use (defaults to 'tavily')
 * @returns Array of search results
 */
export async function performWebSearch(
  query: string,
  apiKey?: string,
  provider: SearchProvider = 'tavily'
): Promise<SearchResult[]> {
  // If no API key, return helpful message
  if (!apiKey) {
    return [
      {
        title: 'Web Search Not Configured',
        url: '#',
        snippet:
          'To enable web search, add WEB_SEARCH_API_KEY to your .env.local file. ' +
          'Optionally set WEB_SEARCH_PROVIDER=tavily (default) or WEB_SEARCH_PROVIDER=brave.',
        score: 1,
      },
    ];
  }

  // Sanitize query
  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return [];
  }

  // Perform search based on provider
  try {
    switch (provider) {
      case 'brave':
        return await searchWithBrave(sanitizedQuery, apiKey);
      case 'tavily':
      default:
        return await searchWithTavily(sanitizedQuery, apiKey);
    }
  } catch (error: any) {
    console.error(`Web search error with ${provider}:`, error);

    // Return error as a result so user knows what went wrong
    return [
      {
        title: 'Search Error',
        url: '#',
        snippet: `Failed to perform web search: ${error.message}`,
        score: 0,
      },
    ];
  }
}

/**
 * Format search results into a readable string for Claude's context
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  const formattedResults = results
    .map((result, index) => {
      const scoreInfo = result.score !== undefined ? ` (relevance: ${result.score.toFixed(2)})` : '';
      return `[${index + 1}] ${result.title}${scoreInfo}\nURL: ${result.url}\n${result.snippet}\n`;
    })
    .join('\n');

  return `Web Search Results:\n\n${formattedResults}`;
}

/**
 * Get the configured search provider from environment
 */
export function getSearchProvider(): SearchProvider {
  const provider = process.env.WEB_SEARCH_PROVIDER?.toLowerCase();
  if (provider === 'brave') {
    return 'brave';
  }
  return 'tavily'; // Default
}
