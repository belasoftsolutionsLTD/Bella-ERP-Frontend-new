'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { ArInvoice } from '../types';

export function useArInvoices(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/accounting/ar-invoices?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<ArInvoice>>(key, swrFetcher);

  const createInvoice = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ar-invoices`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const sendInvoice = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ar-invoices/${id}/send`, method: 'POST', thenFn: () => mutate(),
  });
  const recordPayment = (id: string, payload: { amount: number; method: string; reference?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ar-invoices/${id}/payments`, method: 'POST', data: payload, thenFn: () => mutate(),
  });

  return { invoices: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createInvoice, sendInvoice, recordPayment };
}

export function useArInvoice(id: string | null) {
  const key = id ? `${API_BASE_URL}/accounting/ar-invoices/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<ArInvoice>(key, swrFetcher);
  return { invoice: data ?? null, error, isLoading, mutate };
}
