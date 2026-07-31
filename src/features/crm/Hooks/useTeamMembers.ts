'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

interface TeamMember { _id: string; name: string; email: string; role: string }

export function useTeamMembers() {
  const { data, isLoading } = useSWR<TeamMember[]>(`${API_BASE_URL}/crm/team-members`, swrFetcher);
  return { members: data ?? [], isLoading };
}
