'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Loader2 } from 'lucide-react';
import { useInventoryPurchaseOrders } from '../Hooks/useInventoryPurchaseOrders';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import type { InventoryAccessLevel, POStatus } from '../types';

const STATUS_CLS: Record<POStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-sky-100 text-sky-700',
  pending_delivery: 'bg-indigo-100 text-indigo-700',
  partially_received: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
  pending_payment_approval: 'bg-orange-100 text-orange-700',
  closed: 'bg-slate-200 text-slate-500',
};

// snake_case status value -> camelCase translation key (matches this namespace's
// existing convention, e.g. partially_received -> partiallyReceived).
const statusKey = (s: POStatus) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function PurchaseOrdersTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const locale = useLocale();
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { purchaseOrders, isLoading } = useInventoryPurchaseOrders({ status });
  const canCreate = level === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('purchaseOrders.status')}</option>
          {(['draft', 'pending', 'pending_delivery', 'partially_received', 'received', 'pending_payment_approval', 'closed'] as POStatus[]).map((s) => (
            <option key={s} value={s}>{t(`purchaseOrders.${statusKey(s)}`)}</option>
          ))}
        </select>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('purchaseOrders.addPO')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : purchaseOrders.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('purchaseOrders.noPOs')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('purchaseOrders.poNumber')}</th>
                <th className="px-4 py-2.5">{t('purchaseOrders.supplier')}</th>
                <th className="px-4 py-2.5">{t('purchaseOrders.expectedDelivery')}</th>
                <th className="px-4 py-2.5">{t('purchaseOrders.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => (
                <tr key={po._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/${locale}/inventory/purchase-orders/${po._id}`} className="font-mono text-xs text-brand-primary hover:underline">{po.poNumber}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{po.supplier?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[po.status]}`}>
                      {t(`purchaseOrders.${statusKey(po.status)}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <PurchaseOrderFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
