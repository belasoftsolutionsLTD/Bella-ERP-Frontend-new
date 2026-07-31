'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import { downloadFile } from '@/functions/downloadFile';
import type { StockSearchResult, PipelineReport, ActivityReportRow } from '../types';

// Read-only against Inventory's own data — calls the module's own getStockLevel
// function server-side; nothing here writes to Inventory.
export function useInventoryStockSearch(search: string) {
  const key = search ? `${API_BASE_URL}/crm/inventory/stock?search=${encodeURIComponent(search)}` : null;
  const { data, isLoading } = useSWR<StockSearchResult[]>(key, swrFetcher);
  return { results: data ?? [], isLoading };
}

export function usePipelineReport(pipelineId: string | null) {
  const key = pipelineId ? `${API_BASE_URL}/crm/reports/pipeline?pipelineId=${pipelineId}` : null;
  const { data, isLoading } = useSWR<PipelineReport>(key, swrFetcher);
  return { report: data ?? null, isLoading };
}

export function useActivityReport() {
  const { data, isLoading } = useSWR<ActivityReportRow[]>(`${API_BASE_URL}/crm/reports/activity`, swrFetcher);
  return { rows: data ?? [], isLoading };
}

export function exportDealsCSV(params: { pipelineId?: string; status?: string }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return downloadFile(`${API_BASE_URL}/crm/deals/export?${qs.toString()}`, 'crm-deals.csv');
}
