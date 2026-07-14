'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OneOnOne } from '../constants';

const BASE = `${API_BASE_URL}/performance/one-on-ones`;

export function useOneOnOnes() {
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      showToast: false,
      thenFn: (r) => setOneOnOnes(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const create = (data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); }, catchFn: () => onError?.() });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'PUT', data, thenFn: () => { fetch(); onSuccess?.(); } });

  const addAgendaItem = (id: string, text: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/agenda`, method: 'POST', data: { text }, thenFn: () => { fetch(); onSuccess?.(); } });

  const toggleAgendaItem = (id: string, itemId: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/agenda/${itemId}`, method: 'PATCH', thenFn: () => { fetch(); onSuccess?.(); } });

  const complete = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/complete`, method: 'POST', thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { oneOnOnes, loading, refetch: fetch, create, update, addAgendaItem, toggleAgendaItem, complete };
}
