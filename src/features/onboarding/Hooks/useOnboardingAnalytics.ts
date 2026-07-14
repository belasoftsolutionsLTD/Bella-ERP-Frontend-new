'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface OnboardingAnalytics {
  avgCompletionDaysByDepartment: { department: string; avgDays: number; count: number }[];
  avgCompletionDaysByTemplate: { templateId: string; templateName: string; avgDays: number; count: number }[];
  taskCompletionRateByStakeholder: { assignedTo: string; total: number; completed: number; rate: number }[];
  stalledEmployees: { employeeId: string; fullName: string; department: string; daysSinceActivity: number }[];
  newHiresByMonth: { key: string; count: number }[];
}

export function useOnboardingAnalytics() {
  const [data, setData] = useState<OnboardingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/analytics`, showToast: false,
      thenFn: (r) => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return { data, loading };
}
