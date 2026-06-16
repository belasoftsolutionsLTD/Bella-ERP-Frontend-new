'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface PayrollSummary {
  _id: string;
  employeeId: string;
  employee?: { fullName: string; staffNumber: string; department: string } | null;
  month: number;
  year: number;
  grossPay: number;
  allowances: { name: string; amount: number }[];
  otherAllowances: { label: string; amount: number }[];
  allowancesTotal: number;
  totalEarnings: number;
  deductions: {
    paye: number;
    sha: number;
    nssf: number;
    otherDeductions: { label: string; amount: number }[];
  };
  netPay: number;
  generatedAt: string;
  paymentStatus?: 'unpaid' | 'paid';
  paidAt?: string;
  companyAccountId?: string;
  disbursementId?: string;
}

export interface PayrollTotals {
  grossPay: number;
  netPay: number;
  paye: number;
  nssf: number;
  sha: number;
  count: number;
}

export function usePayroll(employeeId?: string, month?: number, year?: number) {
  const [records, setRecords] = useState<PayrollSummary[]>([]);
  const [totals, setTotals] = useState<PayrollTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    const url = employeeId ? `${API_BASE_URL}/payroll/${employeeId}` : `${API_BASE_URL}/payroll`;
    const params: Record<string, unknown> = {};
    if (month) params.month = month;
    if (year)  params.year  = year;
    apiCallFunction<any>({
      url,
      params,
      showToast: false,
      thenFn: (res) => {
        if (employeeId) {
          setRecords(res.data ?? []);
        } else {
          setRecords(res.data?.data ?? []);
          setTotals(res.data?.totals ?? null);
        }
      },
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, [employeeId, month, year]);

  useEffect(() => { fetch(); }, [fetch]);
  return { records, totals, loading, error, refetch: fetch };
}
