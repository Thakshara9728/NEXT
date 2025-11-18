export type ClaudeModel = 'claude-sonnet-3-7' | 'claude-sonnet-4-5';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
  model?: ClaudeModel;
}

export interface ChatSettings {
  model: ClaudeModel;
  extendedThinking: boolean;
  webSearch: boolean;
  usePromptCaching: boolean;
  maxTokens: number;
  temperature: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface StreamChunk {
  type: 'content' | 'thinking' | 'done' | 'error';
  content?: string;
  error?: string;
}
