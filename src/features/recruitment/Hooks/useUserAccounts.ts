'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Reuses the existing user-accounts endpoint (features/accounts) so hiring-manager
// and approver pickers reference real user accounts that notifications can reach.
export function useUserAccounts() {
  const { data, error, isLoading } = useSWR<UserAccount[]>(`${API_BASE_URL}/auth/accounts`, swrFetcher);
  return { accounts: data ?? [], isLoading, error };
}
