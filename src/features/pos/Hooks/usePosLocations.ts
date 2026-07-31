'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { InventoryLocation } from '@/features/inventory/types';

// Locations scoped by POS's own access level (posLocationIds for staff, department for
// manager, unrestricted for admin) — deliberately NOT Inventory's useInventoryLocations,
// which gates on Inventory's separate access level and would 403 for a POS-only cashier
// with no Inventory access at all, silently rendering every location picker empty.
export function usePosLocations() {
  const { data, error, isLoading } = useSWR<InventoryLocation[]>(`${API_BASE_URL}/pos/locations`, swrFetcher);
  return { locations: data ?? [], error, isLoading };
}
