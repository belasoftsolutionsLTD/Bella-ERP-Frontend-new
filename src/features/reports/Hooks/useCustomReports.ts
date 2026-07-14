'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { CustomReport } from '@/lib/reports/schemas';

const BASE = `${API_BASE_URL}/reports/custom`;

export interface SavedReport extends CustomReport {
  _id: string;
  createdAt: string;
  schedule: { frequency: 'weekly' | 'monthly'; recipients: string[]; lastRunAt: string | null; nextRunAt: string } | null;
}

export interface ReportResult { rows: Record<string, unknown>[]; grouped: { key: string; count: number; rows: Record<string, unknown>[] }[] | null; }

export function useCustomReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: BASE,
      showToast: false,
      thenFn: (r) => setReports(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const build = (def: {
    name: string; dataSources: string[]; fields: string[];
    filters?: { field: string; operator: string; value: string }[];
    groupBy?: string; dateRange?: { start?: string; end?: string }; format?: 'json' | 'csv'; save?: boolean;
  }, onSuccess?: (result: ReportResult, id?: string) => void, onError?: () => void) =>
    apiCallFunction<any>({
      url: `${BASE}/build`, method: 'POST', data: def,
      thenFn: (r) => { if (def.save) fetch(); onSuccess?.({ rows: r.data.rows, grouped: r.data.grouped }, r.data._id); },
      catchFn: () => onError?.(),
    });

  const runSaved = (id: string, onSuccess?: (result: ReportResult) => void) =>
    apiCallFunction<any>({ url: `${BASE}/${id}/run`, showToast: false, thenFn: (r) => onSuccess?.(r.data) });

  const schedule = (id: string, frequency: 'weekly' | 'monthly', recipients: string[], onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}/schedule`, method: 'POST', data: { frequency, recipients }, thenFn: () => { fetch(); onSuccess?.(); } });

  const remove = (id: string, onSuccess?: () => void) =>
    apiCallFunction({ url: `${BASE}/${id}`, method: 'DELETE', thenFn: () => { fetch(); onSuccess?.(); } });

  useEffect(() => { fetch(); }, [fetch]);

  return { reports, loading, refetch: fetch, build, runSaved, schedule, remove };
}
