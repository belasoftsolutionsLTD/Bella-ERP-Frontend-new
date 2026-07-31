'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Send, DollarSign } from 'lucide-react';
import { useArInvoices } from '../Hooks/useArInvoices';
import { ArInvoiceFormModal } from './ArInvoiceFormModal';
import { RecordArPaymentModal } from './RecordArPaymentModal';
import type { ArInvoice, ArInvoiceStatus } from '../types';

const STATUS_CLS: Record<ArInvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-blue-100 text-blue-600',
  partially_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-600',
};

export function ArInvoicesTab() {
  const t = useTranslations('Accounting');
  const { invoices, isLoading, sendInvoice } = useArInvoices();
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState<ArInvoice | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{invoices.length} {t('ar.invoices')}</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> {t('ar.newInvoice')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('ar.noInvoices')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('ar.invoiceNumber')}</th>
                <th className="px-4 py-2.5">{t('ar.customer')}</th>
                <th className="px-4 py-2.5 text-right">{t('ar.total')}</th>
                <th className="px-4 py-2.5 text-right">{t('ar.balanceDue')}</th>
                <th className="px-4 py-2.5">{t('ar.status')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{inv.invoiceNumber}</td>
                  <td className="px-4 py-2.5 text-slate-700">{inv.customerSnapshot.name}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{inv.total.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{inv.balanceDue.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[inv.status]}`}>{t(`ar.statusValue.${inv.status}`)}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {inv.status === 'draft' && (
                        <button onClick={() => sendInvoice(inv._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10" title={t('ar.send')}>
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {['sent', 'partially_paid', 'overdue'].includes(inv.status) && (
                        <button onClick={() => setPaying(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title={t('ar.recordPayment')}>
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ArInvoiceFormModal onClose={() => setShowForm(false)} />}
      {paying && <RecordArPaymentModal invoice={paying} onClose={() => setPaying(null)} />}
    </div>
  );
}
