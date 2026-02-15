import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';

export const dynamic = 'force-dynamic';

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS || path.join(os.homedir(), '.openclaw/agents/main/sessions');

interface SessionSummary {
  filename: string;
  size: number;
  modified: string;
  messageCount: number;
  preview: string;
}

export async function GET() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(SESSIONS_DIR, a));
        const statB = fs.statSync(path.join(SESSIONS_DIR, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

    const sessions: SessionSummary[] = [];

    for (const file of files) {
      const filePath = path.join(SESSIONS_DIR, file);
      const stat = fs.statSync(filePath);

      // Read first few lines for preview
      let messageCount = 0;
      let preview = '';

      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        messageCount++;
        if (!preview && messageCount <= 3) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.content || parsed.message) {
              const content = parsed.content || parsed.message;
              preview = typeof content === 'string' ? content.slice(0, 200) : JSON.stringify(content).slice(0, 200);
            }
          } catch {
            // skip malformed lines
          }
        }
        // Count all lines but stop reading content after 3
        if (messageCount > 3 && preview) {
          // Continue counting
        }
      }

      sessions.push({
        filename: file,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        messageCount,
        preview: preview || '(no preview available)',
      });
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
