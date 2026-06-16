'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  year: number;
  balances: Record<string, { allocated: number | null; used: number; remaining: number | null }>;
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  employee?: { fullName: string; staffNumber: string; department: string } | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'disputed';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  disputeReason?: string;
  disputedAt?: string;
  createdAt: string;
}

export function useLeave(employeeId?: string) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (employeeId) params.employeeId = employeeId;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests`,
      params,
      showToast: false,
      thenFn: (res) => setRequests(res.data?.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId]);

  const fetchBalance = useCallback(() => {
    if (!employeeId) return;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/balances/${employeeId}`,
      showToast: false,
      thenFn: (res) => setBalance(res.data ?? res),
      catchFn: () => {},
    });
  }, [employeeId]);

  const approve = (id: string, comments?: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/leave/requests/${id}/approve`, method: 'PATCH', data: { comments }, thenFn: () => fetchRequests() });

  const reject = (id: string, comments?: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/leave/requests/${id}/reject`, method: 'PATCH', data: { comments }, thenFn: () => fetchRequests() });

  const revoke = (id: string, comments?: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/leave/requests/${id}/revoke`, method: 'PATCH', data: { comments }, thenFn: () => fetchRequests() });

  const resolveDispute = (id: string, resolution: 'approve' | 'reject', comments?: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/leave/requests/${id}/resolve-dispute`, method: 'PATCH', data: { resolution, comments }, thenFn: () => fetchRequests() });

  const deleteRequest = (id: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/leave/requests/${id}`, method: 'DELETE', thenFn: () => fetchRequests() });

  useEffect(() => { fetchRequests(); fetchBalance(); }, [fetchRequests, fetchBalance]);
  return { requests, balance, loading, error, refetch: fetchRequests, approve, reject, revoke, resolveDispute, deleteRequest };
}
