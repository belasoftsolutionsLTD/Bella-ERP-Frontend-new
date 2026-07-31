'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2 } from 'lucide-react';
import { useArInvoices } from '../Hooks/useArInvoices';

interface LineDraft { description: string; quantity: string; unitPrice: string; taxRate: string }

export function ArInvoiceFormModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { createInvoice } = useArInvoices();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([{ description: '', quantity: '1', unitPrice: '', taxRate: '0' }]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const l of lines) {
      const s = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
      subtotal += s;
      tax += s * (Number(l.taxRate) || 0) / 100;
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  const updateLine = (idx: number, patch: Partial<LineDraft>) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { description: '', quantity: '1', unitPrice: '', taxRate: '0' }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const save = () => {
    if (!customerName.trim() || !dueDate || lines.some((l) => !l.description.trim() || !l.unitPrice)) return;
    setSaving(true);
    createInvoice({
      customerName: customerName.trim(), customerEmail: customerEmail.trim() || undefined, dueDate,
      items: lines.map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0, taxRate: Number(l.taxRate) || 0 })),
    })?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('ar.newInvoice')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('ar.customerName')}</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('ar.customerEmail')}</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-slate-500">{t('ar.dueDate')}</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_70px_90px_70px_36px] gap-1.5 text-xs font-semibold text-slate-500 px-1">
            <span>{t('ar.description')}</span><span>{t('ar.qty')}</span><span>{t('ar.unitPrice')}</span><span>{t('ar.taxPercent')}</span><span />
          </div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_70px_90px_70px_36px] gap-1.5 items-center">
              <input value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" value={l.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" value={l.taxRate} onChange={(e) => updateLine(idx, { taxRate: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <button onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button onClick={addLine} className="text-xs font-semibold text-brand-primary flex items-center gap-1"><Plus className="h-3 w-3" /> {t('journal.addLine')}</button>
        </div>

        <div className="text-sm text-right text-slate-600 pt-1 border-t border-slate-100">
          {t('ar.subtotal')}: {totals.subtotal.toLocaleString()} · {t('ar.tax')}: {totals.tax.toLocaleString()} · <span className="font-bold text-slate-900">{t('ar.total')}: {totals.total.toLocaleString()}</span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !customerName.trim() || !dueDate} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
