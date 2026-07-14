'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBalance } from '../types';

export function useLeaveBalances(year?: number) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/balances`, params: year ? { year } : undefined, showToast: false,
      thenFn: (r) => setBalances(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  const adjust = (data: { employeeId: string; leaveTypeId: string; amount: number; reason: string; year?: number }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/balances/adjust`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { balances, loading, refetch: fetch, adjust };
}

export function useEmployeeLeaveBalances(employeeId: string | null, year?: number) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!employeeId) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/balances/${employeeId}`, params: year ? { year } : undefined, showToast: false,
      thenFn: (r) => setBalances(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId, year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { balances, loading, refetch: fetch };
}
