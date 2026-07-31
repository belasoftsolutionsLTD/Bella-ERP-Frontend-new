'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/configs/constants';
import { swrFetcher } from './swrFetcher';

export interface GlDetailRow {
  entryNumber: string; date: string; description: string | null; source: string; sourceModule: string | null;
  accountCode: string; accountName: string; debit: number; credit: number; department: string | null; memo: string | null;
}

export interface TrialBalanceRow {
  accountId: string; code: string; name: string; type: string; normalBalance: string; debit: number; credit: number;
}

export interface TrialBalance { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean }

export function useGeneralLedgerDetail(params?: { accountId?: string; startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.accountId) qs.set('accountId', params.accountId);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const key = `${API_BASE_URL}/accounting/reports/general-ledger?${qs.toString()}`;
  const { data, error, isLoading } = useSWR<GlDetailRow[]>(key, swrFetcher);
  return { rows: data ?? [], error, isLoading };
}

export function useTrialBalance() {
  const key = `${API_BASE_URL}/accounting/reports/trial-balance`;
  const { data, error, isLoading } = useSWR<TrialBalance>(key, swrFetcher);
  return { trialBalance: data ?? null, error, isLoading };
}

export interface BalanceSheetLine { accountId: string | null; code: string; name: string; balance: number }
export interface BalanceSheet {
  asOf: string; assets: BalanceSheetLine[]; liabilities: BalanceSheetLine[]; equity: BalanceSheetLine[];
  totalAssets: number; totalLiabilities: number; totalEquity: number; balanced: boolean;
}

export function useBalanceSheet() {
  const key = `${API_BASE_URL}/accounting/reports/balance-sheet`;
  const { data, error, isLoading } = useSWR<BalanceSheet>(key, swrFetcher);
  return { balanceSheet: data ?? null, error, isLoading };
}

export interface IncomeStatementLine { accountId: string; code: string; name: string; type: string; amount: number }
export interface IncomeStatement {
  startDate: string | null; endDate: string | null; revenue: IncomeStatementLine[]; expenses: IncomeStatementLine[];
  totalRevenue: number; totalExpenses: number; netIncome: number;
}

export function useIncomeStatement(params?: { startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const key = `${API_BASE_URL}/accounting/reports/income-statement?${qs.toString()}`;
  const { data, error, isLoading } = useSWR<IncomeStatement>(key, swrFetcher);
  return { incomeStatement: data ?? null, error, isLoading };
}
