'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GatewayClient, getGatewayClient, ChatMessage } from '../../lib/websocket';
import ChatMessageComponent from '../components/ChatMessage';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<GatewayClient | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize gateway client
  useEffect(() => {
    const gatewayClient = getGatewayClient();
    setClient(gatewayClient);

    // Subscribe to completed messages
    const unsubscribeMessage = gatewayClient.onMessage((message) => {
      setStreaming(false);
      setStreamText('');
      setMessages(prev => [...prev, message]);
    });

    // Subscribe to state changes
    const unsubscribeState = gatewayClient.onStateChange((state) => {
      setConnected(state.connected);
      setConnecting(state.connecting);
      setError(state.error);
    });

    // Subscribe to chat stream events
    const unsubscribeChatEvent = gatewayClient.onChatEvent((event) => {
      if (event.state === 'delta' && event.stream) {
        setStreaming(true);
        setStreamText(event.stream);
      } else if (event.state === 'final' || event.state === 'aborted') {
        setStreaming(false);
        setStreamText('');
      } else if (event.state === 'error') {
        setStreaming(false);
        setStreamText('');
      }
    });

    setMessages([{
      id: 'welcome',
      role: 'system',
      content: 'Connected to OpenClaw Gateway',
      timestamp: new Date().toISOString(),
    }]);

    return () => {
      unsubscribeMessage();
      unsubscribeState();
      unsubscribeChatEvent();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // Connect once on mount and load history
  const connectAttempted = useRef(false);
  useEffect(() => {
    if (client && !connectAttempted.current) {
      connectAttempted.current = true;
      client.connect()
        .then(async () => {
          const history = await client.loadHistory('main', 50);
          if (history.length > 0) {
            setMessages(prev => {
              const welcome = prev.filter(m => m.id === 'welcome');
              return [...welcome, ...history];
            });
          }
        })
        .catch(err => {
          setError(err.message);
          connectAttempted.current = false; // allow retry on manual reconnect
        });
    }
  }, [client]);

  const sendMessage = async () => {
    if (!input.trim() || !client || !connected) return;

    const content = input.trim();
    setInput('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setStreaming(true);

    const success = client.send(content);
    if (!success) {
      setError('Failed to send message');
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reconnect = () => {
    if (client) {
      connectAttempted.current = true;
      setError(null);
      client.connect().catch(err => {
        setError(err.message);
        connectAttempted.current = false;
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      {/* Header - always visible */}
      <div className="flex-shrink-0 flex justify-between items-center p-3 sm:p-4 border-b border-white/10">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">OpenClaw Chat</h1>
          <p className="text-white/60 text-xs sm:text-sm">Direct gateway connection</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 ml-2">
          {connecting && (
            <span className="text-amber-400 text-xs sm:text-sm flex items-center gap-1">
              <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Connecting...</span>
            </span>
          )}

          {connected && (
            <span className="text-green-400 text-xs sm:text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
              <span className="hidden sm:inline">Connected</span>
            </span>
          )}

          {error && (
            <span className="text-red-400 text-xs sm:text-sm flex items-center gap-1 max-w-[150px] sm:max-w-none">
              <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
              <span className="truncate">{error}</span>
            </span>
          )}

          {!connected && !connecting && !error && (
            <button onClick={reconnect} className="text-white/60 hover:text-white text-xs sm:text-sm">
              <span className="hidden sm:inline">Disconnected (click to reconnect)</span>
              <span className="sm:hidden">Reconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages - scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2">
        {messages.map((message) => (
          <ChatMessageComponent
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            model={message.model}
          />
        ))}

        {/* Streaming response */}
        {streaming && (
          <div className="flex items-start gap-3">
            <div className="glass-card p-3 max-w-[85%] sm:max-w-[80%] overflow-hidden">
              {streamText ? (
                <p className="text-white/80 text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{streamText}</p>
              ) : (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  Agent is thinking...
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - always visible */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? "Type a message..." : "Connect to gateway to chat..."}
            disabled={!connected || streaming}
            className="flex-1 min-w-0 glass-card p-3 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !input.trim() || streaming}
            className="flex-shrink-0 glass-card px-3 sm:px-4 py-2 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
