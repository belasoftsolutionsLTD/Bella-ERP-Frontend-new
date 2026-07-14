'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { Review } from '../constants';

const BASE = `${API_BASE_URL}/performance/reviews`;

// A review may not exist yet (the task list surfaces work before any draft is created) —
// pass reviewId when one exists, otherwise pass the (cycleId, employeeId, reviewType)
// triple so the form can create-on-first-save via the same upsert endpoint.
export function useReview(reviewId: string | null) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(!!reviewId);

  const fetch = useCallback(() => {
    if (!reviewId) { setReview(null); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${BASE}/${reviewId}`,
      showToast: false,
      thenFn: (r) => setReview(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [reviewId]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = (data: Record<string, unknown>, onSuccess?: (id: string) => void, onError?: () => void) =>
    apiCallFunction<any>({
      url: BASE,
      method: 'POST',
      data,
      thenFn: (r) => onSuccess?.(r.data?._id ?? reviewId ?? ''),
      catchFn: () => onError?.(),
    });

  const submit = (id: string, data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/submit`, method: 'POST', data, thenFn: () => onSuccess?.(), catchFn: () => onError?.() });

  return { review, loading, refetch: fetch, save, submit };
}
