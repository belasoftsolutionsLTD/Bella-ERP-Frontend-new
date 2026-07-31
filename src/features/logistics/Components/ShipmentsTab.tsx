'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShipments } from '../Hooks/useShipments';
import type { LogisticsAccessLevel, ShipmentStatus } from '../types';

const STATUS_CLS: Record<ShipmentStatus, string> = {
  pending: 'bg-slate-100 text-slate-500',
  picked_up: 'bg-sky-100 text-sky-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  exception: 'bg-red-100 text-red-600',
};
const TRANSITIONABLE: ShipmentStatus[] = ['pending', 'picked_up', 'in_transit', 'out_for_delivery'];

function AddShipmentModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Logistics');
  const { createShipment } = useShipments();
  const [sourceType, setSourceType] = useState('standalone');
  const [sourceId, setSourceId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    createShipment({ sourceType, sourceId: sourceType === 'standalone' ? undefined : sourceId.trim(), expectedDeliveryDate: expectedDeliveryDate || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{t('shipments.addShipment')}</p>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
          <option value="standalone">{t('shipments.standalone')}</option>
          <option value="inventory_transfer">{t('shipments.inventoryTransfer')}</option>
          <option value="pos_sale">{t('shipments.posSale')}</option>
        </select>
        {sourceType !== 'standalone' && (
          <input value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder={t('shipments.sourceIdHint')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        )}
        <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShipmentRow({ shipment, canManage }: { shipment: any; canManage: boolean }) {
  const t = useTranslations('Logistics');
  const { updateStatus, markDelivered, flagException, resolveException } = useShipments();
  const [showException, setShowException] = useState(false);
  const [reason, setReason] = useState('');

  const nextStatus = TRANSITIONABLE[TRANSITIONABLE.indexOf(shipment.status) + 1];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{t(`shipments.sourceTypes.${shipment.sourceType}`)}</p>
          {shipment.expectedDeliveryDate && <p className="text-xs text-slate-400">{t('shipments.expected')}: {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}</p>}
        </div>
        <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full shrink-0', STATUS_CLS[shipment.status as ShipmentStatus])}>{t(`shipments.status.${shipment.status}`)}</span>
      </div>

      {shipment.status === 'exception' && shipment.exceptionReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {shipment.exceptionReason}</p>
      )}

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {nextStatus && shipment.status !== 'exception' && (
            <button onClick={() => updateStatus(shipment._id, nextStatus)} className="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">
              → {t(`shipments.status.${nextStatus}`)}
            </button>
          )}
          {shipment.status !== 'delivered' && shipment.status !== 'exception' && (
            <button onClick={() => markDelivered(shipment._id)} className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('shipments.markDelivered')}
            </button>
          )}
          {shipment.status === 'exception' ? (
            <button onClick={() => resolveException(shipment._id, 'resolved')} className="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">
              {t('shipments.resolveException')}
            </button>
          ) : shipment.status !== 'delivered' && (
            showException ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('shipments.exceptionReason')} className="h-8 border border-slate-200 rounded-lg px-2 text-xs" />
                <button onClick={() => { flagException(shipment._id, reason); setShowException(false); setReason(''); }} className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-semibold">{t('common.save')}</button>
              </div>
            ) : (
              <button onClick={() => setShowException(true)} className="flex items-center gap-1 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> {t('shipments.flagException')}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function ShipmentsTab({ level }: { level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { shipments, isLoading } = useShipments();
  const [showAdd, setShowAdd] = useState(false);
  const canCreate = level === 'admin' || level === 'opsAdmin';
  const canManage = level === 'admin' || level === 'opsAdmin' || level === 'manager';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{t('shipments.title')}</p>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('shipments.addShipment')}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">{t('common.loading')}</p>
      ) : shipments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('shipments.none')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shipments.map((s) => <ShipmentRow key={s._id} shipment={s} canManage={canManage} />)}
        </div>
      )}

      {showAdd && <AddShipmentModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
