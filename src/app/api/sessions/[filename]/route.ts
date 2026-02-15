import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS || path.join(os.homedir(), '.openclaw/agents/main/sessions');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename);
    if (!safeName.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const filePath = path.join(SESSIONS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages: any[] = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      try {
        messages.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }

    return NextResponse.json({
      filename: safeName,
      messageCount: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json({ error: 'Failed to read session' }, { status: 500 });
  }
}
