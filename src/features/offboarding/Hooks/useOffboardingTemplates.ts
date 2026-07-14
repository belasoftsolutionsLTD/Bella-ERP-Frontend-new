'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OffboardingTemplate } from '../types';

export function useOffboardingTemplates() {
  const [templates, setTemplates] = useState<OffboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/templates`, showToast: false,
      thenFn: (r) => setTemplates(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/templates/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { templates, loading, refetch: fetch, remove };
}

export function useOffboardingTemplate(id: string | null) {
  const [template, setTemplate] = useState<OffboardingTemplate | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/templates/${id}`, showToast: false,
      thenFn: (r) => setTemplate(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  const create = (data: Record<string, unknown>, onSuccess?: (id: string) => void) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/templates`, method: 'POST', data,
      thenFn: (r) => onSuccess?.(r.data?._id),
    });

  const update = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/templates/${id}`, method: 'PATCH', data,
      thenFn: () => onSuccess?.(),
    });

  return { template, loading, create, update };
}
