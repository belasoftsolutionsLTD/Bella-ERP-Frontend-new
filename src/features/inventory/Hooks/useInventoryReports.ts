'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { ValuationReport, StockByCategoryRow, InventoryInsights } from '../types';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { downloadFile } from '@/functions/downloadFile';

export function useValuationReport(params?: { locationId?: string; category?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.category) qs.set('category', params.category);
  const { data, error, isLoading } = useSWR<ValuationReport>(`${API_BASE_URL}/inventory/reports/valuation?${qs.toString()}`, swrFetcher);
  return { valuation: data ?? null, error, isLoading };
}

export function useStockByCategoryReport(params?: { locationId?: string; category?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.category) qs.set('category', params.category);
  const { data, error, isLoading } = useSWR<StockByCategoryRow[]>(`${API_BASE_URL}/inventory/reports/stock-by-category?${qs.toString()}`, swrFetcher);
  return { rows: data ?? [], error, isLoading };
}

export function useInventoryInsights() {
  const { data, error, isLoading } = useSWR<InventoryInsights>(`${API_BASE_URL}/inventory/reports/insights`, swrFetcher);
  return { insights: data ?? null, error, isLoading };
}

export function exportMovementsCSV(params: { itemId?: string; locationId?: string; movementType?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return downloadFile(`${API_BASE_URL}/inventory/movements/export?${qs.toString()}`, 'inventory-movements.csv');
}

export function recomputeStockLevels() {
  return apiCallFunction({ url: `${API_BASE_URL}/inventory/movements/recompute`, method: 'POST' });
}
