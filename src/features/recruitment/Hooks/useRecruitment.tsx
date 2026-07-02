'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface InterviewSchedule {
  _id: string;
  scheduledDate: string;
  scheduledTime: string;
  location?: string;
  interviewNotes?: string;
}

export interface Applicant {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  positionApplied?: string;
  positionTitle?: string;
  stage: string;
  source?: string;
  approvalStatus?: string;
  cvPath?: string;
  cvFilename?: string;
  cvFilePath?: string;
  coverLetter?: string;
  interviewNotes?: string;
  interviewScheduleId?: string;
  interviewSchedule?: InterviewSchedule;
  offeredSalary?: number;
  offerLetterSentAt?: string;
  appliedAt?: string;
  createdAt: string;
}

export function useRecruitment() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/applicants`,
      showToast: false,
      thenFn: res => setApplicants(res.data?.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const moveStage = (id: string, stage: string, extra?: Record<string, unknown>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${id}/stage`,
      method: 'PATCH',
      data: { stage, ...extra },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const sendOfferLetter = (id: string, data: { offeredSalary?: number; startDate?: string }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${id}/offer-letter`,
      method: 'POST',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const bulkMoveStage = (ids: string[], stage: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/bulk-stage`,
      method: 'POST',
      data: { ids, stage },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const updateApplicant = (id: string, data: Partial<Applicant>, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${id}`,
      method: 'PUT',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const deleteApplicant = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${id}`,
      method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const addNote = (id: string, note: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${id}/note`,
      method: 'POST',
      data: { note },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  useEffect(() => { fetch(); }, [fetch]);

  return { applicants, loading, error, refetch: fetch, moveStage, bulkMoveStage, sendOfferLetter, updateApplicant, deleteApplicant, addNote };
}
