'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'remote';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  mode?: 'onsite' | 'offsite';
  selfMarked?: boolean;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInLat?: number;
  checkInLng?: number;
}

export interface AttendanceGroup {
  employeeId: string;
  employeeName?: string;
  staffNumber?: string;
  department?: string;
  records: AttendanceRecord[];
}

export function useAttendance(filters: { month?: number; year?: number; department?: string; employeeId?: string } = {}) {
  const [data, setData] = useState<AttendanceGroup[]>([]);
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance`,
      params,
      showToast: false,
      thenFn: (res) => setData(res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [JSON.stringify(filters)]);

  const fetchAlerts = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/alerts`,
      showToast: false,
      thenFn: (res) => setAlerts(res.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const mark = (payload: Partial<AttendanceRecord>) =>
    apiCallFunction({ url: `${API_BASE_URL}/attendance`, method: 'POST', data: payload, thenFn: () => fetch() });

  useEffect(() => { fetch(); fetchAlerts(); }, [fetch, fetchAlerts]);
  return { data, alerts, loading, error, refetch: fetch, mark };
}
