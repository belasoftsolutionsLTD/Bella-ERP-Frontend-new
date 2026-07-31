'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { CustomFieldDef, Pipeline, CustomFieldAppliesTo } from '../types';

export function useCustomFieldDefs(appliesTo?: CustomFieldAppliesTo) {
  const key = `${API_BASE_URL}/crm/custom-fields${appliesTo ? `?appliesTo=${appliesTo}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<CustomFieldDef[]>(key, swrFetcher);

  const createDef = (payload: { name: string; fieldType: string; appliesTo: string; options?: string[] }) => apiCallFunction({
    url: `${API_BASE_URL}/crm/custom-fields`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const deleteDef = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/custom-fields/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { fieldDefs: data ?? [], error, isLoading, mutate, createDef, deleteDef };
}

export function usePipelines() {
  const key = `${API_BASE_URL}/crm/pipelines`;
  const { data, error, isLoading, mutate } = useSWR<Pipeline[]>(key, swrFetcher);

  const createPipeline = (payload: { name: string; stages?: { name: string; isWon?: boolean; isLost?: boolean }[] }) => apiCallFunction({
    url: `${API_BASE_URL}/crm/pipelines`, method: 'POST', data: payload, thenFn: () => mutate(),
  });
  const updatePipeline = (id: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/pipelines/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const deletePipeline = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/pipelines/${id}`, method: 'DELETE', thenFn: () => mutate(),
  });

  return { pipelines: data ?? [], error, isLoading, mutate, createPipeline, updatePipeline, deletePipeline };
}
