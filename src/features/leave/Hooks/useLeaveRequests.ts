'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveRequest } from '../types';

export function useLeaveRequests(filters: { status?: string; leaveTypeId?: string; department?: string; search?: string } = {}) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.leaveTypeId) params.leaveTypeId = filters.leaveTypeId;
    if (filters.department) params.department = filters.department;
    if (filters.search) params.search = filters.search;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests`, params, showToast: false,
      thenFn: (r) => setRequests(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.leaveTypeId, filters.department, filters.search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { requests, loading, refetch: fetch };
}

export function useLeaveRequest(id: string | null) {
  const [request, setRequest] = useState<LeaveRequest & { auditLog?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests/${id}`, showToast: false,
      thenFn: (r) => setRequest(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const approve = (comment?: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/approve`, method: 'PATCH', data: { comment },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const reject = (rejectionReason: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/reject`, method: 'PATCH', data: { rejectionReason },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const cancel = (onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/cancel`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const revoke = (onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/revoke`, method: 'PATCH',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const resolveDispute = (resolution: 'upheld' | 'overturned', comment?: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/resolve-dispute`, method: 'PATCH', data: { resolution, comment },
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { request, loading, refetch: fetch, approve, reject, cancel, revoke, resolveDispute };
}
