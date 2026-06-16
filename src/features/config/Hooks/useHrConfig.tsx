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
  createdAt: string;
}

function useConfigSection(path: string) {
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

export function useHrConfig() {
  const departments      = useConfigSection('departments');
  const jobGroups        = useConfigSection('job-groups');
  const allowances       = useConfigSection('allowances');
  const fixedAllowances  = useConfigSection('fixed-allowances');
  const deductions       = useConfigSection('deductions');
  const leaveTypes       = useConfigSection('leave-types');
  const designations      = useConfigSection('designations');
  const jdTemplates       = useConfigSection('jd-templates');
  const companyAccounts   = useConfigSection('company-accounts');
  return { departments, jobGroups, allowances, fixedAllowances, deductions, leaveTypes, designations, jdTemplates, companyAccounts };
}
