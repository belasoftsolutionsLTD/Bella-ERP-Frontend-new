'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAccounts } from '../Hooks/useAccounts';
import { useBankStatementImports } from '../Hooks/useReconciliation';

export function ImportStatementModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { accounts } = useAccounts({ type: 'asset' });
  const { importStatement } = useBankStatementImports();
  const [accountId, setAccountId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!accountId || !file || !openingBalance || !closingBalance) return;
    setSaving(true);
    importStatement({ accountId, openingBalance: Number(openingBalance), closingBalance: Number(closingBalance), file })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('reconciliation.importStatement')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('reconciliation.account')}</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('common.select')}</option>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('reconciliation.openingBalance')}</label>
            <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('reconciliation.closingBalance')}</label>
            <input type="number" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('reconciliation.csvFile')}</label>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-600" />
          <p className="text-[11px] text-slate-400">{t('reconciliation.csvHint')}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !accountId || !file} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
