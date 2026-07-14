'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface LeaveAnalytics {
  absenceTrendByMonth: { month: string; days: number }[];
  leaveTypeBreakdown: { leaveTypeId: string; name: string; days: number }[];
  departmentAbsence: { department: string; days: number }[];
  topLeaveTakers: { employeeId: string; days: number; employee: { fullName: string; department: string } | null }[];
  leaveLiabilityDays: number;
  pendingRequestsAging: { _id: string; daysWaiting: number }[];
  totalRequests: number;
  pendingCount: number;
}

export function useLeaveAnalytics() {
  const [data, setData] = useState<LeaveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/analytics`, showToast: false,
      thenFn: (r) => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return { data, loading };
}
