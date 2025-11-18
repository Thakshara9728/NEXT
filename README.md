# Claude YouTube Script Generator

A modern, production-ready web application built with Next.js 15 and Claude API featuring **real-time streaming**, **extended thinking**, and **prompt caching**. This app showcases cutting-edge 2025 web development practices and Claude's most advanced AI capabilities.

## ✨ Features

### Core AI Features
- **🤖 Multi-AI Provider Support**: Choose between Claude (Anthropic) and Gemini (Google)
  - **Claude**: Sonnet 3.7 and 4.5 models
  - **Gemini**: 3.0 Pro, 2.0 Flash, and 2.0 Thinking models
- **🧠 Extended Thinking**: Enable deeper reasoning with configurable thinking budgets (1K-32K tokens)
- **📡 Real-time Streaming**: Server-Sent Events (SSE) for incremental response delivery
- **💭 Thinking Visualization**: Collapsible thinking blocks showing AI's reasoning process
- **🌐 Native Web Search**: Built-in web search for both Claude and Gemini with automatic source citations
- **📚 Source Citations**: Clickable references to web sources with excerpts
- **⚡ Prompt Caching**: Reduce costs up to 90% and improve latency (Claude)
- **🔐 Signature Verification**: Automatic thinking block signature handling

### UI/UX Features
- **🎨 Modern Clean Design**: Built with Tailwind CSS and shadcn/ui components
- **🌓 Responsive Layout**: Works seamlessly on desktop and mobile
- **💬 Chat Interface**: Intuitive conversation flow with message history
- **⚙️ Customizable Settings**: Fine-tune all model parameters
- **📝 Markdown Support**: Rich text formatting in responses
- **🎯 Thinking Controls**: Expandable/collapsible thinking blocks

### Technical Features
- **⚛️ React 19 & Next.js 15**: Latest versions with App Router
- **📘 TypeScript (Strict Mode)**: Full type safety
- **🔄 Zustand State Management**: Lightweight and efficient
- **🎯 Server Components**: Optimal performance
- **🚀 Modern Build System**: Turbopack for fast development
- **🔥 Proper Event Handling**: Full SSE event type support

## 🏗️ Architecture

This application follows 2025 best practices:

