'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface HeadcountAnalytics {
  total: number;
  byDepartment: { department: string; count: number }[];
  byEmploymentType: { employmentType: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface TurnoverPoint { month: string; hires: number; terminations: number }

export interface TenureRow { department: string; averageTenureYears: number; count: number }

export interface DemographicsAnalytics {
  byGender: { gender: string; count: number }[];
  byNationality: { nationality: string; count: number }[];
}

export interface UpcomingEmployee {
  _id: string; fullName: string; staffNumber: string; department: string;
  daysRemaining: number; bucket: 30 | 60 | 90;
  probationEndDate?: string; passportExpiryDate?: string; contractEndDate?: string;
}

export interface UpcomingAnalytics {
  probationEndings: UpcomingEmployee[];
  passportExpiries: UpcomingEmployee[];
  contractEndings: UpcomingEmployee[];
}

export function useWorkforceAnalytics() {
  const [headcount, setHeadcount] = useState<HeadcountAnalytics | null>(null);
  const [turnover, setTurnover] = useState<TurnoverPoint[]>([]);
  const [tenure, setTenure] = useState<TenureRow[]>([]);
  const [demographics, setDemographics] = useState<DemographicsAnalytics | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiCallFunction<any>({ url: `${API_BASE_URL}/employees/analytics/headcount`, showToast: false, thenFn: r => setHeadcount(r.data ?? null) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/employees/analytics/turnover`, showToast: false, thenFn: r => setTurnover(r.data ?? []) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/employees/analytics/tenure`, showToast: false, thenFn: r => setTenure(r.data ?? []) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/employees/analytics/demographics`, showToast: false, thenFn: r => setDemographics(r.data ?? null) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/employees/analytics/upcoming`, showToast: false, thenFn: r => setUpcoming(r.data ?? null) }),
    ]).finally(() => setLoading(false));
  }, []);

  return { headcount, turnover, tenure, demographics, upcoming, loading };
}
