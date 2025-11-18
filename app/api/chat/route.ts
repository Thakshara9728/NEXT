import { NextRequest } from 'next/server';
import { ClaudeAPI } from '@/lib/claude-api';
import { performWebSearch, formatSearchResults, getSearchProvider } from '@/lib/web-search';
import { ChatSettings, Message } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messages, settings } = await req.json() as {
      messages: Message[];
      settings: ChatSettings;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Perform web search if enabled
    let webSearchResults: string | undefined;
    if (settings.webSearch && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        const searchApiKey = process.env.WEB_SEARCH_API_KEY;
        const searchProvider = getSearchProvider();
        const results = await performWebSearch(
          lastUserMessage.content,
          searchApiKey,
          searchProvider
        );
        webSearchResults = formatSearchResults(results);
      }
    }

    const claudeAPI = new ClaudeAPI({ apiKey });

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of claudeAPI.streamMessage(
            messages,
            settings,
            webSearchResults
          )) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error.message || 'An error occurred while streaming',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
