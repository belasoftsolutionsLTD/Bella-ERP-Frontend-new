'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Enrollment, LearningPath } from '../types';

// ── HR admin — org-wide enrollments ───────────────────────────────────────────
export function useEnrollments(filters: { courseId?: string; learningPathId?: string; employeeId?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  const key = `${API_BASE_URL}/training/enrollments${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Paginated<Enrollment>>(key, swrFetcher);

  const assignTraining = (payload: { employeeIds: string[]; courseId?: string; learningPathId?: string; dueDate?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/training/enrollments`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const waiveEnrollment = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/enrollments/${id}/waive`,
    method: 'PATCH',
    thenFn: () => mutate(),
  });

  return { enrollments: data?.data ?? [], pagination: data?.pagination, isLoading, error, mutate, assignTraining, waiveEnrollment };
}

// ── Employee — own enrollments only ───────────────────────────────────────────
export function useMyEnrollments(status?: string) {
  const key = `${API_BASE_URL}/training/my/enrollments${status ? `?status=${status}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<Enrollment[]>(key, swrFetcher);

  const updateProgress = (enrollmentId: string, moduleId: string, status: 'notStarted' | 'inProgress' | 'completed') => apiCallFunction({
    url: `${API_BASE_URL}/training/my/enrollments/${enrollmentId}/progress`,
    method: 'PATCH',
    data: { moduleId, status },
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const submitQuizAttempt = (enrollmentId: string, moduleId: string, answers: { questionId: string; answer: string | string[] }[]) => apiCallFunction({
    url: `${API_BASE_URL}/training/my/enrollments/${enrollmentId}/quiz-attempt`,
    method: 'POST',
    data: { moduleId, answers },
    returnResponse: true,
    showToast: false,
    thenFn: () => mutate(),
  });

  const submitFeedback = (enrollmentId: string, payload: { rating: number; review?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/training/my/enrollments/${enrollmentId}/feedback`,
    method: 'POST',
    data: payload,
    thenFn: () => mutate(),
  });

  return { enrollments: data ?? [], isLoading, error, mutate, updateProgress, submitQuizAttempt, submitFeedback };
}

export function useMyLearningPaths() {
  const key = `${API_BASE_URL}/training/my/learning-paths`;
  const { data, error, isLoading, mutate } = useSWR<(Enrollment & { learningPath: LearningPath | null })[]>(key, swrFetcher);
  return { paths: data ?? [], isLoading, error, mutate };
}
