'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { JobRequisition } from '../types';
import type { CreateRequisitionFormValues, UpdateRequisitionFormValues } from '../schemas';

export function useRequisitions(filters: { status?: string; department?: string; location?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  const key = `${API_BASE_URL}/recruitment/requisitions${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Paginated<JobRequisition>>(key, swrFetcher);

  const createRequisition = (payload: CreateRequisitionFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/requisitions`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return {
    requisitions: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createRequisition,
  };
}

export function useRequisition(id?: string) {
  const key = id ? `${API_BASE_URL}/recruitment/requisitions/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<JobRequisition>(key, swrFetcher);

  const updateRequisition = (payload: UpdateRequisitionFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/requisitions/${id}`,
    method: 'PATCH',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const submitForApproval = () => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/requisitions/${id}/submit`,
    method: 'POST',
    thenFn: () => mutate(),
  });

  const approve = (status: 'approved' | 'rejected', comment?: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/requisitions/${id}/approve`,
    method: 'POST',
    data: { status, comment },
    thenFn: () => mutate(),
  });

  const closeRequisition = () => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/requisitions/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  return { requisition: data, isLoading, error, mutate, updateRequisition, submitForApproval, approve, closeRequisition };
}
