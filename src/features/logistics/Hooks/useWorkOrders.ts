'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { WorkOrder } from '../types';

export function useWorkOrders(params?: { vehicleId?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '100');
  const key = `${API_BASE_URL}/logistics/work-orders?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<WorkOrder>>(key, swrFetcher);

  const createWorkOrder = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/work-orders`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const addPart = (id: string, payload: { itemId: string; quantity: number; locationId: string }) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/work-orders/${id}/parts`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const completeWorkOrder = (id: string, payload?: { laborCost?: number; otherCost?: number }) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/work-orders/${id}/complete`, method: 'POST', data: payload ?? {}, thenFn: () => mutate(),
  });

  return { workOrders: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createWorkOrder, addPart, completeWorkOrder };
}
