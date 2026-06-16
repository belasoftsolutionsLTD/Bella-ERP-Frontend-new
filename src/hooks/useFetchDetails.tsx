'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';

interface UseFetchDetailsOptions {
  url: string;
  enabled?: boolean;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetchDetails<T = unknown>({
  url,
  enabled = true,
}: UseFetchDetailsOptions): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    apiCallFunction({
      url,
      method: 'GET',
      signal: controller.signal,
      showToast: false,
      thenFn: (res) => setData(res.data ?? res),
      catchFn: (err) => setError(err?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });

    setLoading(true);
    setError(null);

    return () => controller.abort();
  }, [url, enabled, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
