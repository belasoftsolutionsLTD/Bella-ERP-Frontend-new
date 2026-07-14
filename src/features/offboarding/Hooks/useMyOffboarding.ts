'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OffboardingRecord, GeneratedDocument } from '../types';

export function useMyOffboarding() {
  const [record, setRecord] = useState<OffboardingRecord | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>((resolve) => apiCallFunction<any>({
        url: `${API_BASE_URL}/offboarding/my`, showToast: false,
        thenFn: (r) => setRecord(r.data ?? null),
        finallyFn: resolve,
      })),
      new Promise<void>((resolve) => apiCallFunction<any>({
        url: `${API_BASE_URL}/offboarding/my/documents`, showToast: false,
        thenFn: (r) => setDocuments(r.data ?? []),
        finallyFn: resolve,
      })),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const completeTask = (taskId: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/my/task/${taskId}`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const uploadDocument = (taskId: string, file: File, name: string, onSuccess?: () => void) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('name', name);
    formData.append('file', file);
    return apiCallFunction({
      url: `${API_BASE_URL}/offboarding/my/document`, method: 'POST', data: formData,
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  const submitExitInterview = (data: {
    reasonForLeaving: string; jobSatisfactionRating: number; managementRating: number;
    wouldRecommendCompany: boolean; suggestions?: string; additionalComments?: string;
  }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/my/exit-interview`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { record, documents, loading, refetch: fetch, completeTask, uploadDocument, submitExitInterview };
}
