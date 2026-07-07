'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher, type Paginated } from './swrFetcher';
import type { MyPayslip } from '../Components/MyPayslipsPanel';

// HR-side: an individual employee's payslip history (employee profile "Payroll" tab).
export function useEmployeePayslips(employeeId?: string) {
  const key = employeeId ? `${API_BASE_URL}/payroll/employee-payslips/${employeeId}?limit=100` : null;
  const { data, error, isLoading, mutate } = useSWR<Paginated<MyPayslip>>(key, swrFetcher);
  return { payslips: data?.data ?? [], isLoading, error, mutate };
}
