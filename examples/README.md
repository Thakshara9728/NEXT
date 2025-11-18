# Gemini YouTube Script Generator Examples

This directory contains standalone examples for using the Gemini 3.0 API to generate YouTube scripts.

## Prerequisites

1. Install dependencies:
```bash
npm install @google/genai mime
npm install -D @types/node
```

2. Set your Gemini API key:
```bash
export GEMINI_API_KEY=your_gemini_api_key_here
```

You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Running the Example

### TypeScript (with ts-node)
```bash
npx ts-node examples/gemini-youtube-script-generator.ts
```

### Compile and run
```bash
npx tsc examples/gemini-youtube-script-generator.ts
node examples/gemini-youtube-script-generator.js
```

## Available Models

- **gemini-3-pro-preview** - Latest Gemini 3.0 model (recommended)
- **gemini-2.0-flash-exp** - Fast and efficient Gemini 2.0
- **gemini-2.0-flash-thinking-exp-01-21** - Gemini 2.0 with extended thinking

## Features

The example demonstrates:

- ✅ Streaming responses from Gemini
- ✅ Google Search tool integration
- ✅ Extended thinking configuration
- ✅ Full system prompt for YouTube script generation
- ✅ Saving generated scripts to files

## Customization

Edit the `userInput` variable in the script to change the topic:

```typescript
const userInput = `Generate a YouTube script about [YOUR TOPIC]`;
```

You can also modify:
- Model selection
- Thinking level (LOW, MEDIUM, HIGH)
- System instruction
- Tool configuration

## Integration with the Main App

The main application in `/app/api/scripts/generate-gemini/route.ts` uses the same approach but with:
- Server-Sent Events (SSE) for real-time streaming
- Database integration for saving scripts
- Multi-section generation with conversation history
- Rate limiting and retry logic

## Rate Limits

Gemini API rate limits (Free tier):
- **Gemini 3.0 Pro**: 1000 requests/min, 4M tokens/min
- **Gemini 2.0 Flash**: 2000 requests/min, 4M tokens/min
- **Gemini 2.0 Thinking**: 50 requests/min, 32K tokens/min

## Troubleshooting

**Error: GEMINI_API_KEY not set**
- Make sure you've set the environment variable
- Check your API key is valid at Google AI Studio

**Rate limit errors**
- Wait a few seconds between requests
- Consider upgrading your API tier

**Module not found errors**
- Run `npm install` to install dependencies
- Ensure you're in the correct directory

## License

MIT
