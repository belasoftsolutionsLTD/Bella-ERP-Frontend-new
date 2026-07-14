'use client';

import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface AttendanceOverview {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  notClockedIn: number;
  total: number;
}

export interface SummaryRow {
  key: string;
  label: string;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  totalDays: number;
  attendanceRate: number;
}

export interface OvertimeRow {
  key: string;
  label: string;
  overtimeMinutes: number;
  overtimeHours: number;
}

export interface LateTrendPoint { date: string; count: number }
export interface LateLeaderboardRow {
  employeeId: string;
  employee: { fullName: string; department?: string } | null;
  lateCount: number;
}

export interface AbsenteeismRow {
  department: string;
  absentDays: number;
  totalDays: number;
  absenteeismRate: number;
}

export function useAttendanceAnalytics(groupBy: 'employee' | 'department' = 'department') {
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRow[]>([]);
  const [lateTrend, setLateTrend] = useState<LateTrendPoint[]>([]);
  const [lateLeaderboard, setLateLeaderboard] = useState<LateLeaderboardRow[]>([]);
  const [absenteeism, setAbsenteeism] = useState<AbsenteeismRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/analytics/overview`, showToast: false, thenFn: (r) => setOverview(r.data ?? null) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/analytics/summary?groupBy=${groupBy}`, showToast: false, thenFn: (r) => setSummary(r.data ?? []) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/analytics/overtime?groupBy=${groupBy}`, showToast: false, thenFn: (r) => setOvertime(r.data ?? []) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/analytics/late`, showToast: false, thenFn: (r) => { setLateTrend(r.data?.trend ?? []); setLateLeaderboard(r.data?.leaderboard ?? []); } }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/analytics/absenteeism`, showToast: false, thenFn: (r) => setAbsenteeism(r.data ?? []) }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ]).finally(() => setLoading(false));
  }, [groupBy]);

  return { overview, summary, overtime, lateTrend, lateLeaderboard, absenteeism, loading };
}
