import { create } from 'zustand';
import { Message, ChatSettings, Citation } from '@/types';

interface ChatStore {
  messages: Message[];
  settings: ChatSettings;
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, thinking?: string, citations?: Citation[]) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  settings: {
    model: 'claude-sonnet-4-5',
    extendedThinking: false,
    webSearch: false,
    usePromptCaching: true,
    maxTokens: 4096,
    temperature: 1.0,
  },
  isStreaming: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateLastMessage: (content, thinking, citations) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content;
        if (thinking) {
          lastMessage.thinking = thinking;
        }
        if (citations) {
          lastMessage.citations = citations;
        }
      }
      return { messages };
    }),
  clearMessages: () => set({ messages: [] }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
}));
