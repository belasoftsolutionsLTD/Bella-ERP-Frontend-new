'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface StaffEmployee {
  _id: string;
  fullName: string;
  staffNumber: string;
  designation: string;
  department: string;
  employmentType?: string;
  status: string;
  email: string;
  phone?: string;
  dateOfHire: string;
  staffCategory: string;
  paymentMethod?: string;
  bankName?: string;
  bankAccountNumber?: string;
  mpesaNumber?: string;
  paypalEmail?: string;
  cryptoWalletAddress?: string;
  cryptoNetwork?: string;
}

export interface EmployeeDetail {
  profile: StaffEmployee | null;
  leaveBalance: unknown;
  leaveRequests: unknown[];
  attendance: unknown[];
  loading: boolean;
}

const PAGE_SIZE = 500;

export function useStaffPortal() {
  const [employees, setEmployees] = useState<StaffEmployee[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmployeeDetail>({
    profile: null, leaveBalance: null, leaveRequests: [], attendance: [], loading: false,
  });

  const fetchPage = useCallback((pageNum: number, query: string, append: boolean) => {
    setListLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      params: { limit: PAGE_SIZE, page: pageNum, ...(query.trim() ? { search: query.trim() } : {}) },
      showToast: false,
      thenFn: (res) => {
        const data: StaffEmployee[] = res.data?.data ?? [];
        const pagination = res.data?.pagination ?? {};
        setEmployees(prev => append ? [...prev, ...data] : data);
        setTotal(pagination.total ?? data.length);
        setPage(pageNum);
        setHasMore((pagination.page ?? 1) < (pagination.pages ?? 1));
      },
      finallyFn: () => setListLoading(false),
    });
  }, []);

  // Debounced search — immediate on clear, 300ms delay when typing
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchPage(1, search, false), search ? 300 : 0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search, fetchPage]);

  const loadMore = useCallback(() => {
    if (!listLoading && hasMore) fetchPage(page + 1, search, true);
  }, [listLoading, hasMore, page, search, fetchPage]);

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

  const refetch = useCallback(() => fetchPage(1, search, false), [fetchPage, search]);

  return {
    employees, listLoading, search, setSearch,
    total, hasMore, loadMore,
    selectedId, selectEmployee, detail, refetch,
  };
}
