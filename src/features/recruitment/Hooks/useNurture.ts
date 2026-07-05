'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { NurtureCampaign, Candidate, TouchpointChannel } from '../types';

export function useNurtureCampaigns() {
  const key = `${API_BASE_URL}/recruitment/nurture/campaigns`;
  const { data, error, isLoading, mutate } = useSWR<(NurtureCampaign & { matchedCandidateCount: number })[]>(key, swrFetcher);

  const createCampaign = (payload: { name: string; description?: string; targetTags: string[] }) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/nurture/campaigns`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const addTouchpoint = (campaignId: string, payload: { candidateId: string; channel: TouchpointChannel; note: string; response?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/nurture/campaigns/${campaignId}/touchpoint`,
    method: 'POST',
    data: payload,
    thenFn: () => mutate(),
  });

  return { campaigns: data ?? [], isLoading, error, mutate, createCampaign, addTouchpoint };
}

export function useNurtureCandidates(tags?: string) {
  const params = new URLSearchParams();
  if (tags) params.set('tags', tags);
  const qs = params.toString();
  const key = `${API_BASE_URL}/recruitment/nurture/candidates${qs ? `?${qs}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<(Candidate & { lastTouchpointAt: string | null })[]>(key, swrFetcher);

  return { candidates: data ?? [], isLoading, error, mutate };
}
