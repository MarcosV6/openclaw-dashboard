'use client';

import React from 'react';
import { useAutoRefresh } from './hooks/useAutoRefresh';

interface StatusData {
  timestamp: string;
  gateway: { status: string; port: number };
  heartbeat: { status: string; lastRun: string | null; ageHours?: number };
  database: { status: string; records: number; latestRecord: string | null; lastHealthCheck?: any };
  cron: { jobs: Array<{ name: string; enabled: boolean; schedule: string; lastStatus: string; lastError: string | null; consecutiveErrors: number; nextRunAt: string | null }> };
}

function StatusDot({ status }: { status: string }) {
  const color = {
    online: 'bg-green-400',
    healthy: 'bg-green-400',
    ok: 'bg-green-400',
    stale: 'bg-amber-400',
    warn: 'bg-amber-400',
    offline: 'bg-red-400',
    error: 'bg-red-400',
    dead: 'bg-red-400',
    unknown: 'bg-gray-400',
    no_data: 'bg-gray-400',
    never_run: 'bg-gray-400',
  }[status.toLowerCase()] || 'bg-gray-400';

  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function formatAge(hours: number | undefined): string {
  if (hours === undefined) return 'unknown';
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Home() {
  const { data: status, isLoading } = useAutoRefresh<StatusData>('/api/status', { interval: 30000 });
  const { data: usageData } = useAutoRefresh<any>('/api/usage', { interval: 60000 });

  const totalCost = usageData?.stats?.total_cost || 0;
  const totalTokens = usageData?.stats?.total_tokens || 0;
  const sessionCount = usageData?.stats?.session_count || 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Spend</h3>
          <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">{sessionCount} sessions tracked</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tokens Used</h3>
          <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Total tokens processed</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Gateway</h3>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-2xl text-gray-400">...</span>
            ) : (
              <>
                <StatusDot status={status?.gateway.status || 'unknown'} />
                <p className="text-2xl font-bold capitalize">{status?.gateway.status || 'unknown'}</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Port {status?.gateway.port || 18789}</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Heartbeat</h3>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-2xl text-gray-400">...</span>
            ) : (
              <>
                <StatusDot status={status?.heartbeat.status || 'unknown'} />
                <p className="text-2xl font-bold capitalize">{status?.heartbeat.status || 'unknown'}</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
            {status?.heartbeat.ageHours !== undefined ? formatAge(status.heartbeat.ageHours) : 'No data'}
          </p>
        </div>
      </div>

      {/* Cron Jobs Health */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Cron Jobs</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-white/10 rounded"></div>)}
          </div>
        ) : status?.cron.jobs.length ? (
          <div className="space-y-3">
            {status.cron.jobs.map((job, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusDot status={job.lastStatus === 'success' ? 'healthy' : job.lastStatus === 'error' ? 'error' : 'unknown'} />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{job.name}</p>
                    <p className="text-gray-400 dark:text-white/40 text-xs">{job.schedule}</p>
                  </div>
                </div>
                <div className="text-right">
                  {job.consecutiveErrors > 0 && (
                    <p className="text-red-400 text-xs">{job.consecutiveErrors} consecutive error{job.consecutiveErrors > 1 ? 's' : ''}</p>
                  )}
                  {job.lastError && (
                    <p className="text-red-400/60 text-xs max-w-xs truncate">{job.lastError}</p>
                  )}
                  {job.nextRunAt && (
                    <p className="text-gray-400 dark:text-white/30 text-xs">Next: {new Date(job.nextRunAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-white/40">No cron jobs configured</p>
        )}
      </div>

      {/* Database Health */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Database</h2>
        <div className="flex items-center gap-3">
          <StatusDot status={status?.database.status || 'unknown'} />
          <span className="text-gray-900 dark:text-white capitalize">{status?.database.status || 'Checking...'}</span>
          <span className="text-gray-500 dark:text-white/40 text-sm ml-4">{status?.database.records || 0} records</span>
          {status?.database.latestRecord && (
            <span className="text-gray-400 dark:text-white/30 text-sm">Latest: {new Date(status.database.latestRecord).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/chat" className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition">
            <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Chat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Talk to your agent</p>
          </a>
          <a href="/tasks" className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition">
            <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Tasks</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kanban board</p>
          </a>
          <a href="/usage" className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition">
            <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Usage</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Token analytics</p>
          </a>
          <a href="/sessions" className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition">
            <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Sessions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Conversation logs</p>
          </a>
          <a href="/memory" className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition">
            <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Memory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Notes & docs</p>
          </a>
        </div>
      </div>
    </div>
  );
}
