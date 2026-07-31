'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { RefreshCw, BookOpen, ArrowRight } from 'lucide-react';
import { useAccounts } from '../Hooks/useAccounts';

// Settings only ever held setup/reference actions (seed starter accounts, view system
// mappings) — adding, editing, and archiving accounts has always lived in the Chart of
// Accounts tab itself (AccountFormModal there). That split reads as "accounts are
// hardcoded" if you land on Settings first, since there's nothing account-editing here
// to find — this panel exists purely to point you to where that capability actually is.
function ManageAccountsPanel() {
  const t = useTranslations('Accounting');
  const locale = useLocale();

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.manageAccounts')}</p>
      <p className="text-xs text-slate-400">{t('settings.manageAccountsHint')}</p>
      <Link
        href={`/${locale}/accounting?tab=chartOfAccounts`}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-brand-primary/30 text-brand-primary text-sm font-semibold hover:bg-brand-primary/5"
      >
        <BookOpen className="h-3.5 w-3.5" /> {t('settings.goToChartOfAccounts')} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// The systemKey accounts every automatic-posting hook across POS/Inventory/Payroll/
// Spending resolves by (glEngine.resolveSystemAccount) — mirrors STARTER_TEMPLATE in
// accountingChartFunctions.js. A key with no mapped account here is exactly what makes
// resolveSystemAccount throw, which queues that posting to gl_posting_failures instead
// of blocking the source transaction — so an "Unmapped" row here is worth investigating.
const SYSTEM_KEYS = [
  'cash', 'bank', 'pos_card_clearing', 'pos_mpesa_clearing', 'accounts_receivable', 'inventory_asset',
  'accounts_payable', 'salary_payable', 'tax_payable', 'sales_revenue', 'sales_returns', 'cogs',
  'salary_expense', 'inventory_shrinkage', 'voucher_expense', 'procurement_expense', 'other_expense',
];

function SeedDefaultsPanel() {
  const t = useTranslations('Accounting');
  const { seedDefaults } = useAccounts();
  const [seeding, setSeeding] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.starterAccounts')}</p>
      <p className="text-xs text-slate-400">{t('settings.starterAccountsHint')}</p>
      <button
        onClick={() => { setSeeding(true); seedDefaults()?.finally(() => setSeeding(false)); }}
        disabled={seeding}
        className="h-9 px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" /> {seeding ? t('common.saving') : t('settings.seedDefaults')}
      </button>
    </div>
  );
}

function SystemAccountMappingsPanel() {
  const t = useTranslations('Accounting');
  const { accounts } = useAccounts();
  const mapped = new Map(accounts.filter((a) => a.systemKey).map((a) => [a.systemKey as string, a]));

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.systemMappings')}</p>
      <p className="text-xs text-slate-400">{t('settings.systemMappingsHint')}</p>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {SYSTEM_KEYS.map((key) => {
          const acct = mapped.get(key);
          return (
            <div key={key} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-mono text-xs text-slate-500">{key}</span>
              {acct
                ? <span className="text-slate-700">{acct.code} — {acct.name}</span>
                : <span className="text-red-500 text-xs font-semibold">{t('settings.unmapped')}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <ManageAccountsPanel />
      <SeedDefaultsPanel />
      <SystemAccountMappingsPanel />
    </div>
  );
}
