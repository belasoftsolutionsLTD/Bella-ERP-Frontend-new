'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InterviewKit } from '../types';

export function useInterviewKits() {
  const key = `${API_BASE_URL}/recruitment/interview-kits`;
  const { data, error, isLoading, mutate } = useSWR<InterviewKit[]>(key, swrFetcher);

  const createKit = (payload: { name: string; competencies: InterviewKit['competencies'] }) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/interview-kits`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateKit = (id: string, payload: Partial<{ name: string; competencies: InterviewKit['competencies'] }>) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/interview-kits/${id}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  const deleteKit = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/interview-kits/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  return { kits: data ?? [], isLoading, error, mutate, createKit, updateKit, deleteKit };
}
