'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface OffboardingAnalytics {
  exitTypeBreakdown: { exitType: string; count: number }[];
  avgCompletionDays: number | null;
  assetsOutstanding: number;
  accessesOutstanding: number;
  exitInterviewSentiment: {
    responseCount: number;
    avgJobSatisfaction: number | null;
    avgManagementRating: number | null;
    wouldRecommendPct: number | null;
  };
}

export function useOffboardingAnalytics() {
  const [data, setData] = useState<OffboardingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/analytics`, showToast: false,
      thenFn: (r) => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return { data, loading };
}
