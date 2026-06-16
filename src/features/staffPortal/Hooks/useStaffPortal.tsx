'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface StaffEmployee {
  _id: string;
  fullName: string;
  staffNumber: string;
  designation: string;
  department: string;
  status: string;
  email: string;
  phone?: string;
  dateOfHire: string;
  staffCategory: string;
}

export interface EmployeeDetail {
  profile: StaffEmployee | null;
  leaveBalance: unknown;
  leaveRequests: unknown[];
  attendance: unknown[];
  loading: boolean;
}

export function useStaffPortal() {
  const [employees, setEmployees] = useState<StaffEmployee[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmployeeDetail>({
    profile: null, leaveBalance: null, leaveRequests: [], attendance: [], loading: false,
  });

  // Load full employee list
  const fetchList = useCallback(() => {
    setListLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      params: { limit: 200 },
      showToast: false,
      thenFn: (res) => setEmployees(res.data?.data ?? []),
      finallyFn: () => setListLoading(false),
    });
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Load detail for selected employee
  const selectEmployee = useCallback((emp: StaffEmployee) => {
    setSelectedId(emp._id);
    setDetail((d) => ({ ...d, profile: emp, loading: true }));
    Promise.all([
      apiCallFunction<any>({
        url: `${API_BASE_URL}/leave/balances/${emp._id}`,
        showToast: false,
        thenFn: (r) => setDetail((d) => ({ ...d, leaveBalance: r.data ?? null })),
        catchFn: () => setDetail((d) => ({ ...d, leaveBalance: null })),
      }),
      apiCallFunction<any>({
        url: `${API_BASE_URL}/leave/requests`,
        params: { employeeId: emp._id, limit: 20 },
        showToast: false,
        thenFn: (r) => setDetail((d) => ({ ...d, leaveRequests: r.data?.data ?? [] })),
        catchFn: () => setDetail((d) => ({ ...d, leaveRequests: [] })),
      }),
      apiCallFunction<any>({
        url: `${API_BASE_URL}/attendance`,
        params: { employeeId: emp._id, limit: 30 },
        showToast: false,
        thenFn: (r) => setDetail((d) => ({ ...d, attendance: r.data?.data ?? r.data ?? [] })),
        catchFn: () => setDetail((d) => ({ ...d, attendance: [] })),
      }),
    ]).finally(() => setDetail((d) => ({ ...d, loading: false })));
  }, []);

  const filtered = employees.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.fullName.toLowerCase().includes(q) || e.staffNumber.toLowerCase().includes(q);
  });

  return { employees: filtered, listLoading, search, setSearch, selectedId, selectEmployee, detail, refetch: fetchList };
}