- **Feature-based folder structure** for better organization
- **Strict TypeScript** configuration for type safety
- **Server-Side Rendering** with streaming support
- **Atomic design principles** with shadcn/ui components
- **Zustand** for minimal, performant state management
- **API Routes** with proper SSE implementation

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API Key ([Get one here](https://console.anthropic.com/))

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies (use --legacy-peer-deps for React 19 RC compatibility)
npm install --legacy-peer-deps
```

**Note**: We use `--legacy-peer-deps` because Next.js 15.0.3 requires React 19 RC, which some dependencies haven't explicitly declared support for yet. This is safe and expected when using RC versions.

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Claude API key (for Claude models)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Gemini API key (for Google Gemini models) - Optional
GEMINI_API_KEY=your_gemini_key_here
```

**Multi-AI Provider Support**: The app now supports both Claude and Gemini!
- **Claude**: Advanced reasoning, extended thinking, prompt caching
- **Gemini**: High rate limits, Google Search, cost-effective

See [Gemini Integration Guide](docs/GEMINI_INTEGRATION.md) for details.

**Note**: Web search is built into both APIs - no separate API key needed!

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # SSE streaming endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main chat interface
│   └── globals.css               # Global styles
├── components/
│   ├── chat/
│   │   ├── chat-message.tsx      # Message with thinking display
│   │   ├── chat-input.tsx        # Input component
│   │   └── settings-panel.tsx    # Settings with thinking budget
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── claude-api.ts             # Claude API with full streaming
│   ├── web-search.ts             # Web search functionality
│   ├── store.ts                  # Zustand state management
│   └── utils.ts                  # Utility functions
├── types/
│   └── index.ts                  # TypeScript type definitions
└── package.json
```

## 🎯 Usage

### Basic Chat

1. Type your message in the input field at the bottom
2. Press Enter or click Send
3. Watch the response stream in real-time

### Extended Thinking

Enable in settings for Claude to show its reasoning process:
- Great for complex analysis, math, coding, and strategic thinking
- Configurable thinking budget (1,024 - 32,768 tokens)
- Auto mode uses 25% of max tokens
- Thinking blocks are collapsible for better UX
- Higher budgets = more thorough reasoning (with diminishing returns)

**Best Practices:**
- Start with minimum budget (1,024 tokens) for simple tasks
- Use 4K-8K for moderate complexity
- Use 16K-32K for highly complex reasoning tasks
- Monitor thinking usage to optimize costs

### Web Search

Enable to include current web information:
- Claude automatically searches when needed
- Sources are cited with clickable links
- Shows excerpts from cited pages
- No additional API key required
- Must be enabled in Anthropic Console

### Model Selection

Choose between models:
- **Claude Sonnet 4.5**: Latest, most capable model with summarized thinking
- **Claude Sonnet 3.7**: Fast and efficient, returns full thinking output

## 🔧 Configuration

### Settings Panel

Access via the sidebar (right side on desktop, menu button on mobile):

- **Model**: Choose Claude Sonnet 3.7 or 4.5
- **Extended Thinking**: Toggle deeper reasoning
- **Thinking Budget**: Configure tokens allocated for reasoning (shown when extended thinking is enabled)
- **Web Search**: Enable Claude's native web search with citations
- **Prompt Caching**: Reduce costs (recommended)
- **Temperature**: Control creativity (0-2)
- **Max Tokens**: Set response length

**Note**: Web search max uses defaults to 5 searches per request and can be configured in settings.

## 🌐 API Integration

### Claude API Features

#### Real-time Streaming

Uses Server-Sent Events (SSE) for optimal performance:
- Incremental content delivery
- Thinking deltas as they're generated
- Signature verification
- Error handling with graceful recovery

Event types handled:
- `message_start` - New message initialization
- `content_block_start` - Content block beginning
- `content_block_delta` - Incremental updates (text, thinking, signature)
- `content_block_stop` - Content block completion
- `message_delta` - Message-level updates
- `message_stop` - Stream completion
- `ping` - Keep-alive events
- `error` - Error events

#### Extended Thinking

Special mode for complex reasoning:
- **Thinking Budget**: Configurable from 1,024 to 32,768+ tokens
- **Auto Mode**: Defaults to 25% of max_tokens
- **Minimum**: 1,024 tokens
- **Signature Handling**: Automatic verification of thinking blocks
- **Summarization** (Claude 4 models): Thinking is summarized but you're billed for full tokens
- **Full Output** (Claude 3.7): Returns complete thinking process

**Thinking Budget Guidelines:**
- Simple tasks: 1,024 - 2,048 tokens
- Moderate complexity: 4,096 - 8,192 tokens
- Complex analysis: 16,384+ tokens
- Critical tasks: Test different budgets to find optimal balance

#### Prompt Caching

Automatically caches system prompts to:
- Reduce API costs (up to 90% cheaper on cached content)
- Decrease latency
- Improve response times
- Works with extended thinking

**Cache Behavior:**
- System prompts are cached persistently
- Thinking blocks from previous turns are removed from context
- Changing thinking parameters invalidates message cache
- Tools and system prompts remain cached despite thinking changes

### Web Search Integration

The app uses **Claude's native web search tool** (no separate API key required):

**Features:**
- Built directly into Claude API
- Automatic citation of sources
- Real-time web content access
- Claude decides when to search based on context
- Up to 5 searches per request (configurable)
- Costs: **$10 per 1,000 searches** + standard token costs

**Setup:**
1. Enable in Console: Your organization admin must enable web search in [Anthropic Console](https://console.anthropic.com/settings/privacy)
2. Toggle "Web Search" in the app's settings panel
3. Claude automatically searches when needed

**How it works:**
- Claude determines when web search is needed
- Searches are executed automatically
- Sources are cited inline with responses
- Citations show:
  - Source title and URL
  - Relevant excerpt from the page
  - Clickable links to original sources

**Supported Models:**
- Claude Sonnet 4.5 ✅
- Claude Sonnet 3.7 ✅
- Claude Haiku 4.5 ✅
- Claude Opus 4.1 ✅

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Other Platforms

Build the production version:

```bash
npm run build
npm start
```

## 📊 Understanding Thinking

### What is Extended Thinking?

Extended thinking allows Claude to engage in deeper reasoning before responding:

1. **Thinking Phase**: Claude reasons through the problem step-by-step
2. **Response Phase**: Claude provides the final answer based on reasoning

### Thinking Visualization

The UI shows thinking blocks:
- **Collapsed by default** for clean interface
- **Click to expand** to see Claude's reasoning
- **Brain icon** indicates thinking is present
- **Formatted as markdown** for readability

### Pricing Considerations

When using extended thinking:
- **Billed for full thinking tokens** (not summary in Claude 4 models)
- **Previous thinking blocks** don't count toward context window
- **Current turn thinking** counts toward max_tokens limit
- Monitor usage to optimize costs

## 🔮 Future Enhancements

This app is designed to be extended with:
- 🎬 YouTube script templates
- 🎙️ TTS (Text-to-Speech) integration
- 📊 Analytics and usage tracking
- 💾 Conversation persistence
- 👥 Multi-user support
- 🎨 Theme customization
- 📤 Export functionality
- 🔧 Tool use integration

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest with Server Components
- **TypeScript 5**: Strict type checking
- **Tailwind CSS 3**: Utility-first CSS
- **shadcn/ui**: High-quality React components
- **Lucide React**: Beautiful icon set

### State Management
- **Zustand**: Lightweight state management

### Backend
- **Next.js API Routes**: Serverless functions with SSE
- **Anthropic SDK**: Official Claude API client
- **Streaming**: Real-time Server-Sent Events

### Development
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Turbopack**: Fast bundler

## 📖 Best Practices Implemented

Following 2025 modern web development standards:

1. **React Server Components** for optimal performance
2. **Server-Sent Events** for real-time streaming
3. **TypeScript strict mode** for type safety
4. **Feature-based architecture** for scalability
5. **Atomic design** with shadcn/ui
6. **Responsive design** for all devices
7. **Accessibility** considerations
8. **Error handling** throughout the app
9. **Loading states** for better feedback
10. **Clean code** principles

## 🔬 Advanced Features

### Streaming Implementation

The app uses a custom streaming implementation:

```typescript
// Server-side streaming with SSE
for await (const chunk of claudeAPI.streamMessage(...)) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
}
```

### Extended Thinking Integration

```typescript
// Configure thinking budget
thinking: {
  type: 'enabled',
  budget_tokens: thinkingBudget, // 1024 - 32768+
}
```

### Event Handling

Full support for all SSE event types:
- Content deltas
- Thinking deltas
- Signature deltas
- Error events
- Ping events

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude API
- [Vercel](https://vercel.com/) for Next.js
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- Claude API documentation for streaming and extended thinking specifications

## 📚 Resources

- [Claude API Documentation](https://docs.anthropic.com/)
- [Extended Thinking Guide](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [Web Search Tool](https://docs.anthropic.com/en/docs/build-with-claude/web-search)
- [Streaming Messages](https://docs.anthropic.com/en/docs/build-with-claude/streaming)
- [Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ using Claude AI and modern web technologies. Implements official streaming and extended thinking patterns from Anthropic's documentation.
