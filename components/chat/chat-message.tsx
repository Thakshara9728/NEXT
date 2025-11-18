'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bot, User, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
        {/* Show thinking process if available (before the main message) */}
        {!isUser && message.thinking && (
          <Card className="bg-muted/30 border-dashed border-primary/30">
            <CardContent className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between h-auto py-2 px-3 mb-2"
                onClick={() => setShowThinking(!showThinking)}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Extended Thinking {showThinking ? '(expanded)' : '(collapsed)'}
                  </span>
                </div>
                {showThinking ? (
                  <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary" />
                )}
              </Button>

              {showThinking && (
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="p-3 bg-background/50 rounded-md border border-primary/10">
                    <div className="prose prose-xs dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.thinking}</ReactMarkdown>
                    </div>
                  </div>
                  <p className="text-[10px] italic">
                    This shows Claude's internal reasoning process. The actual response is below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main message content */}
        <Card
          className={cn(
            'shadow-md',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card'
          )}
        >
          <CardContent className="p-4">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.model && (
            <>
              <span>•</span>
              <span className="capitalize">{message.model.replace('claude-', '').replace('-', ' ')}</span>
            </>
          )}
          {!isUser && message.thinking && (
            <>
              <span>•</span>
              <Brain className="w-3 h-3" />
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
