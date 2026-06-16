'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface AppraisalRecord {
  _id: string;
  employeeId: string;
  reviewPeriod: string;
  reviewerId: string;
  goalsSet: string[];
  goalsAchieved: string[];
  rating: number;
  comments?: string;
  createdAt: string;
}

export function usePerformance(employeeId?: string) {
  const [records, setRecords] = useState<AppraisalRecord[]>([]);
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/${employeeId}`,
      showToast: false,
      thenFn: (res) => setRecords(res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId]);

  const fetchAlerts = useCallback(() => {
    setAlertsLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/alerts`,
      showToast: false,
      thenFn: (res) => setAlerts(res.data ?? []),
      catchFn: () => setAlerts([]),
      finallyFn: () => setAlertsLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); fetchAlerts(); }, [fetch, fetchAlerts]);
  return { records, alerts, loading, alertsLoading, error, refetch: fetch };
}
