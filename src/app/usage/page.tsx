'use client';

import React from 'react';
import UsageOverTime from '../components/UsageOverTime';
import CostByModel from '../components/CostByModel';
import TokenDistribution from '../components/TokenDistribution';
import StatsCards from '../components/StatsCards';
import { useUsageData } from '../hooks/useAutoRefresh';

// Fallback placeholder data
const placeholderUsageData = [
  { date: '2026-02-05', tokens: 45000, cost: 0.045 },
  { date: '2026-02-06', tokens: 52000, cost: 0.052 },
  { date: '2026-02-07', tokens: 38000, cost: 0.038 },
  { date: '2026-02-08', tokens: 61000, cost: 0.061 },
  { date: '2026-02-09', tokens: 55000, cost: 0.055 },
  { date: '2026-02-10', tokens: 72000, cost: 0.072 },
  { date: '2026-02-11', tokens: 68000, cost: 0.068 },
];

const placeholderModelData = [
  { model: 'openrouter/meta-llama/llama-3.3-70b-instruct', cost: 0.15, tokens: 150000 },
  { model: 'openrouter/anthropic/claude-sonnet-4.5', cost: 0.12, tokens: 80000 },
  { model: 'openrouter/anthropic/claude-3-haiku', cost: 0.03, tokens: 60000 },
];

const placeholderTokenData = [
  { name: 'Llama 3.3', value: 150000 },
  { name: 'Claude Sonnet 4.5', value: 80000 },
  { name: 'Claude Haiku', value: 60000 },
];

export default function UsagePage() {
  const { 
    data, 
    error, 
    isLoading, 
    isValidating, 
    refresh, 
    lastUpdated 
  } = useUsageData(true);

  const hasData = data?.hasData || false;
  
  // Use real data or fallbacks
  const usageData = hasData && data?.usageOverTime ? data.usageOverTime : placeholderUsageData;
  const modelData = hasData && data?.costByModel ? data.costByModel : placeholderModelData;
  const tokenData = hasData && data?.tokenDistribution ? data.tokenDistribution : placeholderTokenData;
  
  const totalTokens = hasData && data?.stats ? data.stats.total_tokens : placeholderUsageData.reduce((sum, item) => sum + item.tokens, 0);
  const totalCost = hasData && data?.stats ? data.stats.total_cost : placeholderUsageData.reduce((sum, item) => sum + item.cost, 0);
  const sessionCount = hasData && data?.stats ? data.stats.session_count : 42;
  
  const avgCostPerSession = sessionCount > 0 ? totalCost / sessionCount : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/10 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-white/10 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Token Usage</h1>
          <p className="text-white/60 text-sm">
            {hasData ? 'Real usage data from usage.db' : 'Demo data - Phase 1 collection needed'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh indicator */}
          {isValidating && (
            <span className="text-white/40 text-sm flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          )}
          <button 
            onClick={() => refresh()}
            disabled={isValidating}
            className="glass-card px-4 py-2 text-white/80 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isValidating ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card p-4 mb-6 border-l-4 border-l-red-500">
          <p className="text-red-400">{error.message}</p>
        </div>
      )}

      {/* No Data Notice */}
      {!hasData && !error && (
        <div className="glass-card p-4 mb-6 border-l-4 border-l-amber-500">
          <p className="text-amber-400">No usage data yet. Phase 1 data collection needs to be running to populate real data.</p>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards 
        totalTokens={totalTokens}
        totalCost={totalCost}
        sessionCount={sessionCount}
        avgCostPerSession={avgCostPerSession}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <UsageOverTime data={usageData} />
        <CostByModel data={modelData} />
      </div>

      {/* Token Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1"></div>
        <TokenDistribution data={tokenData} />
        <div className="lg:col-span-1"></div>
      </div>

      {/* Footer */}
      <div className="text-center text-white/40 text-sm">
        {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'Auto-refreshes every minute'}
        {hasData && ' • Real-time data'}
      </div>
    </div>
  );
}