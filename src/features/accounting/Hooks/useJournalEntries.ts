'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { JournalEntry } from '../types';

export function useJournalEntries(params?: { source?: string; sourceModule?: string; status?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.source) qs.set('source', params.source);
  if (params?.sourceModule) qs.set('sourceModule', params.sourceModule);
  if (params?.status) qs.set('status', params.status);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/accounting/journal-entries?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<JournalEntry>>(key, swrFetcher);

  const createManualEntry = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/journal-entries`, method: 'POST', data: payload, returnResponse: true, thenFn: () => mutate(),
  });
  const reverseEntry = (id: string, reason?: string) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/journal-entries/${id}/reverse`, method: 'POST', data: { reason }, thenFn: () => mutate(),
  });

  return { entries: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createManualEntry, reverseEntry };
}

export function useJournalEntry(id: string | null) {
  const key = id ? `${API_BASE_URL}/accounting/journal-entries/${id}` : null;
  const { data, error, isLoading } = useSWR<JournalEntry>(key, swrFetcher);
  return { entry: data ?? null, error, isLoading };
}
