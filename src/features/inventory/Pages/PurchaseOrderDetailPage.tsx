'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useInventoryPurchaseOrder } from '../Hooks/useInventoryPurchaseOrders';
import { useInventoryAccess } from '../Hooks/useInventoryConfig';

interface ReceiptDraft { quantityReceived: string; unitCost: string; lotNumber: string; expiryDate: string }

// snake_case status value -> camelCase translation key (matches this namespace's
// existing convention, e.g. partially_received -> partiallyReceived).
const statusKey = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const RECEIVABLE_STATUSES = ['pending_delivery', 'partially_received'];

export function PurchaseOrderDetailPage({ id }: { id: string }) {
  const t = useTranslations('Inventory');
  const locale = useLocale();
  const { po, isLoading, sendPO, logInvoice, receivePO, requestPayment } = useInventoryPurchaseOrder(id);
  const { level } = useInventoryAccess();
  const [drafts, setDrafts] = useState<Record<string, ReceiptDraft>>({});
  const [submitting, setSubmitting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [loggingInvoice, setLoggingInvoice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentEvidence, setPaymentEvidence] = useState<File | null>(null);
  const [requestingPayment, setRequestingPayment] = useState(false);

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!po) return <div className="p-6 text-sm text-slate-400">{t('common.notFound')}</div>;

  const canManage = level === 'admin';
  const canReceive = level === 'admin' || level === 'clerk';

  const draftFor = (itemId: string): ReceiptDraft => drafts[itemId] || { quantityReceived: '', unitCost: '', lotNumber: '', expiryDate: '' };
  const setDraft = (itemId: string, patch: Partial<ReceiptDraft>) => setDrafts((d) => ({ ...d, [itemId]: { ...draftFor(itemId), ...patch } }));

  const submitReceive = () => {
    const receipts = po.items
      .map((line) => {
        const d = draftFor(line.itemId);
        const qty = Number(d.quantityReceived);
        if (!qty || qty <= 0) return null;
        return { itemId: line.itemId, quantityReceived: qty, unitCost: d.unitCost ? Number(d.unitCost) : undefined, lotNumber: d.lotNumber || undefined, expiryDate: d.expiryDate || undefined };
      })
      .filter(Boolean) as { itemId: string; quantityReceived: number; unitCost?: number; lotNumber?: string; expiryDate?: string }[];
    if (!receipts.length) return;
    setSubmitting(true);
    receivePO(receipts)?.then(() => { setDrafts({}); setSubmitting(false); }).catch(() => setSubmitting(false));
  };

  const submitInvoice = () => {
    if (!invoiceNumber.trim()) return;
    setLoggingInvoice(true);
    logInvoice({
      invoiceNumber: invoiceNumber.trim(),
      invoiceAmount: invoiceAmount ? Number(invoiceAmount) : undefined,
      invoiceDueDate: invoiceDueDate || undefined,
    })?.then(() => { setInvoiceNumber(''); setInvoiceAmount(''); setInvoiceDueDate(''); setLoggingInvoice(false); }).catch(() => setLoggingInvoice(false));
  };

  const submitRequestPayment = () => {
    if (!paymentMethod || (!paymentReference.trim() && !paymentEvidence)) return;
    setRequestingPayment(true);
    requestPayment({ paymentMethod, paymentReference: paymentReference.trim() || undefined, paymentEvidence: paymentEvidence || undefined })
      ?.then(() => { setPaymentMethod(''); setPaymentReference(''); setPaymentEvidence(null); setRequestingPayment(false); })
      .catch(() => setRequestingPayment(false));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <Link href={`/${locale}/inventory?tab=purchaseOrders`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {t('purchaseOrders.title')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{po.poNumber}</p>
            <p className="text-sm text-slate-500">{po.supplier?.name} → {po.location?.name}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
            {t(`purchaseOrders.${statusKey(po.status)}`)}
          </span>
        </div>

        {po.poInvoiceNumber && (
          <div className="text-sm">
            <p className="font-mono font-semibold text-slate-800">{po.poInvoiceNumber}</p>
            <p className="text-xs text-slate-400">{t('purchaseOrders.supplierInvoiceNumber')}: {po.invoiceNumber}</p>
          </div>
        )}

        {canManage && po.status === 'draft' && (
          <button onClick={() => sendPO()} className="h-9 px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold">{t('purchaseOrders.send')}</button>
        )}

        {canManage && po.status === 'pending' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('purchaseOrders.logInvoice')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input placeholder={t('purchaseOrders.supplierInvoiceNumber')}
                value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9 w-48 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" placeholder={t('purchaseOrders.invoiceAmount')}
                value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)}
                className="h-9 w-32 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="date" title={t('purchaseOrders.invoiceDueDate')}
                value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <button onClick={submitInvoice} disabled={loggingInvoice || !invoiceNumber.trim()}
                className="h-9 px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-50">
                {loggingInvoice ? t('common.saving') : t('purchaseOrders.logInvoice')}
              </button>
            </div>
          </div>
        )}

        {po.paymentStatus === 'rejected' && (
          <div className="text-sm pt-1 bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="font-semibold text-red-600">{t('purchaseOrders.paymentRejected')}</p>
            {po.paymentRejectionReason && <p className="text-xs text-red-500 mt-0.5">{po.paymentRejectionReason}</p>}
          </div>
        )}

        {canManage && po.status === 'received' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('purchaseOrders.requestPayment')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-xs">
                <option value="">{t('purchaseOrders.paymentMethod')}</option>
                <option value="bank_transfer">{t('purchaseOrders.bankTransfer')}</option>
                <option value="mpesa">{t('purchaseOrders.mpesa')}</option>
                <option value="cash">{t('purchaseOrders.cash')}</option>
                <option value="cheque">{t('purchaseOrders.cheque')}</option>
              </select>
              <input placeholder={t('purchaseOrders.paymentReference')}
                value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                className="h-9 w-48 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="file" onChange={(e) => setPaymentEvidence(e.target.files?.[0] ?? null)}
                className="text-xs text-slate-600" />
              <button onClick={submitRequestPayment} disabled={requestingPayment || !paymentMethod || (!paymentReference.trim() && !paymentEvidence)}
                className="h-9 px-4 rounded-lg bg-slate-700 text-white text-sm font-semibold disabled:opacity-50">
                {requestingPayment ? t('common.saving') : t('purchaseOrders.requestPayment')}
              </button>
            </div>
            <p className="text-xs text-slate-400">{t('purchaseOrders.paymentEvidenceHint')}</p>
          </div>
        )}

        {po.status === 'pending_payment_approval' && (
          <div className="text-sm pt-1 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="font-semibold text-amber-700">{t('purchaseOrders.paymentPendingApproval')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('purchaseOrders.paymentReference')}: {po.paymentReference || '—'} · {po.paymentMethod}</p>
          </div>
        )}

        {po.paymentStatus === 'paid' && (
          <div className="text-sm pt-1">
            <p className="font-semibold text-emerald-600">{t('purchaseOrders.paid')}</p>
            <p className="text-xs text-slate-400">{t('purchaseOrders.paymentReference')}: {po.paymentReference} · {po.paymentMethod}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5">{t('items.itemName')}</th>
              <th className="px-4 py-2.5 text-right">{t('purchaseOrders.quantityOrdered')}</th>
              <th className="px-4 py-2.5 text-right">{t('purchaseOrders.quantityReceived')}</th>
              <th className="px-4 py-2.5 text-right">{t('purchaseOrders.unitCost')}</th>
              {canReceive && RECEIVABLE_STATUSES.includes(po.status) && <th className="px-4 py-2.5">{t('purchaseOrders.receive')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {po.items.map((line) => {
              const remaining = line.quantityOrdered - line.quantityReceived;
              const tracked = line.item?.trackingMode && line.item.trackingMode !== 'none';
              return (
                <tr key={line.itemId}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{line.item?.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{line.item?.sku}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{line.quantityOrdered}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{line.quantityReceived}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{line.unitCost}</td>
                  {canReceive && RECEIVABLE_STATUSES.includes(po.status) && (
                    <td className="px-4 py-2.5">
                      {remaining > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <input type="number" placeholder={String(remaining)} max={remaining}
                            value={draftFor(line.itemId).quantityReceived}
                            onChange={(e) => setDraft(line.itemId, { quantityReceived: e.target.value })}
                            className="w-16 h-8 border border-slate-200 rounded px-2 text-xs" />
                          <input type="number" placeholder={t('purchaseOrders.unitCost')}
                            value={draftFor(line.itemId).unitCost}
                            onChange={(e) => setDraft(line.itemId, { unitCost: e.target.value })}
                            className="w-20 h-8 border border-slate-200 rounded px-2 text-xs" />
                          {tracked && (
                            <>
                              <input placeholder={t('purchaseOrders.lotNumber')}
                                value={draftFor(line.itemId).lotNumber}
                                onChange={(e) => setDraft(line.itemId, { lotNumber: e.target.value })}
                                className="w-24 h-8 border border-slate-200 rounded px-2 text-xs" />
                              {line.item && (
                                <input type="date" title={t('purchaseOrders.expiryDate')}
                                  value={draftFor(line.itemId).expiryDate}
                                  onChange={(e) => setDraft(line.itemId, { expiryDate: e.target.value })}
                                  className="h-8 border border-slate-200 rounded px-2 text-xs" />
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">✓</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canReceive && RECEIVABLE_STATUSES.includes(po.status) && (
        <div className="flex justify-end">
          <button onClick={submitReceive} disabled={submitting} className="h-9 px-5 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-50">
            {submitting ? t('common.saving') : t('purchaseOrders.receive')}
          </button>
        </div>
      )}
    </div>
  );
}
