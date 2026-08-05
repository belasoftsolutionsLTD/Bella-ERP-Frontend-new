'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { MyInterview } from '../types';
import type { SubmitScorecardFormValues } from '../schemas';

export function useMyInterviews() {
  const key = `${API_BASE_URL}/recruitment/my-interviews`;
  const { data, error, isLoading, mutate } = useSWR<MyInterview[]>(key, swrFetcher);

  const submitScorecard = (applicationId: string, payload: SubmitScorecardFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/scorecards`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { interviews: data ?? [], isLoading, error, mutate, submitScorecard };
}
