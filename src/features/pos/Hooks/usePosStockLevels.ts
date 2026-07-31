'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

// Deliberately a narrower shape than Inventory's own StockLevel type — GET
// /pos/stock-levels (posInventoryFunctions.js) returns exactly these fields, no
// reorderPoint/_id/location, since the register screen never needs those.
export interface PosStockLevel {
  itemId: string;
  locationId: string;
  quantity: number;
  item: { sku: string; name: string; category: string | null; unitOfMeasure: string };
}

// Same reasoning as usePosLocations — live stock for the register screen, scoped by
// POS's own access level rather than Inventory's gated GET /inventory/stock-levels.
export function usePosStockLevels(locationId: string | null) {
  const key = locationId ? `${API_BASE_URL}/pos/stock-levels?locationId=${locationId}` : null;
  const { data, error, isLoading } = useSWR<PosStockLevel[]>(key, swrFetcher);
  return { stockLevels: data ?? [], error, isLoading };
}
