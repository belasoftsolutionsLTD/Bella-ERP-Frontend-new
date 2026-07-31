'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAccounts } from '../Hooks/useAccounts';
import type { AccountType, GlAccount } from '../types';

const TYPES: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export function AccountFormModal({ accounts, onClose }: { accounts: GlAccount[]; onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { createAccount } = useAccounts();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('expense');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    createAccount({ code: code.trim(), name: name.trim(), type, parentId: parentId || undefined })
      ?.then(() => { setSaving(false); onClose(); })
      .catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('chart.addAccount')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('chart.code')}</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('chart.type.label')}</label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`chart.type.${ty}`)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('chart.accountName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('chart.parentAccount')}</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('common.none')}</option>
            {accounts.filter((a) => a.type === type).map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !code.trim() || !name.trim()} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
