'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveAccrualPolicy } from '../types';

export function useAccrualPolicies() {
  const [policies, setPolicies] = useState<LeaveAccrualPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/accrual-policies`, showToast: false,
      thenFn: (r) => setPolicies(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/accrual-policies`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/accrual-policies/${id}`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/accrual-policies/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const runNow = (onSuccess?: (message: string) => void) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/accrual-policies/run`, method: 'POST',
      thenFn: (r) => onSuccess?.(r.message),
    });

  const runYearEndCarryForward = (onSuccess?: (message: string) => void) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/year-end/carry-forward`, method: 'POST',
      thenFn: (r) => onSuccess?.(r.message),
    });

  return { policies, loading, refetch: fetch, create, update, remove, runNow, runYearEndCarryForward };
}
