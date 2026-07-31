'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InventoryItem } from '@/features/inventory/types';

// Same reasoning as usePosLocations/usePosStockLevels — the register's item search,
// scoped by POS's own access level rather than Inventory's gated GET /inventory/items.
export function usePosItems(search: string) {
  const key = `${API_BASE_URL}/pos/items${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  const { data, error, isLoading } = useSWR<InventoryItem[]>(key, swrFetcher);
  return { items: data ?? [], error, isLoading };
}
