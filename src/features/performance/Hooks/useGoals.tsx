'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { Goal } from '../constants';

const BASE = `${API_BASE_URL}/performance/goals`;

export function useGoals(params?: { employeeId?: string; status?: string; period?: string }) {
  const [goals, setGoals]   = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      params,
      showToast: false,
      thenFn: (r) => setGoals(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [JSON.stringify(params)]);

  const createGoal = (data: Partial<Goal>, onSuccess?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); } });

  const updateGoal = (id: string, data: Partial<Goal>, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'PUT', data, thenFn: () => { fetch(); onSuccess?.(); } });

  const deleteGoal = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'DELETE', thenFn: () => { fetch(); onSuccess?.(); } });

  const addCheckin = (id: string, progress: number, note: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/checkin`, method: 'POST', data: { progress, note }, thenFn: () => { fetch(); onSuccess?.(); } });

  const addComment = (id: string, text: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/comment`, method: 'POST', data: { text }, thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { goals, loading, refetch: fetch, createGoal, updateGoal, deleteGoal, addCheckin, addComment };
}
