'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { StockMovement } from '../types';

export function useStockMovements(params?: { itemId?: string; locationId?: string; movementType?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.itemId) qs.set('itemId', params.itemId);
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.movementType) qs.set('movementType', params.movementType);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/inventory/movements?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<StockMovement>>(key, swrFetcher);

  const createAdjustment = (payload: { itemId: string; locationId: string; quantityChange: number; notes?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/movements/adjustment`, method: 'POST', data: payload, thenFn: () => mutate(),
  });

  return { movements: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createAdjustment };
}
