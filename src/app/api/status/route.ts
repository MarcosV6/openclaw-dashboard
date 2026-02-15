import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    gateway: { status: 'unknown', port: 18789 },
    heartbeat: { status: 'unknown', lastRun: null },
    database: { status: 'unknown', records: 0 },
    cron: { jobs: [] },
  };

  // Check gateway
  try {
    const net = await import('net');
    status.gateway.status = await new Promise<string>((resolve) => {
      const socket = new net.default.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => { socket.destroy(); resolve('online'); });
      socket.on('timeout', () => { socket.destroy(); resolve('offline'); });
      socket.on('error', () => { socket.destroy(); resolve('offline'); });
      socket.connect(18789, '127.0.0.1');
    });
  } catch {
    status.gateway.status = 'offline';
  }

  // Check database
  try {
    const db = await connectDB();
    const row = await db.get('SELECT COUNT(*) as count, MAX(timestamp) as latest FROM usage');
    status.database.status = 'healthy';
    status.database.records = row?.count || 0;
    status.database.latestRecord = row?.latest ? new Date(row.latest * 1000).toISOString() : null;

    // Get latest health check
    const healthCheck = await db.get('SELECT * FROM health_checks ORDER BY check_time DESC LIMIT 1');
    if (healthCheck) {
      status.database.lastHealthCheck = healthCheck;
    }
    await db.close();
  } catch {
    status.database.status = 'error';
  }

  // Check heartbeat (reads the system cron heartbeat log)
  try {
    const heartbeatLog = path.join(process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw/workspace'), 'data', 'heartbeat.log');
    if (fs.existsSync(heartbeatLog)) {
      const stat = fs.statSync(heartbeatLog);
      const mtime = stat.mtime;
      const ageMs = Date.now() - mtime.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      status.heartbeat.lastRun = mtime.toISOString();
      status.heartbeat.ageHours = Math.round(ageHours * 10) / 10;
      // System cron runs every 2h, so healthy if < 3h, stale if < 7h
      status.heartbeat.status = ageHours < 3 ? 'healthy' : ageHours < 7 ? 'stale' : 'dead';

      // Read last line for latest status
      const content = fs.readFileSync(heartbeatLog, 'utf8').trim();
      const lastLine = content.split('\n').pop() || '';
      status.heartbeat.lastEntry = lastLine;
    } else {
      status.heartbeat.status = 'no_data';
    }
  } catch {
    status.heartbeat.status = 'error';
  }

  // Check cron jobs
  try {
    const cronPath = path.join(process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw'), 'cron', 'jobs.json');
    if (fs.existsSync(cronPath)) {
      const cronData = JSON.parse(fs.readFileSync(cronPath, 'utf8'));
      status.cron.jobs = cronData.jobs.map((job: any) => ({
        name: job.name,
        enabled: job.enabled,
        schedule: job.schedule.expr,
        lastStatus: job.state?.lastStatus || 'never_run',
        lastError: job.state?.lastError || null,
        consecutiveErrors: job.state?.consecutiveErrors || 0,
        nextRunAt: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
      }));
    }
  } catch {
    status.cron.jobs = [];
  }

  return NextResponse.json(status);
}
