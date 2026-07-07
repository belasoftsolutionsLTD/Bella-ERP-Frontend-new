'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

interface Overview {
  publishedCourses: number;
  activeEnrollments: number;
  orgCompletionRate: number;
  overdueCount: number;
  certsExpiringIn30Days: number;
}

interface ComplianceCourseRow {
  courseId: string;
  title: string;
  targetRoles: string[];
  targetDepartments: string[];
  enrolled: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

interface CertExpiryRow {
  employeeId: string;
  employeeName: string;
  courseTitle: string;
  certificateNumber: string;
  expiresAt: string;
  daysRemaining: number;
}

interface CourseAnalytics {
  totalEnrollments: number;
  funnel: { moduleId: string; title: string; completedCount: number; dropOffRate: number }[];
  avgQuizScore: number | null;
  ratingBreakdown: { rating: number; count: number }[];
  avgTimeToCompleteDays: number | null;
}

interface LeaderboardRow {
  rank: number;
  employeeId: string;
  name: string;
  department: string | null;
  coursesCompleted: number;
  certificatesEarned: number;
}

export function useTrainingOverview() {
  const { data, error, isLoading } = useSWR<Overview>(`${API_BASE_URL}/training/analytics/overview`, swrFetcher);
  return { overview: data, isLoading, error };
}

export function useComplianceReport() {
  const { data, error, isLoading } = useSWR<{ mandatoryCourses: ComplianceCourseRow[]; certExpiry: CertExpiryRow[] }>(`${API_BASE_URL}/training/analytics/compliance`, swrFetcher);

  const sendReminder = (employeeId?: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/analytics/compliance/remind`,
    method: 'POST',
    data: employeeId ? { employeeId } : {},
  });

  return { mandatoryCourses: data?.mandatoryCourses ?? [], certExpiry: data?.certExpiry ?? [], isLoading, error, sendReminder };
}

export function useCourseAnalytics(courseId?: string) {
  const key = courseId ? `${API_BASE_URL}/training/analytics/course/${courseId}` : null;
  const { data, error, isLoading } = useSWR<CourseAnalytics>(key, swrFetcher);
  return { data, isLoading, error };
}

export function useLeaderboard() {
  const { data, error, isLoading } = useSWR<LeaderboardRow[]>(`${API_BASE_URL}/training/analytics/leaderboard`, swrFetcher);
  return { leaderboard: data ?? [], isLoading, error };
}
