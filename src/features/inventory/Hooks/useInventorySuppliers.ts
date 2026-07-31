'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Supplier } from '../types';

export function useInventorySuppliers() {
  const key = `${API_BASE_URL}/inventory/suppliers`;
  const { data, error, isLoading, mutate } = useSWR<Supplier[]>(key, swrFetcher);

  const createSupplier = (payload: Record<string, unknown>) => apiCallFunction({
    url: key, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateSupplier = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteSupplier = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { suppliers: data ?? [], error, isLoading, mutate, createSupplier, updateSupplier, deleteSupplier };
}
