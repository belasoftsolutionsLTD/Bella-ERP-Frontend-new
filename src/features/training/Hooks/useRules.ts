'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { TrainingAssignmentRule } from '../types';
import type { CreateAssignmentRuleFormValues } from '../schemas';

export function useRules() {
  const key = `${API_BASE_URL}/training/rules`;
  const { data, error, isLoading, mutate } = useSWR<TrainingAssignmentRule[]>(key, swrFetcher);

  const createRule = (payload: CreateAssignmentRuleFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/rules`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateRule = (id: string, payload: Partial<CreateAssignmentRuleFormValues>) => apiCallFunction({
    url: `${API_BASE_URL}/training/rules/${id}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  const runRuleNow = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/rules/${id}/run`,
    method: 'POST',
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { rules: data ?? [], isLoading, error, mutate, createRule, updateRule, runRuleNow };
}
