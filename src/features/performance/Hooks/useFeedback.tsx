'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { FeedbackItem } from '../constants';

const BASE = `${API_BASE_URL}/performance/feedback`;

export function useFeedback(typeFilter?: string, employeeId?: string) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      params: employeeId ? { employeeId } : (typeFilter ? { type: typeFilter } : undefined),
      showToast: false,
      thenFn: (r) => setFeedback(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [typeFilter, employeeId]);

  const giveFeedback = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { feedback, loading, refetch: fetch, giveFeedback };
}
