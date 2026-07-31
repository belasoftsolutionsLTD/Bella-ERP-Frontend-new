'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { ApBill } from '../types';

export function useApBills(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/accounting/ap-bills?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<ApBill>>(key, swrFetcher);

  const createBill = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ap-bills`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const approveBill = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ap-bills/${id}/approve`, method: 'POST', thenFn: () => mutate(),
  });
  const scheduleBill = (id: string, scheduledPaymentDate: string) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ap-bills/${id}/schedule`, method: 'POST', data: { scheduledPaymentDate }, thenFn: () => mutate(),
  });
  const payBill = (id: string, payload: { paymentMethod: string; paymentReference: string }) => apiCallFunction({
    url: `${API_BASE_URL}/accounting/ap-bills/${id}/pay`, method: 'POST', data: payload, thenFn: () => mutate(),
  });

  return { bills: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createBill, approveBill, scheduleBill, payBill };
}
