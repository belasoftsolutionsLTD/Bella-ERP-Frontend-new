'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

interface Overview {
  openRequisitions: number;
  activeCandidates: number;
  offersOut: number;
  hiresThisMonth: number;
}

interface FunnelStage {
  stageId: string;
  stageName: string;
  count: number;
  conversionRate: number;
}

interface TimeToFillRow {
  department: string;
  avgDaysToFill: number;
  hires: number;
}

interface TimeInStageRow {
  stageName: string;
  avgDays: number;
  sampleSize: number;
}

interface SourceEffectivenessRow {
  source: string;
  applications: number;
  hires: number;
  conversionRate: number;
}

interface OfferAcceptanceRow {
  month: string;
  offered: number;
  accepted: number;
  declined: number;
  acceptanceRate: number;
}

export function useRecruitmentOverview() {
  const { data, error, isLoading } = useSWR<Overview>(`${API_BASE_URL}/recruitment/analytics/overview`, swrFetcher);
  return { overview: data, isLoading, error };
}

export function useRequisitionFunnel(requisitionId?: string) {
  const key = requisitionId ? `${API_BASE_URL}/recruitment/analytics/funnel/${requisitionId}` : null;
  const { data, error, isLoading } = useSWR<{ totalApplicants: number; funnel: FunnelStage[] }>(key, swrFetcher);
  return { totalApplicants: data?.totalApplicants ?? 0, funnel: data?.funnel ?? [], isLoading, error };
}

export function useTimeToFill() {
  const { data, error, isLoading } = useSWR<TimeToFillRow[]>(`${API_BASE_URL}/recruitment/analytics/time-to-fill`, swrFetcher);
  return { data: data ?? [], isLoading, error };
}

export function useTimeInStage() {
  const { data, error, isLoading } = useSWR<TimeInStageRow[]>(`${API_BASE_URL}/recruitment/analytics/time-in-stage`, swrFetcher);
  return { data: data ?? [], isLoading, error };
}

export function useSourceEffectiveness() {
  const { data, error, isLoading } = useSWR<SourceEffectivenessRow[]>(`${API_BASE_URL}/recruitment/analytics/source-effectiveness`, swrFetcher);
  return { data: data ?? [], isLoading, error };
}

export function useOfferAcceptance() {
  const { data, error, isLoading } = useSWR<OfferAcceptanceRow[]>(`${API_BASE_URL}/recruitment/analytics/offer-acceptance`, swrFetcher);
  return { data: data ?? [], isLoading, error };
}
