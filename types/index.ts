export type ClaudeModel = 'claude-sonnet-3-7' | 'claude-sonnet-4-5';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
  model?: ClaudeModel;
  citations?: Citation[];
}

export interface Citation {
  type: 'web_search_result_location';
  url: string;
  title: string;
  encrypted_index: string;
  cited_text: string;
}

export interface ChatSettings {
  model: ClaudeModel;
  extendedThinking: boolean;
  webSearch: boolean;
  usePromptCaching: boolean;
  maxTokens: number;
  temperature: number;
  thinkingBudget?: number; // Optional thinking budget tokens (defaults to 25% of maxTokens)
  webSearchMaxUses?: number; // Optional max web search uses (defaults to 5)
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface StreamChunk {
  type: 'content' | 'thinking' | 'signature' | 'done' | 'error' | 'citation';
  content?: string;
  error?: string;
  citations?: Citation[];
}
