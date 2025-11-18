import Anthropic from '@anthropic-ai/sdk';
import { ChatSettings, Message } from '@/types';

// Model mapping to actual API model names
const MODEL_MAP = {
  'claude-sonnet-3-7': 'claude-3-7-sonnet-20250219', // Claude Sonnet 3.7
  'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5
} as const;

interface ClaudeAPIOptions {
  apiKey: string;
}

export class ClaudeAPI {
  private client: Anthropic;

  constructor(options: ClaudeAPIOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
    });
  }

  /**
   * Stream a response from Claude with support for:
   * - Prompt caching
   * - Extended thinking with signature handling
   * - Native web search tool with citations
   * - Proper event handling for all streaming types
   */
  async *streamMessage(
    messages: Message[],
    settings: ChatSettings
  ): AsyncGenerator<{
    type: 'content' | 'thinking' | 'signature' | 'done' | 'error' | 'citation';
    content?: string;
    error?: string;
    citations?: any[];
  }> {
    try {
      const modelId = MODEL_MAP[settings.model];

      // Build system prompt with caching
      const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [];

      // Base system prompt (cached for efficiency)
      const baseSystemPrompt = `You are Claude, a helpful AI assistant specialized in generating YouTube scripts and assisting with content creation.

You have access to real-time web information through the web search tool when needed.

When generating YouTube scripts:
- Create engaging hooks and introductions
- Structure content with clear sections
- Include timestamps and suggestions for visuals
- Make content suitable for the target audience
- Add calls-to-action where appropriate

When using web search:
- Always cite your sources
- Provide URLs for factual claims
- Indicate when information is from web search results`;

      // Use prompt caching for the base system prompt
      if (settings.usePromptCaching) {
        systemMessages.push({
          type: 'text',
          text: baseSystemPrompt,
          cache_control: { type: 'ephemeral' },
        });
      } else {
        systemMessages.push({
          type: 'text',
          text: baseSystemPrompt,
        });
      }

      // Convert messages to Claude format
      const claudeMessages: Anthropic.Messages.MessageParam[] = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // Prepare request parameters
      const requestParams: Anthropic.Messages.MessageCreateParamsStreaming = {
        model: modelId,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        system: systemMessages,
        messages: claudeMessages,
        stream: true,
      };

      // Add extended thinking if enabled
      if (settings.extendedThinking) {
        // Calculate thinking budget (defaults to 25% of max_tokens, min 1024, max configurable)
        const thinkingBudget = Math.max(
          1024,
          Math.min(
            settings.thinkingBudget || Math.floor(settings.maxTokens * 0.25),
            settings.maxTokens - 1000 // Reserve some tokens for actual output
          )
        );

        requestParams.thinking = {
          type: 'enabled',
          budget_tokens: thinkingBudget,
        };
      }

      // Add native web search tool if enabled
      if (settings.webSearch) {
        requestParams.tools = [
          {
            type: 'web_search_20250305' as any,
            name: 'web_search',
            max_uses: settings.webSearchMaxUses || 5,
          },
        ];
      }

      const stream = await this.client.messages.create(requestParams);

      let currentThinking = '';
      let currentContent = '';
      let currentSignature = '';
      let currentCitations: any[] = [];

      for await (const event of stream) {
        // Handle different event types
        if (event.type === 'message_start') {
          // New message starting
          currentThinking = '';
          currentContent = '';
          currentSignature = '';
          currentCitations = [];
        } else if (event.type === 'content_block_start') {
          // New content block starting
          const block = event.content_block;
          if (block.type === 'thinking') {
            currentThinking = '';
          } else if (block.type === 'text') {
            currentContent = '';
            // Reset citations for new text block
            const textBlock = block as any;
            if (textBlock.citations) {
              currentCitations = textBlock.citations;
            }
          }
        } else if (event.type === 'content_block_delta') {
          // Content delta (incremental updates)
          const delta = event.delta;

          if (delta.type === 'thinking_delta') {
            currentThinking += delta.thinking;
            yield { type: 'thinking', content: currentThinking };
          } else if (delta.type === 'text_delta') {
            const textDelta = delta as any;
            currentContent += textDelta.text;

            // Check for citations in the delta
            if (textDelta.citations) {
              currentCitations = [...currentCitations, ...textDelta.citations];
              yield {
                type: 'citation',
                content: currentContent,
                citations: textDelta.citations
              };
            } else {
              yield { type: 'content', content: currentContent };
            }
          } else if (delta.type === 'signature_delta') {
            // Signature for thinking verification (appears at end of thinking block)
            currentSignature += delta.signature;
            yield { type: 'signature', content: currentSignature };
          }
        } else if (event.type === 'content_block_stop') {
          // Content block completed
          // Nothing specific to do here, but could be used for logging
        } else if (event.type === 'message_delta') {
          // Message-level updates (usage, stop_reason, etc.)
          // Could extract usage information here if needed
        } else if (event.type === 'message_stop') {
          // Stream complete
          yield { type: 'done' };
        } else if (event.type === 'ping') {
          // Ping events to keep connection alive - ignore
          continue;
        } else if (event.type === 'error') {
          // Error event
          const errorEvent = event as any;
          yield {
            type: 'error',
            error: errorEvent.error?.message || 'Unknown streaming error'
          };
        }
      }
    } catch (error: any) {
      console.error('Claude API Error:', error);
      yield {
        type: 'error',
        error: error.message || 'An error occurred during streaming'
      };
    }
  }

  /**
   * Non-streaming message (useful for some cases)
   */
  async sendMessage(
    messages: Message[],
    settings: ChatSettings
  ): Promise<{ content: string; thinking?: string; citations?: any[] }> {
    const modelId = MODEL_MAP[settings.model];

    const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [];

    const baseSystemPrompt = `You are Claude, a helpful AI assistant specialized in generating YouTube scripts and assisting with content creation.

You have access to real-time web information through the web search tool when needed.`;

    if (settings.usePromptCaching) {
      systemMessages.push({
        type: 'text',
        text: baseSystemPrompt,
        cache_control: { type: 'ephemeral' },
      });
    } else {
      systemMessages.push({
        type: 'text',
        text: baseSystemPrompt,
      });
    }

    const claudeMessages: Anthropic.Messages.MessageParam[] = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const requestParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: modelId,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
      system: systemMessages,
      messages: claudeMessages,
      stream: false,
    };

    if (settings.extendedThinking) {
      requestParams.thinking = {
        type: 'enabled',
        budget_tokens: settings.thinkingBudget || 2000,
      };
    }

    // Add native web search tool if enabled
    if (settings.webSearch) {
      requestParams.tools = [
        {
          type: 'web_search_20250305' as any,
          name: 'web_search',
          max_uses: settings.webSearchMaxUses || 5,
        },
      ];
    }

    const response = await this.client.messages.create(requestParams);

    let content = '';
    let thinking = '';
    let citations: any[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        const textBlock = block as any;
        content += textBlock.text;
        if (textBlock.citations) {
          citations = [...citations, ...textBlock.citations];
        }
      } else if (block.type === 'thinking') {
        thinking += block.thinking;
      }
    }

    return {
      content,
      thinking: thinking || undefined,
      citations: citations.length > 0 ? citations : undefined
    };
  }
}
