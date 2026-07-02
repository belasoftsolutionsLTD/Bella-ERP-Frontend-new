'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface OffboardingEmployee {
  _id: string;
  fullName: string;
  staffNumber: string;
  department: string;
  designation?: string;
  contractEndDate?: string;
}

export interface OffboardingEntry {
  employee: OffboardingEmployee;
  total: number;
  completed: number;
  percentage: number;
}

export interface OffboardingTask {
  _id: string;
  taskTitle: string;
  taskSection: 'before_last_day' | 'last_day' | 'after_departure';
  assignedDepartment: string;
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt?: string;
}

export function useOffboarding() {
  const [entries, setEntries] = useState<OffboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/offboarding`,
      showToast: false,
      thenFn: (res) => setEntries(res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const removeOffboarding = (employeeId: string, onSuccess?: () => void) => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/offboarding/${employeeId}`,
      method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { entries, loading, error, refetch: fetch, removeOffboarding };
}
