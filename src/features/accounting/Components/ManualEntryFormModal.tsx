'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '../Hooks/useAccounts';
import { useJournalEntries } from '../Hooks/useJournalEntries';

interface LineDraft { accountId: string; debit: string; credit: string; memo: string }

export function ManualEntryFormModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { accounts } = useAccounts();
  const { createManualEntry } = useJournalEntries();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<LineDraft[]>([{ accountId: '', debit: '', credit: '', memo: '' }, { accountId: '', debit: '', credit: '', memo: '' }]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const updateLine = (idx: number, patch: Partial<LineDraft>) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { accountId: '', debit: '', credit: '', memo: '' }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));

  const save = () => {
    if (!description.trim() || !totals.balanced || lines.some((l) => !l.accountId)) return;
    setSaving(true);
    createManualEntry({
      date, description: description.trim(),
      lines: lines.map((l) => ({ accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, memo: l.memo || undefined })),
    })?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('journal.newEntry')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('journal.date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('journal.description')}</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_100px_100px_36px] gap-1.5 text-xs font-semibold text-slate-500 px-1">
            <span>{t('journal.account')}</span><span>{t('journal.debit')}</span><span>{t('journal.credit')}</span><span />
          </div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_100px_100px_36px] gap-1.5 items-center">
              <select value={l.accountId} onChange={(e) => updateLine(idx, { accountId: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs">
                <option value="">{t('common.select')}</option>
                {accounts.map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
              </select>
              <input type="number" value={l.debit} onChange={(e) => updateLine(idx, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" value={l.credit} onChange={(e) => updateLine(idx, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <button onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button onClick={addLine} className="text-xs font-semibold text-brand-primary flex items-center gap-1"><Plus className="h-3 w-3" /> {t('journal.addLine')}</button>
        </div>

        <div className={cn('flex items-center justify-between text-sm px-2 py-2 rounded-lg', totals.balanced ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500')}>
          <span>{t('journal.totalDebit')}: {totals.debit.toLocaleString()}</span>
          <span>{t('journal.totalCredit')}: {totals.credit.toLocaleString()}</span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !totals.balanced || !description.trim() || lines.some((l) => !l.accountId)} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
