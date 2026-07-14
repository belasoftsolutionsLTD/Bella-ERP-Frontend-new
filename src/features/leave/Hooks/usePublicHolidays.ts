'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { PublicHoliday } from '../types';

export function usePublicHolidays(year?: number) {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/public-holidays`, params: year ? { year } : undefined, showToast: false,
      thenFn: (r) => setHolidays(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/public-holidays`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/public-holidays/${id}`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/public-holidays/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { holidays, loading, refetch: fetch, create, update, remove };
}
