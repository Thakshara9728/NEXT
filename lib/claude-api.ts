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
   * - Web search context
   * - Proper event handling for all streaming types
   */
  async *streamMessage(
    messages: Message[],
    settings: ChatSettings,
    webSearchResults?: string
  ): AsyncGenerator<{
    type: 'content' | 'thinking' | 'signature' | 'done' | 'error';
    content?: string;
    error?: string;
  }> {
    try {
      const modelId = MODEL_MAP[settings.model];

      // Build system prompt with caching
      const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [];

      // Base system prompt (cached for efficiency)
      let baseSystemPrompt = `You are Claude, a helpful AI assistant specialized in generating YouTube scripts and assisting with content creation.

You have access to current information and can provide detailed, creative, and engaging responses.

When generating YouTube scripts:
- Create engaging hooks and introductions
- Structure content with clear sections
- Include timestamps and suggestions for visuals
- Make content suitable for the target audience
- Add calls-to-action where appropriate`;

      // Add web search results to system context if available
      if (settings.webSearch && webSearchResults) {
        baseSystemPrompt += `\n\nCurrent web search results for context:\n${webSearchResults}`;
      }

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

      const stream = await this.client.messages.create(requestParams);

      let currentThinking = '';
      let currentContent = '';
      let currentSignature = '';

      for await (const event of stream) {
        // Handle different event types
        if (event.type === 'message_start') {
          // New message starting
          currentThinking = '';
          currentContent = '';
          currentSignature = '';
        } else if (event.type === 'content_block_start') {
          // New content block starting
          const block = event.content_block;
          if (block.type === 'thinking') {
            currentThinking = '';
          } else if (block.type === 'text') {
            currentContent = '';
          }
        } else if (event.type === 'content_block_delta') {
          // Content delta (incremental updates)
          const delta = event.delta;

          if (delta.type === 'thinking_delta') {
            currentThinking += delta.thinking;
            yield { type: 'thinking', content: currentThinking };
          } else if (delta.type === 'text_delta') {
            currentContent += delta.text;
            yield { type: 'content', content: currentContent };
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
    settings: ChatSettings,
    webSearchResults?: string
  ): Promise<{ content: string; thinking?: string }> {
    const modelId = MODEL_MAP[settings.model];

    const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [];

    let baseSystemPrompt = `You are Claude, a helpful AI assistant specialized in generating YouTube scripts and assisting with content creation.`;

    if (settings.webSearch && webSearchResults) {
      baseSystemPrompt += `\n\nCurrent web search results:\n${webSearchResults}`;
    }

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
        budget_tokens: 2000,
      };
    }

    const response = await this.client.messages.create(requestParams);

    let content = '';
    let thinking = '';

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'thinking') {
        thinking += block.thinking;
      }
    }

    return { content, thinking: thinking || undefined };
  }
}
