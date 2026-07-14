'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBalance, LeaveRequest, LeaveType } from '../types';

export function useMyLeaveTypeOptions() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/leave-types`, showToast: false,
      thenFn: (r) => setLeaveTypes(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return { leaveTypes, loading };
}

export function useMyLeaveBalances(year?: number) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/balances`, params: year ? { year } : undefined, showToast: false,
      thenFn: (r) => setBalances(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { balances, loading, refetch: fetch };
}

export function useMyLeaveRequests(status?: string) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/requests`, params: status ? { status } : undefined, showToast: false,
      thenFn: (r) => setRequests(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  const apply = (data: { leaveTypeId: string; startDate: string; endDate: string; halfDay?: { date: string; period: string }; reason?: string; attachmentUrl?: string }, onSuccess?: (result: any) => void, onError?: (message: string) => void) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/requests`, method: 'POST', data, showToast: false,
      thenFn: (r) => { fetch(); onSuccess?.(r.data); },
      catchFn: (err: any) => onError?.(err?.response?.data?.message ?? 'Failed to submit leave request.'),
    });

  const cancel = (id: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/my/requests/${id}`, method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const dispute = (id: string, disputeReason: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/my/requests/${id}/dispute`, method: 'POST', data: { disputeReason },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { requests, loading, refetch: fetch, apply, cancel, dispute };
}

export function useMyLeaveRequestDetail(id: string | null) {
  const [request, setRequest] = useState<LeaveRequest & { auditLog?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/requests/${id}`, showToast: false,
      thenFn: (r) => setRequest(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { request, loading, refetch: fetch };
}

export function useMyLeaveCalendar() {
  const [data, setData] = useState<{ mine: LeaveRequest[]; team: LeaveRequest[]; holidays: any[] }>({ mine: [], team: [], holidays: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/calendar`, showToast: false,
      thenFn: (r) => setData(r.data ?? { mine: [], team: [], holidays: [] }),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return { ...data, loading };
}
