'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { AccountingAccessLevel } from '../types';

export function useAccountingAccess() {
  const { data, isLoading } = useSWR<{ level: AccountingAccessLevel }>(`${API_BASE_URL}/accounting/my-access`, swrFetcher);
  return { level: data?.level ?? null, isLoading };
}

export function useAccountingPeriods() {
  const key = `${API_BASE_URL}/accounting/periods`;
  const { data, error, isLoading, mutate } = useSWR<{ _id: string; year: number; month: number; status: string }[]>(key, swrFetcher);

  const closePeriod = (year: number, month: number) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/periods/close`, method: 'POST', data: { year, month }, thenFn: () => mutate(),
  });
  const reopenPeriod = (year: number, month: number) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/periods/reopen`, method: 'POST', data: { year, month }, thenFn: () => mutate(),
  });

  return { periods: data ?? [], error, isLoading, mutate, closePeriod, reopenPeriod };
}

export function usePostingFailures() {
  const key = `${API_BASE_URL}/accounting/posting-failures`;
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher);

  const retry = (id: string) => apiCallFunction({ url: `${key}/${id}/retry`, method: 'POST', thenFn: () => mutate() });
  const dismiss = (id: string) => apiCallFunction({ url: `${key}/${id}/dismiss`, method: 'POST', thenFn: () => mutate() });

  return { failures: (data as any[]) ?? [], error, isLoading, mutate, retry, dismiss };
}

// Purchase orders Inventory has requested payment on, awaiting Accounting's approval
// before the AP payment entry actually posts — see accountingPoPaymentsFunctions.js.
export function usePendingPoPayments() {
  const key = `${API_BASE_URL}/accounting/po-payments/pending`;
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher);

  const approve = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/accounting/po-payments/${id}/approve`, method: 'POST', thenFn: () => mutate() });
  const reject = (id: string, reason?: string) => apiCallFunction({ url: `${API_BASE_URL}/accounting/po-payments/${id}/reject`, method: 'POST', data: { reason }, thenFn: () => mutate() });

  return { pending: (data as any[]) ?? [], error, isLoading, mutate, approve, reject };
}
