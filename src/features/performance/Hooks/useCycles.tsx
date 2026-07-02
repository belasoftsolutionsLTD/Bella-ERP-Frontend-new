'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { ReviewCycle } from '../constants';

const BASE = `${API_BASE_URL}/performance/cycles`;

export function useCycles() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      showToast: false,
      thenFn: (r) => setCycles(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const createCycle = (data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); }, catchFn: () => onError?.() });

  const updateCycle = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'PUT', data, thenFn: () => { fetch(); onSuccess?.(); } });

  const launchCycle = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/launch`, method: 'POST', thenFn: () => { fetch(); onSuccess?.(); } });

  const closeCycle = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/close`, method: 'POST', thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { cycles, loading, refetch: fetch, createCycle, updateCycle, launchCycle, closeCycle };
}
