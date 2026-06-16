'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';

interface UseFetchAllOptions {
  url: string;
  enabled?: boolean;
}

interface FetchAllState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetchAll<T = unknown>({
  url,
  enabled = true,
}: UseFetchAllOptions): FetchAllState<T> {
  const [data, setData] = useState<T[]>([]);
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
