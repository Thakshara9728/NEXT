import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ClaudeAPI } from '@/lib/claude-api';
import { ChatSettings } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limit constants
const RATE_LIMITS = {
  'claude-sonnet-3-7': {
    requestsPerMinute: 50,
    tokensPerMinute: 40000,
    tokensPerDay: 1000000,
  },
  'claude-sonnet-4-5': {
    requestsPerMinute: 50,
    tokensPerMinute: 40000,
    tokensPerDay: 1000000,
  },
};

// Helper: Wait between sections to avoid rate limits
const waitBetweenSections = (seconds: number) =>
  new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Helper: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('rate_limit_error') ||
                          error.status === 429 ||
                          error.message?.includes('429');

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// POST /api/scripts/generate
export async function POST(req: NextRequest) {
  try {
    const { channelId, title, topic, transcript, settings, maxSections = 5 } = await req.json();

    if (!channelId || !title) {
      return new Response(
        JSON.stringify({ error: 'Channel ID and title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get channel with prompts
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return new Response(
        JSON.stringify({ error: 'Channel not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create script record
    const script = await prisma.script.create({
      data: {
        channelId,
        title,
        topic: topic || '',
        status: 'generating',
      },
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await prisma.script.update({
        where: { id: script.id },
        data: { status: 'failed' },
      });
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const claudeAPI = new ClaudeAPI({ apiKey });

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let currentSectionNumber = 1;
          let conversationHistory: any[] = [];

          // Helper to send SSE events
          const sendEvent = (event: string, data: any) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Send rate limit info
          const model = settings.model || 'claude-sonnet-4-5';
          const rateLimit = RATE_LIMITS[model as keyof typeof RATE_LIMITS];
          sendEvent('rate_limit_info', {
            model,
            limits: rateLimit,
            delayBetweenSections: 3, // seconds
          });

          // Generate sections
          while (currentSectionNumber <= maxSections) {
            sendEvent('section_start', {
              scriptId: script.id,
              sectionNumber: currentSectionNumber,
              totalSections: maxSections,
            });

            let currentContent = '';
            let currentThinking = '';
            let currentCitations: any[] = [];

            // Determine which prompt to use
            let userPrompt = '';
            if (currentSectionNumber === 1) {
              // First section: use starting prompt
              userPrompt = channel.startingPrompt.replace('{topic}', topic || title);

              // Append user-provided transcript if available
              if (transcript && transcript.trim()) {
                userPrompt += `\n\n---\n\nVideo Transcript (for reference and factual accuracy):\n\n${transcript.trim()}`;
              }
            } else {
              // Subsequent sections: use continue prompt
              userPrompt = channel.continuePrompt;
            }

            // Build messages for this section
            const messages = [
              ...conversationHistory,
              {
                role: 'user' as const,
                content: userPrompt,
              },
            ];

            // Prepare settings with system prompt
            const generationSettings: ChatSettings = {
              ...settings,
              model: settings.model || 'claude-sonnet-4-5',
            };

            // Stream the section generation with retry logic
            try {
              await retryWithBackoff(async () => {
                for await (const chunk of claudeAPI.streamMessage(messages, generationSettings, channel.systemPrompt)) {
                  if (chunk.type === 'thinking') {
                    currentThinking = chunk.content || '';
                    sendEvent('thinking', {
                      sectionNumber: currentSectionNumber,
                      thinking: currentThinking,
                    });
                  } else if (chunk.type === 'content') {
                    currentContent = chunk.content || '';
                    sendEvent('content', {
                      sectionNumber: currentSectionNumber,
                      content: currentContent,
                    });
                  } else if (chunk.type === 'citation') {
                    if (chunk.citations) {
                      currentCitations = [...currentCitations, ...chunk.citations];
                    }
                    sendEvent('citation', {
                      sectionNumber: currentSectionNumber,
                      citations: chunk.citations,
                    });
                  } else if (chunk.type === 'error') {
                    throw new Error(chunk.error || 'Generation error');
                  }
                }
              });
            } catch (error: any) {
              // Check if it's a rate limit error
              const isRateLimit = error.message?.includes('rate_limit_error') ||
                                  error.message?.includes('429');

              if (isRateLimit) {
                sendEvent('rate_limit_error', {
                  sectionNumber: currentSectionNumber,
                  error: 'Rate limit exceeded. Please wait and try again, or reduce max tokens/sections.',
                  details: error.message,
                });
              }
              throw error;
            }

            // Save section to database
            await prisma.scriptSection.create({
              data: {
                scriptId: script.id,
                sectionNumber: currentSectionNumber,
                content: currentContent,
                thinking: currentThinking || null,
              },
            });

            // Add to conversation history
            conversationHistory.push(
              {
                role: 'user',
                content: userPrompt,
              },
              {
                role: 'assistant',
                content: currentContent,
              }
            );

            sendEvent('section_complete', {
              sectionNumber: currentSectionNumber,
              scriptId: script.id,
            });

            currentSectionNumber++;

            // Wait 3 seconds between sections to avoid rate limits
            if (currentSectionNumber <= maxSections) {
              sendEvent('waiting', {
                message: 'Waiting 3 seconds to avoid rate limits...',
                nextSection: currentSectionNumber,
              });
              await waitBetweenSections(3);
            }
          }

          // Update script status
          await prisma.script.update({
            where: { id: script.id },
            data: { status: 'completed' },
          });

          sendEvent('generation_complete', {
            scriptId: script.id,
            totalSections: maxSections,
          });

          controller.close();
        } catch (error: any) {
          console.error('Script generation error:', error);

          // Update script status to failed
          await prisma.script.update({
            where: { id: script.id },
            data: { status: 'failed' },
          });

          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
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
