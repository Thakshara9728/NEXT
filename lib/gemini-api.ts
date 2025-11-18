import { GoogleGenAI } from '@google/genai';
import { ChatSettings, Message } from '@/types';

// Model mapping to actual API model names
const MODEL_MAP = {
  'gemini-3-pro': 'gemini-3-pro-preview',
  'gemini-2-flash': 'gemini-2.0-flash-exp',
  'gemini-2-thinking': 'gemini-2.0-flash-thinking-exp-01-21',
} as const;

interface GeminiAPIOptions {
  apiKey: string;
}

export class GeminiAPI {
  private client: GoogleGenAI;

  constructor(options: GeminiAPIOptions) {
    this.client = new GoogleGenAI({
      apiKey: options.apiKey,
    });
  }

  /**
   * Stream a response from Gemini with support for:
   * - Google Search tool
   * - Extended thinking (for thinking models)
   * - Proper event handling for all streaming types
   */
  async *streamMessage(
    messages: Message[],
    settings: ChatSettings,
    customSystemPrompt?: string
  ): AsyncGenerator<{
    type: 'content' | 'thinking' | 'done' | 'error';
    content?: string;
    error?: string;
  }> {
    try {
      const modelId = MODEL_MAP[settings.model as keyof typeof MODEL_MAP] || 'gemini-3-pro-preview';

      // Build config
      const config: any = {
        systemInstruction: customSystemPrompt ? [{ text: customSystemPrompt }] : undefined,
      };

      // Add thinking config for thinking models
      if (settings.extendedThinking && modelId.includes('thinking')) {
        config.thinkingConfig = {
          thinkingLevel: 'HIGH',
        };
      }

      // Add Google Search tool if enabled
      if (settings.webSearch) {
        config.tools = [
          {
            googleSearch: {},
          },
        ];
      }

      // Convert messages to Gemini format
      const geminiContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Stream response
      const response = await this.client.models.generateContentStream({
        model: modelId,
        config,
        contents: geminiContents,
      });

      let currentContent = '';
      let currentThinking = '';

      for await (const chunk of response) {
        if (chunk.text) {
          currentContent += chunk.text;
          yield { type: 'content', content: currentContent };
        }

        // Handle thinking content if present
        if (chunk.thoughts && chunk.thoughts.length > 0) {
          for (const thought of chunk.thoughts) {
            if (thought.thought) {
              currentThinking += thought.thought;
              yield { type: 'thinking', content: currentThinking };
            }
          }
        }
      }

      yield { type: 'done' };
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      yield {
        type: 'error',
        error: error.message || 'An error occurred during streaming',
      };
    }
  }

  /**
   * Non-streaming message (useful for some cases)
   */
  async sendMessage(
    messages: Message[],
    settings: ChatSettings,
    customSystemPrompt?: string
  ): Promise<{ content: string; thinking?: string }> {
    const modelId = MODEL_MAP[settings.model as keyof typeof MODEL_MAP] || 'gemini-3-pro-preview';

    const config: any = {
      systemInstruction: customSystemPrompt ? [{ text: customSystemPrompt }] : undefined,
    };

    if (settings.extendedThinking && modelId.includes('thinking')) {
      config.thinkingConfig = {
        thinkingLevel: 'HIGH',
      };
    }

    if (settings.webSearch) {
      config.tools = [
        {
          googleSearch: {},
        },
      ];
    }

    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await this.client.models.generateContent({
      model: modelId,
      config,
      contents: geminiContents,
    });

    let content = '';
    let thinking = '';

    if (response.text) {
      content = response.text;
    }

    if (response.thoughts && response.thoughts.length > 0) {
      thinking = response.thoughts.map((t: any) => t.thought || '').join('\n');
    }

    return {
      content,
      thinking: thinking || undefined,
    };
  }
}
