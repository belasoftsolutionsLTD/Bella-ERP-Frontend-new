'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// Generic GET-report hook shared by every page in this module — every /api/reports/*
// endpoint returns { success, message, data }, so one hook covers all of them instead of
// writing a near-identical fetch wrapper per report.
export function useReportQuery<T = any>(path: string, params?: Record<string, unknown>, skip = false) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (skip) return;
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/reports${path}`,
      params,
      showToast: false,
      thenFn: (r) => setData(r.data ?? null),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(params), skip]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
