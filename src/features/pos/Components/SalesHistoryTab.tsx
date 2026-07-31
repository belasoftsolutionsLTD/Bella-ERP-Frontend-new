'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Eye, Undo2, Ban } from 'lucide-react';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { DocViewerModal } from '@/components/custom-ui/DocViewerModal';
import { usePosSales } from '../Hooks/usePosSales';
import { usePosRefunds } from '../Hooks/usePosRefunds';
import { usePosLocations } from '../Hooks/usePosLocations';
import { API_BASE_URL } from '@/configs/constants';
import { fetchAsBlobUrl } from '@/functions/downloadFile';
import { RefundModal } from './RefundModal';
import type { PosAccessLevel, Sale, SaleStatus } from '../types';

const STATUS_CLS: Record<SaleStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  voided: 'bg-slate-200 text-slate-500',
  refunded: 'bg-red-100 text-red-600',
  partially_refunded: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-600',
};

export function SalesHistoryTab({ level }: { level: PosAccessLevel }) {
  const t = useTranslations('POS');
  const { locations } = usePosLocations();
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState('');
  const { sales, isLoading, voidSale } = usePosSales({ locationId, status });
  const [view, setView] = useState<'sales' | 'refunds'>('sales');
  const { refunds, isLoading: refundsLoading } = usePosRefunds({ locationId });
  const [refunding, setRefunding] = useState<Sale | null>(null);
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; fileName: string } | null>(null);
  const canManage = level === 'admin' || level === 'manager';

  const isSameDay = (d: string) => new Date(d).toDateString() === new Date().toDateString();

  const viewReceipt = async (sale: Sale) => {
    const url = await fetchAsBlobUrl(`${API_BASE_URL}/pos/sales/${sale._id}/receipt`);
    setViewingReceipt({ url, fileName: `receipt-${sale.saleNumber}.pdf` });
  };
  const closeReceipt = () => {
    if (viewingReceipt) URL.revokeObjectURL(viewingReceipt.url);
    setViewingReceipt(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setView('sales')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'sales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('sales.tabSales')}</button>
          <button onClick={() => setView('refunds')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'refunds' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('sales.tabRefunds')}</button>
        </div>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('sales.allLocations')}</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
        {view === 'sales' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
            <option value="">{t('sales.allStatuses')}</option>
            {(['completed', 'voided', 'refunded', 'partially_refunded'] as SaleStatus[]).map((s) => (
              <option key={s} value={s}>{t(`sales.status.${s}`)}</option>
            ))}
          </select>
        )}
      </div>

      {view === 'refunds' ? (
        refundsLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
        ) : refunds.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">{t('sales.noRefunds')}</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5">{t('sales.saleNumber')}</th>
                  <th className="px-4 py-2.5">{t('sales.date')}</th>
                  <th className="px-4 py-2.5">{t('sales.refundedBy')}</th>
                  <th className="px-4 py-2.5">{t('sales.reason')}</th>
                  <th className="px-4 py-2.5 text-right">{t('sales.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.saleNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.refundedByName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.reason || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : sales.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('sales.noSales')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('sales.saleNumber')}</th>
                <th className="px-4 py-2.5">{t('sales.date')}</th>
                <th className="px-4 py-2.5">{t('sales.staff')}</th>
                <th className="px-4 py-2.5 text-right">{t('sales.total')}</th>
                <th className="px-4 py-2.5">{t('sales.status.label')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{sale.saleNumber}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-600">{sale.staffName}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{sale.total.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[sale.status]}`}>{t(`sales.status.${sale.status}`)}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => viewReceipt(sale)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10" title={t('sales.viewReceipt')}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {canManage && ['completed', 'partially_refunded'].includes(sale.status) && (
                        <button onClick={() => setRefunding(sale)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title={t('sales.refund')}>
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canManage && sale.status === 'completed' && isSameDay(sale.createdAt) && (
                        <button onClick={() => setVoiding(sale)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title={t('sales.void')}>
                          <Ban className="h-3.5 w-3.5" />
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

      {viewingReceipt && <DocViewerModal url={viewingReceipt.url} fileName={viewingReceipt.fileName} onClose={closeReceipt} />}
      {refunding && <RefundModal sale={refunding} onClose={() => setRefunding(null)} />}
      {voiding && (
        <ConfirmDialog
          title={t('sales.voidSale')}
          message={t('sales.voidConfirm')}
          confirmLabel={t('sales.void')}
          variant="danger"
          onConfirm={() => { voidSale(voiding._id); setVoiding(null); }}
          onCancel={() => setVoiding(null)}
        />
      )}
    </div>
  );
}
