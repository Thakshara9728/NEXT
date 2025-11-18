import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ClaudeAPI } from '@/lib/claude-api';
import { ChatSettings } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/scripts/generate
export async function POST(req: NextRequest) {
  try {
    const { channelId, title, topic, settings, maxSections = 5 } = await req.json();

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

            // Stream the section generation
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
