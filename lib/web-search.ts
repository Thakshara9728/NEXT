/**
 * Web Search Integration
 *
 * This is a placeholder implementation for web search.
 * You can integrate with services like:
 * - Tavily API (https://tavily.com/)
 * - Brave Search API (https://brave.com/search/api/)
 * - Google Custom Search
 * - Bing Search API
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export async function performWebSearch(
  query: string,
  apiKey?: string
): Promise<SearchResult[]> {
  // If no API key, return mock results for demo purposes
  if (!apiKey) {
    return [
      {
        title: 'Web Search Not Configured',
        url: '#',
        snippet: 'To enable web search, add WEB_SEARCH_API_KEY to your .env.local file.',
        score: 1,
      },
    ];
  }

  // TODO: Implement actual web search integration
  // Example with Tavily:
  /*
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
      max_results: 5,
    }),
  });

  const data = await response.json();
  return data.results.map((result: any) => ({
    title: result.title,
    url: result.url,
    snippet: result.content,
    score: result.score,
  }));
  */

  return [];
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.snippet}\n`
    )
    .join('\n');
}
