'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { FeedbackListResponse, FeedbackSummary, SourceEffectiveness } from '../types';

export function useContactFeedback(contactId: string | null) {
  const key = contactId ? `${API_BASE_URL}/crm/contacts/${contactId}/feedback` : null;
  const { data, error, isLoading, mutate } = useSWR<FeedbackListResponse>(key, swrFetcher);

  const createFeedback = (payload: { rating: number; comment?: string; dealId?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/crm/contacts/${contactId}/feedback`, method: 'POST', data: payload, thenFn: () => mutate(),
  });

  return { feedback: data?.feedback ?? [], avgRating: data?.avgRating ?? null, count: data?.count ?? 0, error, isLoading, mutate, createFeedback };
}

export function useFeedbackSummary() {
  const { data, error, isLoading } = useSWR<FeedbackSummary>(`${API_BASE_URL}/crm/reports/feedback`, swrFetcher);
  return { summary: data ?? null, error, isLoading };
}

export function useSourceEffectiveness() {
  const { data, error, isLoading } = useSWR<SourceEffectiveness[]>(`${API_BASE_URL}/crm/reports/sources`, swrFetcher);
  return { sources: data ?? [], error, isLoading };
}
