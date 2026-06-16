'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface OnboardingEntry {
  employee: { _id: string; fullName: string; staffNumber: string; department: string };
  total: number;
  completed: number;
  percentage: number;
}

export interface OnboardingTask {
  _id: string;
  taskTitle: string;
  assignedDepartment: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  notes?: string;
}

export function useOnboarding() {
  const [entries, setEntries] = useState<OnboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/onboarding`,
      showToast: false,
      thenFn: (res) => setEntries(res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const completeTask = (taskId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/tasks/${taskId}`,
      method: 'PATCH',
      thenFn: () => fetch(),
    });
  };

  const startOnboarding = (employeeId: string, onSuccess?: () => void) => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/${employeeId}/assign-defaults`,
      method: 'POST',
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  const removeOnboarding = (employeeId: string, onSuccess?: () => void) => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/${employeeId}`,
      method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { entries, loading, error, refetch: fetch, completeTask, startOnboarding, removeOnboarding };
}
