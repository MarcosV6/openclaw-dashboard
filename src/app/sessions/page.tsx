'use client';

import React, { useState, useEffect } from 'react';

interface SessionSummary {
  filename: string;
  size: number;
  modified: string;
  messageCount: number;
  preview: string;
}

interface SessionMessage {
  role?: string;
  type?: string;
  content?: string;
  message?: string;
  model?: string;
  timestamp?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openSession = async (filename: string) => {
    setSelected(filename);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(filename)}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white/10 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Session Logs</h1>
          <p className="text-white/60 text-sm">{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</p>
        </div>
        {selected && (
          <button onClick={() => { setSelected(null); setMessages([]); }} className="glass-card px-4 py-2 text-white/80 hover:text-white transition-colors">
            Back to list
          </button>
        )}
      </div>

      {!selected ? (
        <div className="space-y-3">
          {sessions.map((s) => (
            <button
              key={s.filename}
              onClick={() => openSession(s.filename)}
              className="glass-card p-4 w-full text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-mono text-sm">{s.filename}</span>
                <span className="text-white/40 text-xs">{formatDate(s.modified)}</span>
              </div>
              <p className="text-white/60 text-sm truncate">{s.preview}</p>
              <div className="flex gap-4 mt-2 text-white/40 text-xs">
                <span>{s.messageCount} messages</span>
                <span>{formatBytes(s.size)}</span>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12 text-white/40">No session logs found</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-mono text-white/80 mb-4">{selected}</h2>
          {detailLoading ? (
            <div className="animate-pulse space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/10 rounded"></div>)}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const role = msg.role || msg.type || 'system';
                const content = msg.content || msg.message || JSON.stringify(msg);
                const isUser = role === 'user' || role === 'human';
                const isSystem = role === 'system' || role === 'event';

                return (
                  <div
                    key={i}
                    className={`glass-card p-3 ${
                      isUser ? 'border-l-4 border-l-blue-500 ml-0 mr-12' :
                      isSystem ? 'border-l-4 border-l-gray-500 opacity-60' :
                      'border-l-4 border-l-purple-500 ml-12 mr-0'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium uppercase ${
                        isUser ? 'text-blue-400' : isSystem ? 'text-gray-400' : 'text-purple-400'
                      }`}>{role}</span>
                      {msg.model && <span className="text-white/30 text-xs">{msg.model}</span>}
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap break-words">
                      {typeof content === 'string' ? content.slice(0, 2000) : JSON.stringify(content).slice(0, 2000)}
                      {typeof content === 'string' && content.length > 2000 && <span className="text-white/40">... (truncated)</span>}
                    </p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center py-12 text-white/40">No messages in this session</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
