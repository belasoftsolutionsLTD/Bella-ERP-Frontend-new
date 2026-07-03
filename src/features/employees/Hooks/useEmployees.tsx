'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface Employee {
  _id: string;
  fullName: string;
  staffNumber: string;
  nationalId: string;
  designation: string;
  employmentType: string;
  department: string;
  dateOfHire: string;
  contractEndDate?: string;
  salaryGrade: string;
  grossPay?: number;
  jobGroupId?: string;
  kraPin?: string;
  bankAccountNumber?: string;
  mpesaNumber?: string;
  email: string;
  phone?: string;
  staffCategory: string;
  status: string;
  createdAt: string;
}

export interface EmployeeFilters {
  department?: string;
  designation?: string;
  employmentType?: string;
  staffCategory?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useEmployees(initialFilters: EmployeeFilters = {}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, limit: 10, ...initialFilters });

  const fetch = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      method: 'GET',
      params,
      showToast: false,
      thenFn: (res) => {
        setEmployees(res.data?.data ?? []);
        setTotal(res.data?.pagination?.total ?? 0);
      },
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { employees, total, loading, error, filters, setFilters, refetch: fetch };
}
