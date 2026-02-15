'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseAutoRefreshOptions {
  interval?: number; // Refresh interval in milliseconds (default: 30000 = 30s)
  enabled?: boolean; // Whether to auto-refresh (default: true)
  onError?: (error: Error) => void;
}

interface UseAutoRefreshResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Generic hook for auto-refresh data fetching
export function useAutoRefresh<T>(
  key: string | null,
  options: UseAutoRefreshOptions = {}
): UseAutoRefreshResult<T> {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onError,
  } = options;

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const shouldFetch = enabled && key !== null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    shouldFetch ? key : null,
    fetcher,
    {
      refreshInterval: shouldFetch ? interval : 0,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      onError: (err) => {
        onError?.(err);
      },
    }
  );

  const refresh = useCallback(async () => {
    if (key) {
      await mutate();
      setLastUpdated(new Date());
    }
  }, [key, mutate]);

  useEffect(() => {
    if (data !== undefined) {
      setLastUpdated(new Date());
    }
  }, [data]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    lastUpdated,
  };
}

// Specialized hook for usage data
export function useUsageData(autoRefresh: boolean = true) {
  return useAutoRefresh<{
    hasData: boolean;
    stats: {
      total_tokens: number;
      total_cost: number;
      session_count: number;
    };
    usageOverTime: Array<{
      date: string;
      tokens: number;
      cost: number;
    }>;
    costByModel: Array<{
      model: string;
      cost: number;
      tokens: number;
    }>;
    tokenDistribution: Array<{
      name: string;
      value: number;
    }>;
  }>('/api/usage', {
    interval: 60000, // 1 minute for usage data
    enabled: autoRefresh,
  });
}

// Hook for tracking refresh state
export function useRefreshTrigger(interval: number = 30000) {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setShouldRefresh(true);
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  const acknowledge = useCallback(() => {
    setShouldRefresh(false);
  }, []);

  return { shouldRefresh, acknowledge };
}