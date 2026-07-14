'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { MyReviewTask } from '../constants';

const BASE = `${API_BASE_URL}/performance/reviews`;

export function useMyReviewTasks() {
  const [tasks, setTasks] = useState<MyReviewTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${BASE}/mine`,
      showToast: false,
      thenFn: (r) => setTasks(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, loading, refetch: fetch };
}
