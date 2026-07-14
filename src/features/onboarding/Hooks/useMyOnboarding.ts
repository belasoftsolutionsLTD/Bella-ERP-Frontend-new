'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OnboardingRecord } from '../types';

export function useMyOnboarding() {
  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/my`, showToast: false,
      thenFn: (r) => setRecord(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const completeTask = (taskId: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/my/task/${taskId}`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const uploadDocument = (taskId: string, file: File, name: string, onSuccess?: () => void) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('name', name);
    formData.append('file', file);
    return apiCallFunction({
      url: `${API_BASE_URL}/onboarding/my/document`, method: 'POST', data: formData,
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  const markMet = (personId: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/my/meetTheTeam/${personId}`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { record, loading, refetch: fetch, completeTask, uploadDocument, markMet };
}
