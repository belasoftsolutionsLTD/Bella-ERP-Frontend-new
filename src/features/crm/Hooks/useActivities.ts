'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Activity, ActivityType, TaskPriority } from '../types';

export function useLogActivity() {
  const logActivity = (payload: { contactId: string; dealId?: string; type: ActivityType; subject: string; notes?: string }) => apiCallFunction({
    url: `${API_BASE_URL}/crm/activities`, method: 'POST', data: payload,
  });
  const createTask = (payload: { contactId: string; dealId?: string; subject: string; notes?: string; dueDate: string; assignedTo?: string; priority?: TaskPriority; subtasks?: { title: string }[] }) => apiCallFunction({
    url: `${API_BASE_URL}/crm/tasks`, method: 'POST', data: payload,
  });
  return { logActivity, createTask };
}

export function useTasks(filter?: 'overdue' | 'upcoming', params?: { priority?: TaskPriority }) {
  const qs = new URLSearchParams();
  if (filter) qs.set('filter', filter);
  if (params?.priority) qs.set('priority', params.priority);
  const key = `${API_BASE_URL}/crm/tasks?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Activity[]>(key, swrFetcher);

  const completeTask = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/tasks/${id}/complete`, method: 'PATCH', data: { completed: true }, thenFn: () => mutate(),
  });
  const updateTask = (id: string, payload: Partial<Pick<Activity, 'subject' | 'notes' | 'dueDate' | 'priority' | 'assignedTo'>>) => apiCallFunction({
    url: `${API_BASE_URL}/crm/tasks/${id}`, method: 'PUT', data: payload, thenFn: () => mutate(),
  });
  const addSubtask = (id: string, title: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/tasks/${id}/subtasks`, method: 'POST', data: { title }, thenFn: () => mutate(),
  });
  const toggleSubtask = (id: string, subId: string) => apiCallFunction({
    url: `${API_BASE_URL}/crm/tasks/${id}/subtasks/${subId}`, method: 'PATCH', thenFn: () => mutate(),
  });

  return { tasks: data ?? [], error, isLoading, mutate, completeTask, updateTask, addSubtask, toggleSubtask };
}
