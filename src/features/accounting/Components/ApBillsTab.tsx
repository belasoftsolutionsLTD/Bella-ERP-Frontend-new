'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, CheckCircle2, Calendar, DollarSign } from 'lucide-react';
import { useApBills } from '../Hooks/useApBills';
import { ApBillFormModal } from './ApBillFormModal';
import { PayApBillModal } from './PayApBillModal';
import type { ApBill, ApBillStatus } from '../types';

const STATUS_CLS: Record<ApBillStatus, string> = {
  draft: 'bg-slate-100 text-slate-500',
  approved: 'bg-blue-100 text-blue-600',
  scheduled: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export function ApBillsTab() {
  const t = useTranslations('Accounting');
  const { bills, isLoading, approveBill, scheduleBill } = useApBills();
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState<ApBill | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{bills.length} {t('ap.bills')}</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> {t('ap.newBill')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : bills.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('ap.noBills')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('ap.billNumber')}</th>
                <th className="px-4 py-2.5">{t('ap.vendorName')}</th>
                <th className="px-4 py-2.5 text-right">{t('ar.total')}</th>
                <th className="px-4 py-2.5">{t('ar.status')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((b) => (
                <tr key={b._id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{b.billNumber}</td>
                  <td className="px-4 py-2.5 text-slate-700">{b.vendorName}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{b.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[b.status]}`}>{t(`ap.statusValue.${b.status}`)}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === 'draft' && (
                        <button onClick={() => approveBill(b._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10" title={t('ap.approve')}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {b.status === 'approved' && (
                        <button onClick={() => { const d = prompt(t('ap.scheduleDatePrompt')); if (d) scheduleBill(b._id, d); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title={t('ap.schedule')}>
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {['approved', 'scheduled'].includes(b.status) && (
                        <button onClick={() => setPaying(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title={t('ap.payBill')}>
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

      {showForm && <ApBillFormModal onClose={() => setShowForm(false)} />}
      {paying && <PayApBillModal bill={paying} onClose={() => setPaying(null)} />}
    </div>
  );
}
