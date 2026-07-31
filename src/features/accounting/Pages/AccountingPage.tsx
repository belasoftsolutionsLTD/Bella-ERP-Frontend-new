'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, BookOpen, ListChecks, Lock, AlertTriangle, ScrollText, Scale, FileText, Receipt, Landmark, PieChart, TrendingUp, CheckCircle2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccountingAccess } from '../Hooks/useAccountingConfig';
import { ChartOfAccountsTab } from '../Components/ChartOfAccountsTab';
import { JournalTab } from '../Components/JournalTab';
import { GeneralLedgerTab } from '../Components/GeneralLedgerTab';
import { TrialBalanceTab } from '../Components/TrialBalanceTab';
import { ArInvoicesTab } from '../Components/ArInvoicesTab';
import { ApBillsTab } from '../Components/ApBillsTab';
import { ReconciliationTab } from '../Components/ReconciliationTab';
import { BalanceSheetTab } from '../Components/BalanceSheetTab';
import { IncomeStatementTab } from '../Components/IncomeStatementTab';
import { PeriodsTab } from '../Components/PeriodsTab';
import { PostingFailuresTab } from '../Components/PostingFailuresTab';
import { PoPaymentApprovalsTab } from '../Components/PoPaymentApprovalsTab';
import { SettingsTab } from '../Components/SettingsTab';

const TABS = [
  { id: 'chartOfAccounts', icon: BookOpen },
  { id: 'journal', icon: ListChecks },
  { id: 'generalLedger', icon: ScrollText },
  { id: 'trialBalance', icon: Scale },
  { id: 'balanceSheet', icon: PieChart },
  { id: 'incomeStatement', icon: TrendingUp },
  { id: 'arInvoices', icon: FileText },
  { id: 'apBills', icon: Receipt },
  { id: 'poPayments', icon: CheckCircle2 },
  { id: 'reconciliation', icon: Landmark },
  { id: 'periods', icon: Lock },
  { id: 'postingFailures', icon: AlertTriangle },
  { id: 'settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export function AccountingPage() {
  const t = useTranslations('Accounting');
  const searchParams = useSearchParams();
  const { level, isLoading } = useAccountingAccess();
  const [tab, setTab] = useState<TabId>('chartOfAccounts');

  useEffect(() => {
    const requested = searchParams.get('tab') as TabId | null;
    if (requested && TABS.some((x) => x.id === requested)) setTab(requested);
  }, [searchParams]);

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;

  if (!level) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
        <ShieldAlert className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">{t('accessDenied.title')}</p>
        <p className="text-sm text-slate-400 max-w-sm">{t('accessDenied.message')}</p>
      </div>
    );
  }

  const visibleTabs = TABS.filter((x) => {
    // Balance Sheet / Income Statement are the only tabs a 'viewer' (department_head) can
    // see — pre-aggregated, department-scoped reports, never the raw journal-entry tabs.
    if (['journal', 'generalLedger', 'trialBalance', 'arInvoices', 'apBills', 'poPayments', 'reconciliation', 'periods', 'postingFailures'].includes(x.id)) return level === 'admin' || level === 'bookkeeper';
    // Settings holds an admin-only action (seedDefaultChartOfAccounts 403s for anyone
    // else), same restriction as the Chart of Accounts structural edits themselves.
    if (x.id === 'settings') return level === 'admin';
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('nav.title')}</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {visibleTabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === x.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <x.icon className="h-4 w-4" /> {t(`nav.${x.id}`)}
          </button>
        ))}
      </div>

      <div>
        {tab === 'chartOfAccounts' && <ChartOfAccountsTab level={level} />}
        {tab === 'journal' && <JournalTab level={level} />}
        {tab === 'generalLedger' && <GeneralLedgerTab />}
        {tab === 'trialBalance' && <TrialBalanceTab />}
        {tab === 'balanceSheet' && <BalanceSheetTab />}
        {tab === 'incomeStatement' && <IncomeStatementTab />}
        {tab === 'arInvoices' && <ArInvoicesTab />}
        {tab === 'apBills' && <ApBillsTab />}
        {tab === 'poPayments' && <PoPaymentApprovalsTab />}
        {tab === 'reconciliation' && <ReconciliationTab />}
        {tab === 'periods' && <PeriodsTab level={level} />}
        {tab === 'postingFailures' && <PostingFailuresTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
