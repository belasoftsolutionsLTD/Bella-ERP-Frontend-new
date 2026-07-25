'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Course, CourseModule, Enrollment, QuizForLearner } from '../types';

export function useCatalog(filters: { category?: string; difficultyLevel?: string; skill?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  const key = `${API_BASE_URL}/training/catalog${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<(Course & { myEnrollment: Enrollment | null })[]>(key, swrFetcher);

  // Self-enrollment for published, non-mandatory courses whose targetRoles/
  // targetDepartments match the learner — see selfEnroll on the backend for the
  // authoritative eligibility check (this just triggers it and refreshes the list).
  const enrollInCourse = (courseId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/catalog/${courseId}/enroll`,
    method: 'POST',
    thenFn: () => mutate(),
  });

  return { courses: data ?? [], isLoading, error, enrollInCourse };
}

export function useCatalogCourse(id?: string) {
  const key = id ? `${API_BASE_URL}/training/catalog/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Course & { modules: CourseModule[]; myEnrollment: Enrollment | null }>(key, swrFetcher);
  return { course: data, isLoading, error, mutate };
}

export function useModuleQuiz(moduleId?: string) {
  const key = moduleId ? `${API_BASE_URL}/training/my/modules/${moduleId}/quiz` : null;
  const { data, error, isLoading } = useSWR<QuizForLearner>(key, swrFetcher);
  return { quiz: data, isLoading, error };
}
