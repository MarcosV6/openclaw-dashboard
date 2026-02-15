'use client';

import React, { useState, useEffect } from 'react';

interface ResearchFile {
  name: string;
  title: string;
  date: string;
  size: number;
  modified: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function renderMarkdown(text: string): string {
  return text
    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/30 dark:bg-black/30 rounded-lg p-4 my-3 overflow-x-auto text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
      const tag = 'td';
      const row = cells.map(c => `<${tag} class="border border-white/10 dark:border-white/10 border-gray-200 px-3 py-2 text-sm">${c.trim()}</${tag}>`).join('');
      return `<tr>${row}</tr>`;
    })
    // Wrap table rows
    .replace(/((<tr>.*<\/tr>\s*)+)/g, '<table class="w-full border-collapse my-4">$1</table>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-800 dark:text-white/90 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-800 dark:text-white mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-white/70">$1</li>')
    .replace(/((<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="my-2 space-y-1">$1</ul>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 dark:text-white/70">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-purple-400 hover:text-purple-300 underline">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-white/10 dark:border-white/10 border-gray-200 my-4" />')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-gray-700 dark:text-white/70 mb-3">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br/>');
}

export default function ResearchPage() {
  const [files, setFiles] = useState<ResearchFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ResearchFile | null>(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResearchFile | null>(null);

  const fetchFiles = () => {
    fetch('/api/research')
      .then(r => r.json())
      .then(data => { setFiles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFiles(); }, []);

  const openFile = async (file: ResearchFile) => {
    setSelectedFile(file);
    setContentLoading(true);
    try {
      const res = await fetch(`/api/research?file=${encodeURIComponent(file.name)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch {
      setContent('Failed to load file');
    }
    setContentLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch('/api/research', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deleteTarget.name }),
    });
    setFiles(prev => prev.filter(f => f.name !== deleteTarget.name));
    if (selectedFile?.name === deleteTarget.name) {
      setSelectedFile(null);
      setContent('');
    }
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/10 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Research</h1>
          <p className="text-gray-500 dark:text-white/60 text-sm">
            {files.length} {files.length === 1 ? 'report' : 'reports'} from your agent
          </p>
        </div>
        {selectedFile && (
          <button
            onClick={() => { setSelectedFile(null); setContent(''); }}
            className="glass-card px-4 py-2 text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Back to list
          </button>
        )}
      </div>

      {/* File list */}
      {!selectedFile ? (
        <>
          {files.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-30">
                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-white/40 mb-2">No research yet</h3>
              <p className="text-gray-400 dark:text-white/30 text-sm max-w-md mx-auto">
                When your agent completes research tasks from the task board, the results will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="glass-card p-5 hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => openFile(file)}
                      className="flex-1 text-left"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{file.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-white/40">
                        <span>{formatDate(file.modified)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-white/20"></span>
                        <span>{formatSize(file.size)}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-white/30 hover:text-red-400 transition-all p-2"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* File content view */
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedFile.title}</h2>
              <p className="text-sm text-gray-500 dark:text-white/40 mt-1">{formatDate(selectedFile.modified)}</p>
            </div>
            <button
              onClick={() => setDeleteTarget(selectedFile)}
              className="text-gray-400 dark:text-white/30 hover:text-red-400 transition-colors p-2"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {contentLoading ? (
            <div className="animate-pulse h-64 bg-white/10 rounded"></div>
          ) : (
            <div className="glass-card p-6 lg:p-8">
              <div
                className="prose-custom leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-sm border border-[var(--card-border)]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Research</h3>
            <p className="text-gray-600 dark:text-white/60 text-sm mb-6">
              Delete &ldquo;{deleteTarget.title}&rdquo;? This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-gray-700 dark:text-white/70 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
