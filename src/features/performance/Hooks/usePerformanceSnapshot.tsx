'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface PerformanceSnapshotCycle {
  cycleId: string;
  cycleName: string;
  selfReviewStatus: string | null;
  managerReviewStatus: string | null;
}

export interface PerformanceSnapshot {
  activeCycles: PerformanceSnapshotCycle[];
  lastRating: {
    overallRating: number | null;
    calibrationBox: string | null;
    cycleName: string | null;
    submittedAt: string | null;
  } | null;
}

export function usePerformanceSnapshot(employeeId?: string) {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/snapshot/${employeeId}`,
      showToast: false,
      thenFn: (r) => setSnapshot(r.data ?? null),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snapshot, loading, error, refetch: fetch };
}
