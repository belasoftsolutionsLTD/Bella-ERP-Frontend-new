'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { Course } from '../types';
import type { CreateCourseFormValues, UpdateCourseFormValues } from '../schemas';

export function useCourses(filters: { category?: string; status?: string; isMandatory?: boolean; author?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  const qs = params.toString();
  const key = `${API_BASE_URL}/training/courses${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Paginated<Course>>(key, swrFetcher);

  const createCourse = (payload: CreateCourseFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/courses`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { courses: data?.data ?? [], pagination: data?.pagination, isLoading, error, mutate, createCourse };
}

export function useCourse(id?: string) {
  const key = id ? `${API_BASE_URL}/training/courses/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<Course & { modules: any[] }>(key, swrFetcher);

  const updateCourse = (payload: UpdateCourseFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${id}`,
    method: 'PATCH',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const publishCourse = () => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${id}/publish`,
    method: 'POST',
    thenFn: () => mutate(),
  });

  const archiveCourse = () => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  const addAuthor = (authorId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${id}/authors`,
    method: 'POST',
    data: { authorId },
    thenFn: () => mutate(),
  });

  const addModule = (payload: { title: string; type: string; order?: number; content?: any; isRequired?: boolean; minimumPassScore?: number }) => apiCallFunction({
    url: `${API_BASE_URL}/training/courses/${id}/modules`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateModule = (moduleId: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/training/modules/${moduleId}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  const deleteModule = (moduleId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/modules/${moduleId}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  const createQuiz = (moduleId: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/training/modules/${moduleId}/quiz`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateQuiz = (quizId: string, payload: Record<string, unknown>) => apiCallFunction({
    url: `${API_BASE_URL}/training/quizzes/${quizId}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  return {
    course: data, isLoading, error, mutate,
    updateCourse, publishCourse, archiveCourse, addAuthor,
    addModule, updateModule, deleteModule, createQuiz, updateQuiz,
  };
}
