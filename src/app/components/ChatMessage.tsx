'use client';

import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
}

export default function ChatMessage({ role, content, timestamp, model }: ChatMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/5 text-white/40 text-xs px-3 py-1 rounded-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[80%] min-w-0 ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs sm:text-sm ${
            isUser
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-green-500/20 text-green-400'
          }`}>
            {isUser ? '👤' : '🤖'}
          </div>
          <div className="text-xs text-white/40 truncate">
            {isUser ? 'You' : model || 'Assistant'} • {formatTime(timestamp)}
          </div>
        </div>

        {/* Message bubble */}
        <div className={`glass-card p-3 overflow-hidden ${
          isUser
            ? 'bg-purple-500/10 border-purple-500/30'
            : 'bg-green-500/10 border-green-500/30'
        } ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          <p className="text-white whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{content}</p>
        </div>
      </div>
    </div>
  );
}