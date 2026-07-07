'use client';

import useSWR from 'swr';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';
import type { Certificate, ExternalCertificate } from '../types';
import type { UploadExternalCertFormValues } from '../schemas';

export function useMyCertificates() {
  const key = `${API_BASE_URL}/training/my/certificates`;
  const { data, error, isLoading, mutate } = useSWR<Certificate[]>(key, swrFetcher);

  const generateCertificate = (enrollmentId: string) => apiCallFunction({
    url: `${API_BASE_URL}/training/my/certificates/generate/${enrollmentId}`,
    method: 'POST',
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { certificates: data ?? [], isLoading, error, mutate, generateCertificate };
}

export function useMyExternalCertificates() {
  const key = `${API_BASE_URL}/training/my/external-certificates`;
  const { data, error, isLoading, mutate } = useSWR<ExternalCertificate[]>(key, swrFetcher);

  const uploadCertificate = (payload: UploadExternalCertFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/training/my/external-certificates`,
    method: 'POST',
    data: payload,
    returnResponse: true,
    thenFn: () => mutate(),
  });

  return { certificates: data ?? [], isLoading, error, mutate, uploadCertificate };
}

export function useExternalCertificates(status?: string) {
  const key = `${API_BASE_URL}/training/external-certificates${status ? `?status=${status}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<(ExternalCertificate & { employee: { _id: string; name: string; department: string } | null })[]>(key, swrFetcher);

  const verifyCertificate = (id: string, status: 'verified' | 'rejected') => apiCallFunction({
    url: `${API_BASE_URL}/training/external-certificates/${id}/verify`,
    method: 'PATCH',
    data: { status },
    thenFn: () => mutate(),
  });

  return { certificates: data ?? [], isLoading, error, mutate, verifyCertificate };
}
