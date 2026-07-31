'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { GlAccount } from '../types';

export function useAccounts(params?: { type?: string }) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  const key = `${API_BASE_URL}/accounting/chart-of-accounts?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<GlAccount[]>(key, swrFetcher);

  const createAccount = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/chart-of-accounts`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateAccount = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/chart-of-accounts/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const archiveAccount = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/chart-of-accounts/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });
  const seedDefaults = () => apiCallFunction({
    url: `${API_BASE_URL}/accounting/chart-of-accounts/seed-defaults`, method: 'POST', thenFn: () => mutate(),
  });

  return { accounts: data ?? [], error, isLoading, mutate, createAccount, updateAccount, archiveAccount, seedDefaults };
}
