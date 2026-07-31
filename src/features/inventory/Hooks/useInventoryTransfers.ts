'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { StockTransfer } from '../types';

export function useInventoryTransfers(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/inventory/transfers?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<StockTransfer>>(key, swrFetcher);

  const requestTransfer = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/transfers`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const approveTransfer = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/transfers/${id}/approve`, method: 'POST', thenFn: () => mutate(),
  });
  const rejectTransfer = (id: string, reason?: string) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/transfers/${id}/reject`, method: 'POST', data: { reason }, thenFn: () => mutate(),
  });
  const receiveTransfer = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/transfers/${id}/receive`, method: 'POST', thenFn: () => mutate(),
  });

  return { transfers: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, requestTransfer, approveTransfer, rejectTransfer, receiveTransfer };
}
