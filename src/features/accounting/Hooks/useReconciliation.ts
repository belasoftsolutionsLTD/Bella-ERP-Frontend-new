'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { BankStatementImport } from '../types';

export function useBankStatementImports() {
  const key = `${API_BASE_URL}/accounting/reconciliation/imports`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<BankStatementImport>>(key, swrFetcher);

  const importStatement = (payload: { accountId: string; openingBalance: number; closingBalance: number; file: File }) => {
    const fd = new FormData();
    fd.append('accountId', payload.accountId);
    fd.append('openingBalance', String(payload.openingBalance));
    fd.append('closingBalance', String(payload.closingBalance));
    fd.append('statement', payload.file);
    return apiCallFunction({ url: key, method: 'POST', data: fd, thenFn: () => mutate() });
  };

  return { imports: data?.data ?? [], error, isLoading, mutate, importStatement };
}

export function useBankStatementImport(id: string | null) {
  const key = id ? `${API_BASE_URL}/accounting/reconciliation/imports/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<BankStatementImport>(key, swrFetcher);

  const autoMatch = () => apiCallFunction({ url: `${API_BASE_URL}/accounting/reconciliation/imports/${id}/auto-match`, method: 'POST', thenFn: () => mutate() });
  const unmatchLine = (lineIndex: number) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/reconciliation/imports/${id}/lines/${lineIndex}/unmatch`, method: 'POST', thenFn: () => mutate(),
  });
  const reconcile = () => apiCallFunction({ url: `${API_BASE_URL}/accounting/reconciliation/imports/${id}/reconcile`, method: 'POST', thenFn: () => mutate() });

  return { statementImport: data ?? null, error, isLoading, mutate, autoMatch, unmatchLine, reconcile };
}
