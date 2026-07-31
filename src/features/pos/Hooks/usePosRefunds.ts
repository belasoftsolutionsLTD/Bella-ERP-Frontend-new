'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Refund } from '../types';

export function usePosRefunds(params?: { saleId?: string; locationId?: string }) {
  const qs = new URLSearchParams();
  if (params?.saleId) qs.set('saleId', params.saleId);
  if (params?.locationId) qs.set('locationId', params.locationId);
  const key = `${API_BASE_URL}/pos/refunds?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Refund[]>(key, swrFetcher);

  const createRefund = (payload: { saleId: string; items: { itemId: string; quantity: number }[]; method: 'cash' | 'card'; reason?: string }) =>
    apiCallFunction({ url: `${API_BASE_URL}/pos/refunds`, method: 'POST', data: payload, thenFn: () => mutate() });

  return { refunds: data ?? [], error, isLoading, mutate, createRefund };
}
