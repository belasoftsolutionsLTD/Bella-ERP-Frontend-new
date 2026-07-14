'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBlackoutPeriod } from '../types';

// Bonus feature ported from the old system.
export function useLeaveBlackouts() {
  const [blackouts, setBlackouts] = useState<LeaveBlackoutPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/blackouts`, showToast: false,
      thenFn: (r) => setBlackouts(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/blackouts`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/blackouts/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { blackouts, loading, refetch: fetch, create, remove };
}
