'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InventoryLocation, StockLevel, LowStockAlert } from '../types';

export function useInventoryLocations() {
  const key = `${API_BASE_URL}/inventory/locations`;
  const { data, error, isLoading, mutate } = useSWR<InventoryLocation[]>(key, swrFetcher);

  const createLocation = (payload: Record<string, unknown>) => apiCallFunction({
    url: key, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateLocation = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteLocation = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { locations: data ?? [], error, isLoading, mutate, createLocation, updateLocation, deleteLocation };
}

export function useStockLevels(params?: { locationId?: string; itemId?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.itemId) qs.set('itemId', params.itemId);
  const key = `${API_BASE_URL}/inventory/stock-levels?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<StockLevel[]>(key, swrFetcher);

  const setReorderPoint = (itemId: string, locationId: string, reorderPoint: number) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/stock-levels/reorder-point`, method: 'PUT',
    data: { itemId, locationId, reorderPoint }, thenFn: () => mutate(),
  });

  return { stockLevels: data ?? [], error, isLoading, mutate, setReorderPoint };
}

export function useLowStockAlerts(params?: { locationId?: string; category?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.category) qs.set('category', params.category);
  const key = `${API_BASE_URL}/inventory/reports/low-stock?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<LowStockAlert[]>(key, swrFetcher);
  return { alerts: data ?? [], error, isLoading, mutate };
}
