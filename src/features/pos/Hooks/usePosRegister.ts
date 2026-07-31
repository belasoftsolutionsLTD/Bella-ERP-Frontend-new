'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { PosAccessLevel, RegisterSession } from '../types';

export function usePosAccess() {
  const { data, isLoading } = useSWR<{ level: PosAccessLevel }>(`${API_BASE_URL}/pos/my-access`, swrFetcher);
  return { level: data?.level ?? null, isLoading };
}

export function useCurrentRegisterSession() {
  const key = `${API_BASE_URL}/pos/register/current`;
  const { data, error, isLoading, mutate } = useSWR<RegisterSession | null>(key, swrFetcher);

  const openRegister = (locationId: string, openingFloat: number) => apiCallFunction({
    url: `${API_BASE_URL}/pos/register/open`, method: 'POST', data: { locationId, openingFloat }, thenFn: () => mutate(),
  });
  const closeRegister = (closingCount: number) => apiCallFunction({
    url: `${API_BASE_URL}/pos/register/close`, method: 'POST', data: { closingCount },
    returnResponse: true, thenFn: () => mutate(),
  });

  return { session: data ?? null, error, isLoading, mutate, openRegister, closeRegister };
}

export function useRegisterSessions(params?: { locationId?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.locationId) qs.set('locationId', params.locationId);
  if (params?.status) qs.set('status', params.status);
  const key = `${API_BASE_URL}/pos/register/sessions?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<RegisterSession[]>(key, swrFetcher);
  return { sessions: data ?? [], error, isLoading, mutate };
}
