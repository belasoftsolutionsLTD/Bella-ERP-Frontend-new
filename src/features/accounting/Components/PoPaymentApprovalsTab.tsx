'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, Paperclip } from 'lucide-react';
import { usePendingPoPayments } from '../Hooks/useAccountingConfig';

export function PoPaymentApprovalsTab() {
  const t = useTranslations('Accounting');
  const { pending, approve, reject } = usePendingPoPayments();

  if (!pending.length) return <p className="text-sm text-slate-400 text-center py-16">{t('poPayments.none')}</p>;

  const handleReject = (id: string) => {
    const reason = window.prompt(t('poPayments.rejectReasonPrompt')) ?? undefined;
    reject(id, reason || undefined);
  };

  return (
    <div className="space-y-2">
      {pending.map((po: any) => (
        <div key={po._id} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold text-slate-900">{po.poNumber}</p>
              <p className="text-xs text-slate-500">{po.supplierName} → {po.locationName}</p>
              <p className="text-xs text-slate-400 mt-1">
                {t('poPayments.requestedBy')}: {po.paymentRequestedByName ?? '—'} · {po.paymentMethod}
                {po.paymentReference ? ` · ${po.paymentReference}` : ''}
              </p>
              {po.paymentEvidenceOriginalName && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Paperclip className="h-3 w-3" /> {po.paymentEvidenceOriginalName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold text-slate-900">{Number(po.amountDue).toLocaleString()}</span>
              <button onClick={() => approve(po._id)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t('poPayments.approve')}
              </button>
              <button onClick={() => handleReject(po._id)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold">
                <XCircle className="h-3.5 w-3.5" /> {t('poPayments.reject')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
