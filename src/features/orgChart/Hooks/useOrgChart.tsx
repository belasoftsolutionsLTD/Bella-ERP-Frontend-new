'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface OrgEmployee {
  _id: string;
  fullName: string;
  designation: string;
  department: string;
  status: string;
  staffNumber: string;
  profilePhoto: string | null;
  email?: string;
  staffCategory?: string;
}

export interface OrgDepartment {
  name: string;
  employees: OrgEmployee[];
}

export interface OrgChartData {
  departments: OrgDepartment[];
  total: number;
}

export function useOrgChart() {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    setError(null);
    apiCallFunction<{ data: OrgChartData }>({
      url: `${API_BASE_URL}/hr/org-chart`,
      method: 'GET',
      showToast: false,
      thenFn: (res) => setData((res as any).data ?? res),
      catchFn: (e: any) => setError(e?.message || 'Failed to load org chart'),
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => { fetch(); }, []);
  return { data, loading, error, refetch: fetch };
}
