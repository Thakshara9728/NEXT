'use client';

import React from 'react';
import { Message } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bot, User, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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

        {/* Show thinking process if available */}
        {message.thinking && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Extended Thinking:</p>
                  <p className="whitespace-pre-wrap">{message.thinking}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.model && (
            <>
              <span>•</span>
              <span>{message.model}</span>
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
