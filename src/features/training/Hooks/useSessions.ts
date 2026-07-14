'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { TrainingSession } from '../types';
import type { CreateSessionFormValues } from '../schemas';

// HR-side: manage sessions for one instructor-led course.
export function useCourseSessions(courseId: string | undefined) {
  const key = courseId ? `${API_BASE_URL}/training/courses/${courseId}/sessions` : null;
  const { data, error, isLoading, mutate } = useSWR<TrainingSession[]>(key, swrFetcher);

  const createSession = (payload: CreateSessionFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${courseId}/sessions`,
    method: 'POST', data: payload, returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateSession = (id: string, payload: Partial<CreateSessionFormValues> & { status?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/training/sessions/${id}`,
    method: 'PATCH', data: payload,
    thenFn: () => mutate(),
  });

  const deleteSession = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/sessions/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  const markAttendance = (id: string, attendance: { employeeId: string; attended: boolean }[]) => apiCallFunction({
    url: `${API_BASE_URL}/training/sessions/${id}/attendance`,
    method: 'PATCH', data: { attendance },
    thenFn: () => mutate(),
  });

  return { sessions: data ?? [], isLoading, error, mutate, createSession, updateSession, deleteSession, markAttendance };
}

// Learner-side: my own registered sessions across all instructor-led courses.
export function useMySessions() {
  const key = `${API_BASE_URL}/training/my/sessions`;
  const { data, error, isLoading, mutate } = useSWR<TrainingSession[]>(key, swrFetcher);

  const register = (sessionId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/sessions/${sessionId}/register`,
    method: 'POST', returnResponse: true,
    thenFn: () => mutate(),
  });

  const unregister = (sessionId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/sessions/${sessionId}/register`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  return { sessions: data ?? [], isLoading, error, mutate, register, unregister };
}

// Learner-side: sessions available for one specific course (to register for one of them).
export function useCourseSessionsForLearner(courseId: string | undefined) {
  const key = courseId ? `${API_BASE_URL}/training/courses/${courseId}/sessions` : null;
  const { data, error, isLoading, mutate } = useSWR<TrainingSession[]>(key, swrFetcher);
  return { sessions: data ?? [], isLoading, error, mutate };
}
