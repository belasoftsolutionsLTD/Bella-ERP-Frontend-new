'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { ReviewTemplate } from '../constants';

const BASE = `${API_BASE_URL}/performance/templates`;

export function useTemplates(includeInactive = false) {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: includeInactive ? `${BASE}?includeInactive=true` : BASE,
      showToast: false,
      thenFn: (r) => setTemplates(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [includeInactive]);

  const createTemplate = (data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: BASE, method: 'POST', data, thenFn: () => { fetch(); onSuccess?.(); }, catchFn: () => onError?.() });

  const updateTemplate = (id: string, data: Record<string, unknown>, onSuccess?: () => void, onError?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'PUT', data, thenFn: () => { fetch(); onSuccess?.(); }, catchFn: () => onError?.() });

  const deleteTemplate = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'DELETE', thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { templates, loading, refetch: fetch, createTemplate, updateTemplate, deleteTemplate };
}
