'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Application } from '../types';
import type { ExtendOfferFormValues } from '../schemas';

interface ApplicationsResponse {
  applications: Application[];
  byStage: Record<string, Application[]>;
}

export function useApplications(requisitionId?: string) {
  const key = requisitionId ? `${API_BASE_URL}/recruitment/requisitions/${requisitionId}/applications` : null;
  const { data, error, isLoading, mutate } = useSWR<ApplicationsResponse>(key, swrFetcher);

  const moveStage = (applicationId: string, stageId: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/stage`,
    method: 'PATCH',
    data: { stageId },
    thenFn: () => mutate(),
  });

  const updateStatus = (applicationId: string, status: string, rejectionReason?: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/status`,
    method: 'PATCH',
    data: { status, rejectionReason },
    thenFn: () => mutate(),
  });

  const extendOffer = (applicationId: string, payload: ExtendOfferFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/offer`,
    method: 'POST',
    data: payload,
    thenFn: () => mutate(),
  });

  const respondToOffer = (applicationId: string, status: 'accepted' | 'declined') => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/offer`,
    method: 'PATCH',
    data: { status },
    thenFn: () => mutate(),
  });

  const assignInterviewer = (applicationId: string, stageId: string, interviewerId: string, scheduledAt: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/interviewers`,
    method: 'POST',
    data: { stageId, interviewerId, scheduledAt },
    thenFn: () => mutate(),
  });

  const unassignInterviewer = (applicationId: string, stageId: string, interviewerId: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/interviewers/${stageId}/${interviewerId}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  const sendInterviewReminder = (applicationId: string, stageId: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/applications/${applicationId}/interviewers/${stageId}/remind`,
    method: 'POST',
  });

  return {
    applications: data?.applications ?? [],
    byStage: data?.byStage ?? {},
    isLoading,
    error,
    mutate,
    moveStage,
    updateStatus,
    extendOffer,
    respondToOffer,
    assignInterviewer,
    unassignInterviewer,
    sendInterviewReminder,
  };
}
