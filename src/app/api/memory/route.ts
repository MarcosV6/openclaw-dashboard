import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw/workspace');

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  category: string;
}

function scanMarkdownFiles(dir: string, category: string): MemoryFile[] {
  const results: MemoryFile[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && entry.endsWith('.md')) {
      results.push({
        name: entry,
        path: fullPath,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        category,
      });
    }
  }

  return results.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    // If file param is passed, return its contents
    if (file) {
      const safePath = path.resolve(file);
      // Security: only allow reading within the workspace
      if (!safePath.startsWith(path.resolve(WORKSPACE))) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (!fs.existsSync(safePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const content = fs.readFileSync(safePath, 'utf8');
      return NextResponse.json({ name: path.basename(safePath), content });
    }

    // Otherwise list all memory/doc files
    const files: MemoryFile[] = [
      ...scanMarkdownFiles(WORKSPACE, 'workspace'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'memory'), 'memory'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'docs'), 'docs'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'personal'), 'personal'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'business'), 'business'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'coding'), 'coding'),
      ...scanMarkdownFiles(path.join(WORKSPACE, 'reports'), 'reports'),
    ];

    return NextResponse.json(files);
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
