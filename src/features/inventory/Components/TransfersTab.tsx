'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Check, X as XIcon, PackageCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryTransfers } from '../Hooks/useInventoryTransfers';
import { useInventoryLocations } from '../Hooks/useInventoryLocations';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import type { InventoryAccessLevel, StockTransfer, TransferStatus } from '../types';

const STATUS_CLS: Record<TransferStatus, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  received: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
};

interface ItemLine { itemId: string; quantity: string }

function RequestTransferModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { requestTransfer } = useInventoryTransfers();
  const { locations } = useInventoryLocations();
  const { items } = useInventoryItems();
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [lines, setLines] = useState<ItemLine[]>([{ itemId: '', quantity: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateLine = (i: number, patch: Partial<ItemLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { itemId: '', quantity: '' }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const validLines = lines.filter((l) => l.itemId && Number(l.quantity) > 0);

  const save = () => {
    if (!fromLocationId || !toLocationId || !validLines.length) return;
    setSaving(true);
    requestTransfer({
      fromLocationId, toLocationId, notes,
      items: validLines.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
    })?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <p className="text-sm font-bold text-slate-900">{t('transfers.requestTransfer')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('transfers.from')}</label>
            <select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              <option value="">{t('common.select')}</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('transfers.to')}</label>
            <select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              <option value="">{t('common.select')}</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">{t('items.itemName')} &amp; {t('transfers.quantity')}</label>
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select value={line.itemId} onChange={(e) => updateLine(i, { itemId: e.target.value })}
                className="h-9 flex-1 border border-slate-200 rounded-lg px-2 text-sm">
                <option value="">{t('common.select')}</option>
                {items.map((it) => <option key={it._id} value={it._id}>{it.sku} — {it.name}</option>)}
              </select>
              <input type="number" placeholder={t('transfers.quantity')} value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
                className="h-9 w-24 border border-slate-200 rounded-lg px-2 text-sm" />
              <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                className="h-9 w-9 shrink-0 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLine} className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> {t('items.addItem')}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('transfers.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !fromLocationId || !toLocationId || !validLines.length}
            className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectTransferModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const t = useTranslations('Inventory');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{t('transfers.reject')}</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('transfers.rejectionReason')}</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            placeholder={t('transfers.rejectionReasonPlaceholder')}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:border-red-400" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button disabled={!reason.trim() || saving} onClick={() => { setSaving(true); onConfirm(reason.trim()); }}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('transfers.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

type ViewFilter = 'all' | 'mine' | 'needsApproval';

export function TransfersTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<ViewFilter>('all');
  const [rejecting, setRejecting] = useState<StockTransfer | null>(null);
  const { transfers, isLoading, approveTransfer, rejectTransfer, receiveTransfer } = useInventoryTransfers();
  const canFulfil = level === 'admin' || level === 'clerk';

  const visible = transfers.filter((tr) => {
    if (view === 'mine') return String(tr.requestedBy) === String(userData?._id);
    if (view === 'needsApproval') return canFulfil && tr.status === 'requested';
    return true;
  });

  const doReject = (reason: string) => {
    if (!rejecting) return;
    rejectTransfer(rejecting._id, reason)?.then(() => setRejecting(null)).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-slate-900">{t('transfers.title')}</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
          <Plus className="h-4 w-4" /> {t('transfers.requestTransfer')}
        </button>
      </div>

      <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5">
        {(['all', 'mine', 'needsApproval'] as ViewFilter[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === v ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t(`transfers.view.${v}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('transfers.noTransfers')}</div>
      ) : (
        <div className="space-y-2">
          {visible.map((tr) => (
            <div key={tr._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{tr.fromLocation?.name} → {tr.toLocation?.name}</p>
                  <p className="text-xs text-slate-400">
                    {tr.items.map((l) => `${l.item?.sku ?? l.itemId} × ${l.quantity}`).join(', ')}
                  </p>
                  {tr.requestNotes && <p className="text-xs text-slate-400 italic mt-0.5">&quot;{tr.requestNotes}&quot;</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[tr.status]}`}>{t(`transfers.${tr.status}`)}</span>
                  {canFulfil && tr.status === 'requested' && (
                    <>
                      <button onClick={() => approveTransfer(tr._id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" title={t('transfers.approve')}><Check className="h-4 w-4" /></button>
                      <button onClick={() => setRejecting(tr)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title={t('transfers.reject')}><XIcon className="h-4 w-4" /></button>
                    </>
                  )}
                  {canFulfil && tr.status === 'approved' && (
                    <button onClick={() => receiveTransfer(tr._id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-primary text-white text-xs font-semibold">
                      <PackageCheck className="h-3.5 w-3.5" /> {t('transfers.receive')}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                <span>{t('transfers.requestedBy')}: {tr.requestedByName ?? '—'}</span>
                {tr.status === 'approved' && <span>{t('transfers.approvedBy')}: {tr.approvedByName ?? '—'}</span>}
                {tr.status === 'received' && <span>{t('transfers.receivedBy')}: {tr.receivedByName ?? '—'}</span>}
                {tr.status === 'rejected' && <span>{t('transfers.rejectedBy')}: {tr.rejectedByName ?? '—'}</span>}
              </div>
              {tr.status === 'rejected' && tr.rejectionReason && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">{tr.rejectionReason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <RequestTransferModal onClose={() => setShowForm(false)} />}
      {rejecting && <RejectTransferModal onClose={() => setRejecting(null)} onConfirm={doReject} />}
    </div>
  );
}
