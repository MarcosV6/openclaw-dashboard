'use client';

import React, { useState, useEffect } from 'react';

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  category: string;
}

const categoryColors: Record<string, string> = {
  workspace: 'bg-purple-500/20 text-purple-400',
  memory: 'bg-blue-500/20 text-blue-400',
  docs: 'bg-green-500/20 text-green-400',
  personal: 'bg-pink-500/20 text-pink-400',
  business: 'bg-amber-500/20 text-amber-400',
  coding: 'bg-cyan-500/20 text-cyan-400',
  fitness: 'bg-red-500/20 text-red-400',
  reports: 'bg-teal-500/20 text-teal-400',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => { setFiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openFile = async (file: MemoryFile) => {
    setSelectedFile(file);
    setContentLoading(true);
    try {
      const res = await fetch(`/api/memory?file=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch {
      setContent('Failed to load file');
    }
    setContentLoading(false);
  };

  const categories = ['all', ...new Set(files.map(f => f.category))];
  const filtered = filter === 'all' ? files : files.filter(f => f.category === filter);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/4"></div>
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/10 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Memory & Notes</h1>
          <p className="text-white/60 text-sm">{files.length} files across {categories.length - 1} categories</p>
        </div>
        {selectedFile && (
          <button onClick={() => { setSelectedFile(null); setContent(''); }} className="glass-card px-4 py-2 text-white/80 hover:text-white transition-colors">
            Back to list
          </button>
        )}
      </div>

      {!selectedFile ? (
        <>
          {/* Category filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === cat ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((file) => (
              <button
                key={file.path}
                onClick={() => openFile(file)}
                className="glass-card p-4 w-full text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[file.category] || 'bg-white/10 text-white/60'}`}>
                    {file.category}
                  </span>
                  <span className="text-white font-medium">{file.name}</span>
                  <span className="ml-auto text-white/40 text-xs">{formatDate(file.modified)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-white/40">No files in this category</div>
            )}
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[selectedFile.category] || 'bg-white/10 text-white/60'}`}>
              {selectedFile.category}
            </span>
            <h2 className="text-lg font-bold text-white">{selectedFile.name}</h2>
          </div>
          {contentLoading ? (
            <div className="animate-pulse h-64 bg-white/10 rounded"></div>
          ) : (
            <div className="glass-card p-6">
              <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
