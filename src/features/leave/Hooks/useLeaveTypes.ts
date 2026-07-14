'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveType } from '../types';

export function useLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/types`, showToast: false,
      thenFn: (r) => setLeaveTypes(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = (data: Record<string, unknown>, onSuccess?: (id: string) => void) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/types`, method: 'POST', data,
      thenFn: (r) => { fetch(); onSuccess?.(r.data?._id); },
    });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/types/${id}`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/types/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { leaveTypes, loading, refetch: fetch, create, update, remove };
}
