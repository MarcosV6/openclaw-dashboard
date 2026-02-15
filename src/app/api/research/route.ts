import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const RESEARCH_DIR = path.join(
  process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw/workspace'),
  'research'
);

interface ResearchFile {
  name: string;
  title: string;
  date: string;
  size: number;
  modified: string;
}

function parseTitle(filename: string, content: string): string {
  // Try to extract title from first markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1];
  // Fall back to filename without date prefix and extension
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
}

function parseDate(filename: string, modified: string): string {
  // Try to extract date from filename (YYYY-MM-DD prefix)
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return dateMatch[1];
  return modified.split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!fs.existsSync(RESEARCH_DIR)) {
      fs.mkdirSync(RESEARCH_DIR, { recursive: true });
    }

    // Return file contents
    if (file) {
      const safePath = path.resolve(path.join(RESEARCH_DIR, path.basename(file)));
      if (!safePath.startsWith(path.resolve(RESEARCH_DIR))) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (!fs.existsSync(safePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const content = fs.readFileSync(safePath, 'utf8');
      return NextResponse.json({ name: path.basename(safePath), content });
    }

    // List all research files
    const entries = fs.readdirSync(RESEARCH_DIR);
    const files: ResearchFile[] = entries
      .filter(e => e.endsWith('.md'))
      .map(entry => {
        const fullPath = path.join(RESEARCH_DIR, entry);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        return {
          name: entry,
          title: parseTitle(entry, content),
          date: parseDate(entry, stat.mtime.toISOString()),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json(files);
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { name } = await request.json();
    const safePath = path.resolve(path.join(RESEARCH_DIR, path.basename(name)));
    if (!safePath.startsWith(path.resolve(RESEARCH_DIR))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Research DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
