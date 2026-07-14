'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { PIP } from '../constants';

const BASE = `${API_BASE_URL}/performance/pips`;

export function usePIPs() {
  const [pips, setPips] = useState<PIP[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      showToast: false,
      thenFn: (r) => setPips(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const create = (data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); }, catchFn: () => onError?.() });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'PUT', data, thenFn: () => { fetch(); onSuccess?.(); } });

  const addCheckIn = (id: string, note: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/checkin`, method: 'POST', data: { note }, thenFn: () => { fetch(); onSuccess?.(); } });

  const close = (id: string, outcome: 'passed' | 'failed', onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/close`, method: 'POST', data: { outcome }, thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { pips, loading, refetch: fetch, create, update, addCheckIn, close };
}
