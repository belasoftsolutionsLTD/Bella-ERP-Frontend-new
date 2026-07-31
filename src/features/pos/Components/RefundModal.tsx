'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { usePosRefunds } from '../Hooks/usePosRefunds';
import type { Sale } from '../types';

export function RefundModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const t = useTranslations('POS');
  const { createRefund } = usePosRefunds();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const refundableLines = sale.items.filter((l) => (l.refundedQuantity ?? 0) < l.quantity);

  const submit = () => {
    const items = refundableLines
      .map((l) => ({ itemId: l.itemId, quantity: Number(quantities[l.itemId]) || 0 }))
      .filter((l) => l.quantity > 0);
    if (!items.length) return;
    setSaving(true);
    createRefund({ saleId: sale._id, items, method, reason: reason || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('sales.refund')} — {sale.saleNumber}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {refundableLines.map((line) => {
            const refundable = line.quantity - (line.refundedQuantity ?? 0);
            return (
              <div key={line.itemId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 truncate">{line.name}</p>
                  <p className="text-xs text-slate-400">{t('sales.refundable')}: {refundable}</p>
                </div>
                <input type="number" min={0} max={refundable} value={quantities[line.itemId] || ''}
                  onChange={(e) => setQuantities((q) => ({ ...q, [line.itemId]: e.target.value }))}
                  className="w-16 h-8 border border-slate-200 rounded px-2 text-xs text-right" />
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('sales.refundMethod')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="cash">{t('checkout.cash')}</option>
            <option value="card">{t('checkout.card')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('sales.refundReason')}</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={submit} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('sales.refund')}
          </button>
        </div>
      </div>
    </div>
  );
}
