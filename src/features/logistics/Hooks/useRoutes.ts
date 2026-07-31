'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Route } from '../types';

export function useRoutes(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  qs.set('limit', '100');
  const key = `${API_BASE_URL}/logistics/routes?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Route>>(key, swrFetcher);

  const createRoute = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/routes`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updateRouteStatus = (id: string, status: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/routes/${id}/status`, method: 'POST', data: { status }, thenFn: () => mutate(),
  });
  const updateStopStatus = (routeId: string, stopId: string, status: string, notes?: string) => apiCallFunction({
    url: `${API_BASE_URL}/logistics/routes/${routeId}/stops/${stopId}/status`, method: 'POST', data: { status, notes }, thenFn: () => mutate(),
  });
  const uploadProofOfDelivery = (routeId: string, stopId: string, kind: 'photo' | 'signature', file: File) => {
    const fd = new FormData();
    fd.append(kind, file);
    return apiCallFunction({
      url: `${API_BASE_URL}/logistics/routes/${routeId}/stops/${stopId}/${kind}`, method: 'POST', data: fd, thenFn: () => mutate(),
    });
  };

  return { routes: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createRoute, updateRouteStatus, updateStopStatus, uploadProofOfDelivery };
}

export function useRoute(id: string | null) {
  const key = id ? `${API_BASE_URL}/logistics/routes/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Route>(key, swrFetcher);
  return { route: data ?? null, error, isLoading, mutate };
}
