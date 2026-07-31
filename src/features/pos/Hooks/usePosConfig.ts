'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { PromoCode, Voucher, PosStaffAccessRow, DailySummary, SalesByStaffRow } from '../types';
import { downloadFile } from '@/functions/downloadFile';

export function usePromoCodes(activeOnly = false) {
  const key = `${API_BASE_URL}/pos/promo-codes${activeOnly ? '?activeOnly=true' : ''}`;
  const { data, error, isLoading, mutate } = useSWR<PromoCode[]>(key, swrFetcher);

  const createCode = (payload: { code: string; discountType: string; discountValue: number; expiresAt?: string }) => apiCallFunction({
    url: key, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateCode = (id: string, payload: Partial<PromoCode>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteCode = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { promoCodes: data ?? [], error, isLoading, mutate, createCode, updateCode, deleteCode };
}

export function useVouchers(activeOnly = false) {
  const key = `${API_BASE_URL}/pos/vouchers${activeOnly ? '?activeOnly=true' : ''}`;
  const { data, error, isLoading, mutate } = useSWR<Voucher[]>(key, swrFetcher);

  const createVoucher = (payload: { code: string; value: number; expiresAt?: string }) => apiCallFunction({
    url: key, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateVoucher = (id: string, payload: Partial<Voucher>) => apiCallFunction({
    url: `${key}/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteVoucher = (id: string) => apiCallFunction({
    url: `${key}/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { vouchers: data ?? [], error, isLoading, mutate, createVoucher, updateVoucher, deleteVoucher };
}

export function usePosStaffAccess() {
  const key = `${API_BASE_URL}/pos/staff-access`;
  const { data, error, isLoading, mutate } = useSWR<PosStaffAccessRow[]>(key, swrFetcher);

  const setLocations = (userId: string, locationIds: string[]) => apiCallFunction({
    url: `${key}/${userId}`, method: 'PATCH', data: { locationIds }, thenFn: () => mutate(),
  });

  return { staff: data ?? [], error, isLoading, mutate, setLocations };
}

export function useDailySummary(params?: { locationId?: string; date?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.startDate || params?.endDate) {
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
  } else if (params?.date) {
    qs.set('date', params.date);
  }
  const key = `${API_BASE_URL}/pos/reports/daily-summary?${qs.toString()}`;
  const { data, error, isLoading } = useSWR<DailySummary>(key, swrFetcher);
  return { summary: data ?? null, error, isLoading };
}

export function useSalesByStaff(params?: { locationId?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const key = `${API_BASE_URL}/pos/reports/sales-by-staff?${qs.toString()}`;
  const { data, error, isLoading } = useSWR<SalesByStaffRow[]>(key, swrFetcher);
  return { rows: data ?? [], error, isLoading };
}

export function exportSalesCSV(params: { locationId?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return downloadFile(`${API_BASE_URL}/pos/sales/export?${qs.toString()}`, 'pos-sales.csv');
}
