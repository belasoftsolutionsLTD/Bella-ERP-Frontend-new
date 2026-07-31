'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { InventoryItem } from '../types';

export function useInventoryItems(params?: { search?: string; category?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.category) qs.set('category', params.category);
  if (params?.page) qs.set('page', String(params.page));
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/inventory/items?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<InventoryItem>>(key, swrFetcher);

  const createItem = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/items`, method: 'POST', data: payload,
    returnResponse: true, thenFn: () => mutate(),
  });
  const updateItem = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/items/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const archiveItem = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/inventory/items/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });
  const uploadItemImage = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiCallFunction({ url: `${API_BASE_URL}/inventory/items/${id}/image`, method: 'POST', data: fd, thenFn: () => mutate() });
  };

  return {
    items: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate,
    createItem, updateItem, archiveItem, uploadItemImage,
  };
}

export function useInventoryItem(id: string | null) {
  const key = id ? `${API_BASE_URL}/inventory/items/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<InventoryItem>(key, swrFetcher);
  return { item: data ?? null, error, isLoading, mutate };
}

export function useItemTotalStock(itemId: string | null) {
  const key = itemId ? `${API_BASE_URL}/inventory/items/${itemId}/stock` : null;
  const { data, isLoading, mutate } = useSWR<{ itemId: string; totalQuantity: number; byLocation: unknown[] }>(key, swrFetcher);
  return { totalQuantity: data?.totalQuantity ?? 0, byLocation: data?.byLocation ?? [], isLoading, mutate };
}
