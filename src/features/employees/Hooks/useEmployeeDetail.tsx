'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { Employee } from './useEmployees';

export function useEmployeeDetail(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees/${id}`,
      showToast: false,
      thenFn: (res) => setEmployee(res.data ?? res),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { employee, loading, error, refetch: fetch };
}
