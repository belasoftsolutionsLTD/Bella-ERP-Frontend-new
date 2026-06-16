'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface JobPosition {
  _id: string;
  jobTitle: string;
  designation?: string;
  jobCategory?: string;
  jobDescription?: string;
  department: string;
  requiredQualifications: string[];
  yearsOfExperience?: number;
  salaryBandMin?: number;
  salaryBandMax?: number;
  numberOfOpenings: number;
  filledCount: number;
  stageRequirements?: Array<{ stage: string; description: string; yearsOfExperience?: number; requiresAdminApproval: boolean }>;
  status: string;
  createdAt: string;
}

export function useJobPositions() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/positions`,
      showToast: false,
      thenFn: (res) => setPositions(res.data?.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const createPosition = (data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/positions`,
      method: 'POST',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const updatePosition = (id: string, data: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/positions/${id}`,
      method: 'PUT',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const deletePosition = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/positions/${id}`,
      method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  useEffect(() => { fetch(); }, [fetch]);
  return { positions, loading, error, refetch: fetch, createPosition, updatePosition, deletePosition };
}
