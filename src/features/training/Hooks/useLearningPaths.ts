'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { LearningPath } from '../types';
import type { CreateLearningPathFormValues, UpdateLearningPathFormValues } from '../schemas';

export function useLearningPaths(status?: string) {
  const key = `${API_BASE_URL}/training/learning-paths${status ? `?status=${status}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<LearningPath[]>(key, swrFetcher);

  const createPath = (payload: CreateLearningPathFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/learning-paths`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { paths: data ?? [], isLoading, error, mutate, createPath };
}

export function useLearningPath(id?: string) {
  const key = id ? `${API_BASE_URL}/training/learning-paths/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<LearningPath>(key, swrFetcher);

  const updatePath = (payload: UpdateLearningPathFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/learning-paths/${id}`,
    method: 'PATCH',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const archivePath = () => apiCallFunction({
    url: `${API_BASE_URL}/training/learning-paths/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  return { path: data, isLoading, error, mutate, updatePath, archivePath };
}
