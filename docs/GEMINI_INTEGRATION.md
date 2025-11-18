# Gemini API Integration Guide

This guide explains how to use Google's Gemini 3.0 API with the YouTube Script Generator.

## Overview

The application now supports both **Claude (Anthropic)** and **Gemini (Google)** as AI providers for generating YouTube scripts. You can switch between them in the UI.

## Features

### Gemini Models Available
- **Gemini 3.0 Pro** (`gemini-3-pro-preview`) - Latest and most capable model
- **Gemini 2.0 Flash** (`gemini-2.0-flash-exp`) - Fast and efficient
- **Gemini 2.0 Thinking** (`gemini-2.0-flash-thinking-exp-01-21`) - With extended thinking

### Capabilities
- ✅ Real-time streaming responses
- ✅ Google Search integration (built-in)
- ✅ Extended thinking support (thinking models)
- ✅ Multi-section script generation
- ✅ Rate limit handling with retry logic
- ✅ Full conversation history

## Setup

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables

Add your Gemini API key to `.env.local`:

```env
# Claude API Key (existing)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Gemini API Key (new)
GEMINI_API_KEY=your_gemini_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

## Usage

### In the Web UI

1. Go to any channel's "Generate Script" page
2. Select **"Gemini (Google)"** from the AI Provider dropdown
3. Choose your preferred Gemini model
4. Configure other settings as needed
5. Click "Generate Script"

### Programmatic Usage

```typescript
import { GeminiAPI } from '@/lib/gemini-api';

const geminiAPI = new GeminiAPI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Streaming
for await (const chunk of geminiAPI.streamMessage(messages, settings, systemPrompt)) {
  if (chunk.type === 'content') {
    console.log(chunk.content);
  }
}

// Non-streaming
const response = await geminiAPI.sendMessage(messages, settings, systemPrompt);
console.log(response.content);
```

## Architecture

### File Structure

```
lib/
  gemini-api.ts              # Gemini API client
app/api/scripts/
  generate-gemini/
    route.ts                 # Gemini generation endpoint
app/generate/[channelId]/
  page.tsx                   # UI with provider selection
```

### API Client (`lib/gemini-api.ts`)

The `GeminiAPI` class provides:
- Streaming and non-streaming message generation
- Automatic thinking extraction (for thinking models)
- Google Search tool integration
- Error handling and retry logic

### Generation Route (`app/api/scripts/generate-gemini/route.ts`)

The Gemini generation endpoint:
- Handles multi-section script generation
- Maintains conversation history
- Implements rate limiting (2s between sections)
- Sends Server-Sent Events (SSE) for real-time updates
- Saves sections to database

## Rate Limits

### Free Tier Limits

| Model | Requests/Min | Tokens/Min |
|-------|-------------|------------|
| Gemini 3.0 Pro | 1000 | 4,000,000 |
| Gemini 2.0 Flash | 2000 | 4,000,000 |
| Gemini 2.0 Thinking | 50 | 32,000 |

The application automatically:
- Waits 2 seconds between sections
- Retries on rate limit errors with exponential backoff
- Displays rate limit information in the UI

## Differences from Claude

### Advantages
- 🚀 Higher rate limits (free tier)
- 🌐 Built-in Google Search (no configuration needed)
- 💰 Lower cost per token
- 🎯 Better for factual, research-heavy content

### Considerations
- 📝 Different prompt engineering style
- 🧠 Thinking available only in specific models
- 🎨 May have different creative style

## Examples

### Standalone Script

See `examples/gemini-youtube-script-generator.ts` for a complete standalone example:

```bash
export GEMINI_API_KEY=your_key_here
npx ts-node examples/gemini-youtube-script-generator.ts
```

### Custom System Prompt

```typescript
const systemPrompt = `
You are a YouTube script writer specializing in educational content.
Generate engaging, well-structured scripts with:
- Attention-grabbing hooks
- Clear sections with timestamps
- Calls to action
- SEO-friendly content
`;

const response = await geminiAPI.sendMessage(
  messages,
  {
    model: 'gemini-3-pro',
    maxTokens: 8192,
    temperature: 0.7,
    webSearch: true,
  },
  systemPrompt
);
```

### Enable Google Search

```typescript
const settings = {
  model: 'gemini-3-pro',
  maxTokens: 8192,
  webSearch: true, // Enable Google Search
};
```

### Enable Extended Thinking

```typescript
const settings = {
  model: 'gemini-2-thinking', // Use thinking model
  maxTokens: 8192,
  extendedThinking: true,
};
```

## Troubleshooting

### "GEMINI_API_KEY is not configured"

**Solution**: Add your API key to `.env.local` and restart the dev server.

### Rate limit errors

**Solution**: The app automatically retries with backoff. If persistent:
- Reduce max sections
- Lower max tokens
- Wait between generations
- Consider upgrading your API tier

### "Model not found" errors

**Solution**: Ensure you're using valid model IDs:
- `gemini-3-pro-preview`
- `gemini-2.0-flash-exp`
- `gemini-2.0-flash-thinking-exp-01-21`

### Thinking not appearing

**Solution**: Extended thinking only works with thinking models:
- Use `gemini-2-thinking`
- Enable "Extended Thinking" in settings

### Different output style from Claude

**Expected**: Gemini and Claude have different personalities. Adjust your system prompt to get the desired style.

## Best Practices

### Model Selection
- **Research/Facts**: Gemini 3.0 Pro with Google Search
- **Speed**: Gemini 2.0 Flash
- **Deep Analysis**: Gemini 2.0 Thinking

### Prompting Tips
- Be specific and detailed in system prompts
- Use examples to guide output format
- Enable Google Search for current events
- Adjust temperature: lower (0.3-0.5) for factual, higher (0.7-1.0) for creative

### Performance
- Use streaming for real-time feedback
- Enable prompt caching for repeated prompts (if supported)
- Batch requests when possible
- Monitor rate limits

## API Reference

### GeminiAPI Class

```typescript
class GeminiAPI {
  constructor(options: { apiKey: string })

  async *streamMessage(
    messages: Message[],
    settings: ChatSettings,
    customSystemPrompt?: string
  ): AsyncGenerator<StreamChunk>

  async sendMessage(
    messages: Message[],
    settings: ChatSettings,
    customSystemPrompt?: string
  ): Promise<{ content: string; thinking?: string }>
}
```

### ChatSettings Interface

```typescript
interface ChatSettings {
  model: string;
  maxTokens: number;
  temperature: number;
  extendedThinking?: boolean;
  webSearch?: boolean;
  usePromptCaching?: boolean;
  thinkingBudget?: number;
}
```

### Message Interface

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Model Pricing](https://ai.google.dev/pricing)
- [API Limits](https://ai.google.dev/docs/quota)
- [Example Scripts](../examples/)

## Support

For issues specific to Gemini integration:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [examples/](../examples/)
3. Consult [Google AI documentation](https://ai.google.dev/docs)

For general app issues, see the main [README](../README.md).
