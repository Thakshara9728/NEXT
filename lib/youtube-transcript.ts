import { ApifyClient } from 'apify-client';

export interface TranscriptResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

/**
 * Fetch YouTube video transcript using Apify YouTube Scraper
 * @param youtubeUrl - Full YouTube URL (e.g., https://www.youtube.com/watch?v=...)
 * @returns TranscriptResult with transcript text or error
 */
export async function fetchYoutubeTranscript(youtubeUrl: string): Promise<TranscriptResult> {
  try {
    // Validate YouTube URL format
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!urlPattern.test(youtubeUrl)) {
      return {
        success: false,
        error: 'Invalid YouTube URL format',
      };
    }

    const apiKey = process.env.APIFY_API_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        error: 'APIFY_API_TOKEN not configured in environment variables',
      };
    }

    const client = new ApifyClient({
      token: apiKey,
    });

    // Run the YouTube Scraper actor
    const run = await client.actor('streamers/youtube-scraper').call({
      startUrls: [{ url: youtubeUrl }],
      maxResults: 1,
      // Request subtitle/transcript data
      subtitles: true,
    });

    // Fetch results from the actor's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return {
        success: false,
        error: 'No transcript data found for this video',
      };
    }

    const videoData = items[0] as any;

    // Try to extract transcript from subtitles
    let transcript = '';

    if (videoData.subtitles && Array.isArray(videoData.subtitles)) {
      // Combine all subtitle entries into plain text
      transcript = videoData.subtitles
        .map((sub: any) => sub.text || '')
        .filter((text: string) => text.trim().length > 0)
        .join(' ');
    }

    // Fallback: try description or other text fields
    if (!transcript && videoData.description) {
      transcript = videoData.description;
    }

    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        error: 'No transcript/subtitles available for this video',
      };
    }

    // Clean up the transcript
    transcript = transcript
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      success: true,
      transcript,
    };
  } catch (error: any) {
    console.error('Error fetching YouTube transcript:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch transcript',
    };
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
