'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { CrmAccessLevel } from '../types';

export function useCrmAccess() {
  const { data, isLoading } = useSWR<{ level: CrmAccessLevel }>(`${API_BASE_URL}/crm/my-access`, swrFetcher);
  return { level: data?.level ?? null, isLoading };
}
