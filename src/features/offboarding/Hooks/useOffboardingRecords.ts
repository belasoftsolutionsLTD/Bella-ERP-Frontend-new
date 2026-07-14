'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OffboardingRecord } from '../types';

export function useOffboardingRecords(filters: { status?: string; department?: string; exitType?: string } = {}) {
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.department) params.department = filters.department;
    if (filters.exitType) params.exitType = filters.exitType;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/records`, params, showToast: false,
      thenFn: (r) => setRecords(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.department, filters.exitType]);

  useEffect(() => { fetch(); }, [fetch]);

  const initiate = (data: { employeeId: string; templateId: string; exitType: string; exitReason?: string; lastWorkingDay: string }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { records, loading, refetch: fetch, initiate };
}

export function useOffboardingRecord(id: string | null) {
  const [record, setRecord] = useState<OffboardingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/offboarding/records/${id}`, showToast: false,
      thenFn: (r) => setRecord(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateTask = (taskListId: string, taskId: string, status: string, notes?: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/task`, method: 'PATCH',
      data: { taskListId, taskId, status, notes },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const addTask = (data: { title: string; description?: string; dueDate?: string; isRequired?: boolean; assignedTo: string; taskListId?: string; category?: string; requiresDocument?: boolean }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/task`, method: 'POST', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const uploadDocument = (taskId: string, file: File, onSuccess?: () => void) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('file', file);
    return apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/document`, method: 'POST', data: formData,
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  const updateAsset = (assetId: string, data: { returned: boolean; condition?: string; notes?: string }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/asset/${assetId}`, method: 'PATCH', data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const updateAccess = (accessId: string, revoked: boolean, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/access/${accessId}`, method: 'PATCH', data: { revoked },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const updateRehire = (eligibleForRehire: boolean, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/rehire`, method: 'PATCH', data: { eligibleForRehire },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const generateDocument = (type: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/generate-document`, method: 'POST', data: { type },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const triggerFinalPay = (onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/trigger-final-pay`, method: 'POST',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const completeRecord = (onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/offboarding/records/${id}/complete`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { record, loading, refetch: fetch, updateTask, addTask, uploadDocument, updateAsset, updateAccess, updateRehire, generateDocument, triggerFinalPay, completeRecord };
}
