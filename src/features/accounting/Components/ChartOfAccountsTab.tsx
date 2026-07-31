'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Archive, ShieldCheck } from 'lucide-react';
import { useAccounts } from '../Hooks/useAccounts';
import { AccountFormModal } from './AccountFormModal';
import type { AccountingAccessLevel, AccountType } from '../types';

const TYPES: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export function ChartOfAccountsTab({ level }: { level: AccountingAccessLevel }) {
  const t = useTranslations('Accounting');
  const { accounts, isLoading, archiveAccount, seedDefaults } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const canManage = level === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{accounts.length} {t('chart.accounts')}</p>
        {canManage && (
          <div className="flex items-center gap-2">
            {accounts.length === 0 && (
              <button onClick={() => seedDefaults()} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                {t('chart.seedDefaults')}
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold">
              <Plus className="h-4 w-4" /> {t('chart.addAccount')}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : (
        <div className="space-y-4">
          {TYPES.map((type) => {
            const rows = accounts.filter((a) => a.type === type);
            if (!rows.length) return null;
            return (
              <div key={type}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t(`chart.type.${type}`)}</p>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {rows.map((a) => (
                    <div key={a._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{a.code}</span>
                        <span className="text-slate-800">{a.name}</span>
                        {a.isSystemAccount && <span title={t('chart.systemAccount')}><ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /></span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-semibold">{a.balanceCache.toLocaleString()}</span>
                        {canManage && !a.isSystemAccount && (
                          <button onClick={() => archiveAccount(a._id)} className="text-slate-300 hover:text-red-500"><Archive className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AccountFormModal accounts={accounts} onClose={() => setShowForm(false)} />}
    </div>
  );
}
