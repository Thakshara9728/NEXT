'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { SettingsPanel } from '@/components/chat/settings-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Menu, X, Youtube } from 'lucide-react';

export default function Home() {
  const { messages, settings, isStreaming, addMessage, updateLastMessage, clearMessages, setStreaming } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return;

    setError(null);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
      model: settings.model,
    };

    addMessage(userMessage);

    // Create assistant message placeholder
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
      thinking: '',
      timestamp: new Date(),
      model: settings.model,
    };

    addMessage(assistantMessage);
    setStreaming(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          settings,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let currentContent = '';
      let currentThinking = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }

              if (parsed.type === 'thinking') {
                currentThinking = parsed.content || '';
                updateLastMessage(currentContent, currentThinking);
              } else if (parsed.type === 'content') {
                currentContent = parsed.content || '';
                updateLastMessage(currentContent, currentThinking);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error:', error);
        setError(error.message || 'An error occurred');
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
      setError(null);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Claude YouTube Generator</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered content creation with {settings.model === 'claude-sonnet-4-5' ? 'Sonnet 4.5' : 'Sonnet 3.7'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearChat}
              disabled={messages.length === 0 || isStreaming}
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="lg:hidden"
            >
              {showSettings ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Card className="p-8 text-center max-w-md">
                  <Youtube className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-bold mb-2">Welcome to Claude YouTube Generator</h2>
                  <p className="text-muted-foreground mb-4">
                    Start creating amazing YouTube scripts and content with the power of Claude AI.
                  </p>
                  <div className="text-left space-y-2 text-sm">
                    <p className="font-semibold">Features:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Extended thinking for deeper analysis</li>
                      <li>Web search integration</li>
                      <li>Prompt caching for efficiency</li>
                      <li>Real-time streaming responses</li>
                      <li>Multiple Claude models</li>
                    </ul>
                  </div>
                </Card>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}

            {error && (
              <Card className="p-4 bg-destructive/10 border-destructive">
                <p className="text-sm text-destructive font-medium">Error: {error}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isStreaming}
        />
      </div>

      {/* Settings Sidebar */}
      <aside
        className={`
          w-80 border-l bg-card overflow-y-auto p-4
          ${showSettings ? 'block' : 'hidden'} lg:block
        `}
      >
        <SettingsPanel />
      </aside>
    </div>
  );
}
