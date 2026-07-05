'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Scorecard } from '../types';
import type { SubmitScorecardFormValues } from '../schemas';

export function useScorecards(applicationId?: string) {
  const key = applicationId ? `${API_BASE_URL}/recruitment/applications/${applicationId}/scorecards` : null;
  const { data, error, isLoading, mutate } = useSWR<Scorecard[]>(key, swrFetcher);

  const submitScorecard = (payload: SubmitScorecardFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/scorecards`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { scorecards: data ?? [], isLoading, error, mutate, submitScorecard };
}
