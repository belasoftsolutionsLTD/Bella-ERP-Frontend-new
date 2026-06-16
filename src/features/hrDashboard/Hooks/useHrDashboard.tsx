'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface DashboardData {
  totalHeadcount: number;
  headcountByDepartment: { department: string; count: number }[];
  teachingVsNonTeaching: { teaching: number; nonTeaching: number };
  positionsSummary: { open: number; filled: number; frozen: number };
  pendingLeaveRequests: { count: number; items: unknown[] };
  newHiresThisMonth: unknown[];
  expiringContracts: { fullName: string; staffNumber: string; contractEndDate: string; daysRemaining: number }[];
  attendanceRateThisWeek: number;
  performanceConcerns: unknown[];
  onboardingProgress: { employeeId: string; total: number; completed: number; percentage: number }[];
}

export function useHrDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    setError(null);
    apiCallFunction<{ data: DashboardData }>({
      url: `${API_BASE_URL}/hr/dashboard`,
      method: 'GET',
      showToast: false,
      thenFn: (res) => setData((res as any).data ?? res),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => { fetch(); }, []);
  return { data, loading, error, refetch: fetch };
}
