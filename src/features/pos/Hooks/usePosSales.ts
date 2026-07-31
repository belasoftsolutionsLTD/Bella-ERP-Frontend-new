'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Sale, CartLine, CartDiscount, Payment, StockShortage } from '../types';

export function useCheckout() {
  const createSale = (payload: { items: Pick<CartLine, 'itemId' | 'quantity' | 'unitPrice' | 'discountAmount'>[]; cartDiscount: CartDiscount | null; payments: Payment[]; promoCode?: string; voucherCode?: string }) =>
    apiCallFunction<{ data: Sale } | { shortages: StockShortage[] }>({
      url: `${API_BASE_URL}/pos/sales`, method: 'POST', data: payload, returnResponse: true, showToast: false,
    });

  return { createSale };
}

export function usePosSales(params?: { locationId?: string; staffId?: string; status?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.staffId) qs.set('staffId', params.staffId);
  if (params?.status) qs.set('status', params.status);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/pos/sales?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Sale>>(key, swrFetcher);

  const voidSale = (id: string, reason?: string) => apiCallFunction({
    url: `${API_BASE_URL}/pos/sales/${id}/void`, method: 'POST', data: { reason }, thenFn: () => mutate(),
  });

  return { sales: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, voidSale };
}

export function usePosSale(id: string | null) {
  const key = id ? `${API_BASE_URL}/pos/sales/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Sale>(key, swrFetcher);
  return { sale: data ?? null, error, isLoading, mutate };
}
