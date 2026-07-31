'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Shipment, DeliveryPerformance } from '../types';

export function useShipments(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '100');
  const key = `${API_BASE_URL}/logistics/shipments?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Shipment>>(key, swrFetcher);

  const createShipment = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/shipments`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateStatus = (id: string, status: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/shipments/${id}/status`, method: 'POST', data: { status }, thenFn: () => mutate(),
  });
  const markDelivered = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/shipments/${id}/deliver`, method: 'POST', thenFn: () => mutate(),
  });
  const flagException = (id: string, reason: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/shipments/${id}/exception`, method: 'POST', data: { reason }, thenFn: () => mutate(),
  });
  const resolveException = (id: string, resolution: string, resumeStatus?: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/shipments/${id}/exception/resolve`, method: 'POST', data: { resolution, resumeStatus }, thenFn: () => mutate(),
  });

  return { shipments: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createShipment, updateStatus, markDelivered, flagException, resolveException };
}

export function useDeliveryPerformance() {
  const { data, error, isLoading } = useSWR<DeliveryPerformance>(`${API_BASE_URL}/logistics/reports/delivery-performance`, swrFetcher);
  return { performance: data ?? null, error, isLoading };
}
