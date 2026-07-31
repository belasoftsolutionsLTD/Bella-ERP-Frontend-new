'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InventoryLot, StockMovement } from '../types';

export function useItemLots(itemId: string | null) {
  const key = itemId ? `${API_BASE_URL}/inventory/items/${itemId}/lots` : null;
  const { data, error, isLoading, mutate } = useSWR<InventoryLot[]>(key, swrFetcher);
  return { lots: data ?? [], error, isLoading, mutate };
}

export function useLotTrace(itemId: string | null, lotNumber: string | null) {
  const key = itemId && lotNumber ? `${API_BASE_URL}/inventory/lots/trace?itemId=${itemId}&lotNumber=${encodeURIComponent(lotNumber)}` : null;
  const { data, error, isLoading } = useSWR<{ lotNumber: string; lots: InventoryLot[]; movements: StockMovement[] }>(key, swrFetcher);
  return { trace: data ?? null, error, isLoading };
}
