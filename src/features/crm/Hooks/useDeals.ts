'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Deal } from '../types';

export function useDeals(params?: { pipelineId?: string; status?: string; contactId?: string }) {
  const qs = new URLSearchParams();
  if (params?.pipelineId) qs.set('pipelineId', params.pipelineId);
  if (params?.status) qs.set('status', params.status);
  if (params?.contactId) qs.set('contactId', params.contactId);
  const key = `${API_BASE_URL}/crm/deals?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Deal>>(key, swrFetcher);

  const createDeal = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals`, method: 'POST', data: payload, returnResponse: true, thenFn: () => mutate(),
  });
  const moveDealStage = (dealId: string, stageId: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals/${dealId}/stage`, method: 'POST', data: { stageId }, showToast: false, thenFn: () => mutate(),
  });
  const winDeal = (dealId: string, confirmedSaleId?: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals/${dealId}/win`, method: 'POST', data: { confirmedSaleId }, thenFn: () => mutate(),
  });
  const loseDeal = (dealId: string, reason?: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals/${dealId}/lose`, method: 'POST', data: { reason }, thenFn: () => mutate(),
  });
  const reassignDeal = (dealId: string, assignedTo: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals/${dealId}/reassign`, method: 'POST', data: { assignedTo }, thenFn: () => mutate(),
  });

  return { deals: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createDeal, moveDealStage, winDeal, loseDeal, reassignDeal };
}

export function useDeal(id: string | null) {
  const key = id ? `${API_BASE_URL}/crm/deals/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Deal>(key, swrFetcher);

  const updateDeal = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/deals/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });

  return { deal: data ?? null, error, isLoading, mutate, updateDeal };
}
