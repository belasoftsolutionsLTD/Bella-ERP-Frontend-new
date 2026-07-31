'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useAccounts } from '../Hooks/useAccounts';
import { useGeneralLedgerDetail } from '../Hooks/useReports';

export function GeneralLedgerTab() {
  const t = useTranslations('Accounting');
  const { accounts } = useAccounts();
  const [accountId, setAccountId] = useState('');
  const { rows, isLoading } = useGeneralLedgerDetail({ accountId: accountId || undefined });

  return (
    <div className="space-y-3">
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
        <option value="">{t('generalLedger.allAccounts')}</option>
        {accounts.map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
      </select>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('generalLedger.noEntries')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('journal.date')}</th>
                <th className="px-4 py-2.5">{t('journal.account')}</th>
                <th className="px-4 py-2.5">{t('journal.description')}</th>
                <th className="px-4 py-2.5 text-right">{t('journal.debit')}</th>
                <th className="px-4 py-2.5 text-right">{t('journal.credit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-slate-700"><span className="font-mono text-xs text-slate-400 mr-1.5">{r.accountCode}</span>{r.accountName}</td>
                  <td className="px-4 py-2 text-slate-500">{r.description} <span className="text-xs text-slate-300 font-mono">({r.entryNumber})</span></td>
                  <td className="px-4 py-2 text-right text-slate-600">{r.debit ? r.debit.toLocaleString() : ''}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{r.credit ? r.credit.toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
