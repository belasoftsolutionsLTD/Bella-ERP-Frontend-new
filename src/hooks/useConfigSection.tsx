'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface ConfigItem {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  baseSalary?: number;
  salaryMin?: number;
  salaryMax?: number;
  amount?: number;
  percentage?: number;
  type?: string;
  jobGroupId?: string;
  jobGroupIds?: string[];
  defaultDays?: number;
  isPaid?: boolean;
  isEnabled?: boolean;
  isTaxable?: boolean;
  appearsOnPayslip?: boolean;
  createdAt: string;
}

// Generic CRUD hook for the simple /api/config/{path} sections (departments,
// job-groups, allowances, fixed-allowances, deductions, leave-types, designations).
// Shared across Payroll, Leave, and Employees settings pages since they all
// consume slices of the same /api/config backend — moving the UI tabs to their
// respective modules doesn't change the underlying endpoints.
export function useConfigSection(path: string) {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/${path}`,
      showToast: false,
      thenFn: (res) => setItems(res.data?.data ?? res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [path]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/config/${path}`,
      method: 'POST',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const update = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/config/${path}/${id}`,
      method: 'PUT',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const remove = (id: string) =>
    apiCallFunction({
      url: `${API_BASE_URL}/config/${path}/${id}`,
      method: 'DELETE',
      thenFn: () => fetch(),
    });

  return { items, loading, error, refetch: fetch, create, update, remove };
}
