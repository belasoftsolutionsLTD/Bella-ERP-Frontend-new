'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Company } from '../types';

export function useCompanies(params?: { search?: string }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/crm/companies?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Company>>(key, swrFetcher);

  const createCompany = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/companies`, method: 'POST', data: payload, returnResponse: true, thenFn: () => mutate(),
  });

  return { companies: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createCompany };
}

export function useCompany(id: string | null) {
  const key = id ? `${API_BASE_URL}/crm/companies/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Company>(key, swrFetcher);

  const updateCompany = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/companies/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });

  return { company: data ?? null, error, isLoading, mutate, updateCompany };
}
