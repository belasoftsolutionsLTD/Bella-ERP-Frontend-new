'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Contact, TimelineEntry, PosSaleSummary } from '../types';

export function useContacts(params?: { search?: string; companyId?: string; tag?: string }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.companyId) qs.set('companyId', params.companyId);
  if (params?.tag) qs.set('tag', params.tag);
  qs.set('limit', '50');
  const key = `${API_BASE_URL}/crm/contacts?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Paginated<Contact>>(key, swrFetcher);

  const createContact = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/contacts`, method: 'POST', data: payload, returnResponse: true, thenFn: () => mutate(),
  });

  return { contacts: data?.data ?? [], pagination: data?.pagination, error, isLoading, mutate, createContact };
}

export function useContact(id: string | null) {
  const key = id ? `${API_BASE_URL}/crm/contacts/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Contact>(key, swrFetcher);

  const updateContact = (payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/contacts/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deleteContact = () => apiCallFunction({ url: `${API_BASE_URL}/crm/contacts/${id}`, method: 'DELETE' });

  return { contact: data ?? null, error, isLoading, mutate, updateContact, deleteContact };
}

export function useContactTimeline(id: string | null) {
  const key = id ? `${API_BASE_URL}/crm/contacts/${id}/timeline` : null;
  const { data, error, isLoading, mutate } = useSWR<TimelineEntry[]>(key, swrFetcher);
  return { timeline: data ?? [], error, isLoading, mutate };
}

export function useContactSales(id: string | null) {
  const key = id ? `${API_BASE_URL}/crm/contacts/${id}/sales` : null;
  const { data, error, isLoading } = useSWR<PosSaleSummary[]>(key, swrFetcher);
  return { sales: data ?? [], error, isLoading };
}
