'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Candidate, Application } from '../types';
import type { CreateCandidateFormValues } from '../schemas';

export function useCandidates(filters: { source?: string; tags?: string; isPassiveTalent?: boolean } = {}) {
  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.tags) params.set('tags', filters.tags);
  if (filters.isPassiveTalent !== undefined) params.set('isPassiveTalent', String(filters.isPassiveTalent));
  const qs = params.toString();
  const key = `${API_BASE_URL}/recruitment/candidates${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Paginated<Candidate>>(key, swrFetcher);

  const createCandidate = (payload: CreateCandidateFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/candidates`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { candidates: data?.data ?? [], pagination: data?.pagination, isLoading, error, mutate, createCandidate };
}

export function useCandidate(id?: string) {
  const key = id ? `${API_BASE_URL}/recruitment/candidates/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Candidate & { applications: Application[] }>(key, swrFetcher);

  const updateCandidate = (payload: Partial<CreateCandidateFormValues>) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/candidates/${id}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  const convertCandidate = (requisitionId: string, coverLetter?: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/candidates/${id}/convert`,
    method: 'POST',
    data: { requisitionId, coverLetter },
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { candidate: data, isLoading, error, mutate, updateCandidate, convertCandidate };
}
