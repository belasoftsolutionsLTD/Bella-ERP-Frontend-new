'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OnboardingRecord } from '../types';

export function useOnboardingRecords(filters: { status?: string; department?: string } = {}) {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.department) params.department = filters.department;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/records`, params, showToast: false,
      thenFn: (r) => setRecords(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.department]);

  useEffect(() => { fetch(); }, [fetch]);

  const initiate = (employeeId: string, templateId: string, startDate: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records`, method: 'POST',
      data: { employeeId, templateId, startDate },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { records, loading, refetch: fetch, initiate };
}

export function useOnboardingRecord(id: string | null) {
  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/records/${id}`, showToast: false,
      thenFn: (r) => setRecord(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateTask = (taskListId: string, taskId: string, status: string, notes?: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records/${id}/task`, method: 'PATCH',
      data: { taskListId, taskId, status, notes },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const updateWelcome = (data: { welcomeMessage?: string; firstDayDetails?: any }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records/${id}/welcome`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const addTask = (data: { title: string; description?: string; dueDate?: string; isRequired?: boolean; assignedTo: string; taskListId?: string; requiresDocument?: boolean }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records/${id}/task`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const uploadDocument = (taskId: string, file: File, onSuccess?: () => void) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('file', file);
    return apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records/${id}/document`, method: 'POST', data: formData,
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  return { record, loading, refetch: fetch, updateTask, updateWelcome, addTask, uploadDocument };
}
