'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveRequest } from '../types';

export function useLeaveCalendar(filters: { startDate?: string; endDate?: string; departmentId?: string; leaveTypeId?: string } = {}) {
  const [entries, setEntries] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.leaveTypeId) params.leaveTypeId = filters.leaveTypeId;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/calendar`, params, showToast: false,
      thenFn: (r) => setEntries(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.departmentId, filters.leaveTypeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { entries, loading, refetch: fetch };
}
