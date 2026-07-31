'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useArInvoices } from '../Hooks/useArInvoices';
import type { ArInvoice } from '../types';

const METHODS = ['bank_transfer', 'mpesa', 'cash', 'cheque'] as const;

export function RecordArPaymentModal({ invoice, onClose }: { invoice: ArInvoice; onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { recordPayment } = useArInvoices();
  const [amount, setAmount] = useState(String(invoice.balanceDue));
  const [method, setMethod] = useState<typeof METHODS[number]>('bank_transfer');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!(Number(amount) > 0)) return;
    setSaving(true);
    recordPayment(invoice._id, { amount: Number(amount), method, reference: reference.trim() || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('ar.recordPayment')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-slate-500">{invoice.invoiceNumber} · {t('ar.balanceDue')}: {invoice.balanceDue.toLocaleString()}</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('ar.amount')}</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('ar.paymentMethod')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('ar.reference')}</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !(Number(amount) > 0)} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
