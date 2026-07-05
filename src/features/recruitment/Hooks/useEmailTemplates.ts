'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { EmailTemplate, EmailTrigger } from '../types';

export function useEmailTemplates(trigger?: EmailTrigger) {
  const key = `${API_BASE_URL}/recruitment/email-templates${trigger ? `?trigger=${trigger}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<EmailTemplate[]>(key, swrFetcher);

  const createTemplate = (payload: { name: string; trigger: EmailTrigger; subject: string; body: string }) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/email-templates`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  const updateTemplate = (id: string, payload: Partial<{ name: string; trigger: EmailTrigger; subject: string; body: string }>) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/email-templates/${id}`,
    method: 'PATCH',
    data: payload,
    thenFn: () => mutate(),
  });

  const deleteTemplate = (id: string) => apiCallFunction({
    url: `${API_BASE_URL}/recruitment/email-templates/${id}`,
    method: 'DELETE',
    thenFn: () => mutate(),
  });

  return { templates: data ?? [], isLoading, error, mutate, createTemplate, updateTemplate, deleteTemplate };
}
