# Claude YouTube Script Generator

A modern, clean web application built with Next.js 15 and Claude API for generating YouTube scripts and content. This app showcases cutting-edge 2025 web development practices and Claude's advanced AI capabilities.

## ✨ Features

### Core AI Features
- **🤖 Multiple Claude Models**: Support for Claude Sonnet 3.7 and 4.5
- **🧠 Extended Thinking**: Enable deeper reasoning and analysis for complex content
- **🌐 Web Search Integration**: Enhance responses with current web information
- **⚡ Prompt Caching**: Reduce costs and latency by caching system prompts
- **📡 Real-time Streaming**: See responses as they're generated

### UI/UX Features
- **🎨 Modern Clean Design**: Built with Tailwind CSS and shadcn/ui components
- **🌓 Responsive Layout**: Works seamlessly on desktop and mobile
- **💬 Chat Interface**: Intuitive conversation flow with message history
- **⚙️ Customizable Settings**: Fine-tune model parameters and features
- **📝 Markdown Support**: Rich text formatting in responses

### Technical Features
- **⚛️ React 19 & Next.js 15**: Latest stable versions with App Router
- **📘 TypeScript (Strict Mode)**: Full type safety throughout the application
- **🔄 Zustand State Management**: Lightweight and efficient state handling
- **🎯 Server Components**: Optimal performance with React Server Components
- **🚀 Modern Build System**: Turbopack for lightning-fast development

## 🏗️ Architecture

This application follows 2025 best practices:

- **Feature-based folder structure** for better organization
- **Strict TypeScript** configuration for type safety
- **Server-Side Rendering** with streaming support
- **Atomic design principles** with shadcn/ui components
- **Zustand** for minimal, performant state management
- **API Routes** for backend functionality

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API Key ([Get one here](https://console.anthropic.com/))

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required: Your Claude API key
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Web Search API key (Tavily, Brave, etc.)
WEB_SEARCH_API_KEY=your_search_api_key_here
```

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
│   │       └── route.ts          # Streaming API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main chat interface
│   └── globals.css               # Global styles
├── components/
│   ├── chat/
│   │   ├── chat-message.tsx      # Message component
│   │   ├── chat-input.tsx        # Input component
│   │   └── settings-panel.tsx    # Settings sidebar
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── claude-api.ts             # Claude API integration
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
- Great for complex analysis
- Helpful for understanding Claude's approach
- Uses additional tokens

### Web Search

Enable to include current web information:
- Automatically searches based on your query
- Adds context to Claude's responses
- Requires web search API configuration

### Model Selection

Choose between models:
- **Claude Sonnet 4.5**: Latest, most capable model
- **Claude Sonnet 3.7**: Fast and efficient for most tasks

## 🔧 Configuration

### Settings Panel

Access via the sidebar (right side on desktop, menu button on mobile):

- **Model**: Choose Claude Sonnet 3.7 or 4.5
- **Extended Thinking**: Toggle deeper reasoning
- **Web Search**: Enable web context
- **Prompt Caching**: Reduce costs (recommended)
- **Temperature**: Control creativity (0-2)
- **Max Tokens**: Set response length

## 🌐 API Integration

### Claude API Features

#### Prompt Caching
Automatically caches system prompts to:
- Reduce API costs (up to 90% cheaper)
- Decrease latency
- Improve response times

#### Streaming
Real-time response delivery:
- Better user experience
- Lower perceived latency
- Progressive content display

#### Extended Thinking
Special mode for:
- Complex analysis
- Step-by-step reasoning
- Detailed explanations

### Web Search Integration

The app supports various web search APIs (implement in `lib/web-search.ts`):
- [Tavily API](https://tavily.com/)
- [Brave Search API](https://brave.com/search/api/)
- Google Custom Search
- Bing Search API

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

## 🔮 Future Enhancements

This app is designed to be extended with:
- 🎬 YouTube script templates
- 🎙️ TTS (Text-to-Speech) integration
- 📊 Analytics and usage tracking
- 💾 Conversation persistence
- 👥 Multi-user support
- 🎨 Theme customization
- 📤 Export functionality

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with Server Components
- **TypeScript 5**: Strict type checking
- **Tailwind CSS 3**: Utility-first CSS
- **shadcn/ui**: High-quality React components
- **Lucide React**: Beautiful icon set

### State Management
- **Zustand**: Lightweight state management

### Backend
- **Next.js API Routes**: Serverless functions
- **Anthropic SDK**: Official Claude API client
- **Streaming**: Real-time Server-Sent Events

### Development
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Turbopack**: Fast bundler

## 📖 Best Practices Implemented

Following 2025 modern web development standards:

1. **React Server Components** for optimal performance
2. **Streaming** for better UX
3. **TypeScript strict mode** for type safety
4. **Feature-based architecture** for scalability
5. **Atomic design** with shadcn/ui
6. **Responsive design** for all devices
7. **Accessibility** considerations
8. **Error handling** throughout the app
9. **Loading states** for better feedback
10. **Clean code** principles

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

---

Built with ❤️ using Claude AI and modern web technologies.
