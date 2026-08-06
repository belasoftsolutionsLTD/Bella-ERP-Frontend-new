'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, CheckCircle2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkOrders } from '../Hooks/useWorkOrders';
import { useVehicles, useServiceBays } from '../Hooks/useLogisticsConfig';
import { useInventoryItems } from '@/features/inventory/Hooks/useInventoryItems';
import { useInventoryLocations } from '@/features/inventory/Hooks/useInventoryLocations';
import type { LogisticsAccessLevel, WorkOrderStatus } from '../types';

const STATUS_CLS: Record<WorkOrderStatus, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

function AddWorkOrderModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Logistics');
  const { createWorkOrder } = useWorkOrders();
  const { vehicles } = useVehicles();
  const { serviceBays } = useServiceBays();
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('scheduled');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [serviceBay, setServiceBay] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!vehicleId || !description.trim()) return;
    setSaving(true);
    createWorkOrder({ vehicleId, type, description: description.trim(), scheduledDate: scheduledDate || undefined, serviceBay: serviceBay || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{t('maintenance.addWorkOrder')}</p>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
          <option value="">{t('maintenance.selectVehicle')}</option>
          {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} — {v.licensePlate}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
          <option value="scheduled">{t('maintenance.scheduled')}</option>
          <option value="unscheduled">{t('maintenance.unscheduled')}</option>
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('maintenance.description')}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} />
        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        {serviceBays.length > 0 && (
          <select value={serviceBay} onChange={(e) => setServiceBay(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('maintenance.selectServiceBay')}</option>
            {serviceBays.map((sb) => <option key={sb._id} value={sb.name}>{sb.name}</option>)}
          </select>
        )}
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

function AddPartRow({ workOrderId }: { workOrderId: string }) {
  const t = useTranslations('Logistics');
  const { addPart } = useWorkOrders();
  const { items } = useInventoryItems({ category: 'Vehicle Parts' });
  const { locations } = useInventoryLocations();
  const [itemId, setItemId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const add = () => {
    if (!itemId || !locationId || !Number(quantity)) return;
    addPart(workOrderId, { itemId, locationId, quantity: Number(quantity) });
    setItemId(''); setQuantity('1');
  };

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-8 flex-1 border border-slate-200 rounded-lg px-2 text-xs">
        <option value="">{t('maintenance.selectPart')}</option>
        {items.map((i: any) => <option key={i._id} value={i._id}>{i.sku} — {i.name}</option>)}
      </select>
      <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-8 border border-slate-200 rounded-lg px-2 text-xs">
        <option value="">{t('maintenance.location')}</option>
        {locations.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
      </select>
      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8 w-16 border border-slate-200 rounded-lg px-2 text-xs" />
      <button onClick={add} className="h-8 px-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function WorkOrderCard({ order, canManage }: { order: any; canManage: boolean }) {
  const t = useTranslations('Logistics');
  const { completeWorkOrder } = useWorkOrders();
  const [showComplete, setShowComplete] = useState(false);
  const [laborCost, setLaborCost] = useState('0');
  const [otherCost, setOtherCost] = useState('0');
  const [completing, setCompleting] = useState(false);

  const complete = () => {
    setCompleting(true);
    completeWorkOrder(order._id, { laborCost: Number(laborCost) || 0, otherCost: Number(otherCost) || 0 })
      ?.then(() => { setCompleting(false); setShowComplete(false); }).catch(() => setCompleting(false));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{order.description}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t(`maintenance.${order.type}`)} {order.scheduledDate ? `· ${new Date(order.scheduledDate).toLocaleDateString()}` : ''} {order.serviceBay ? `· ${order.serviceBay}` : ''}</p>
        </div>
        <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full shrink-0', STATUS_CLS[order.status as WorkOrderStatus])}>{t(`maintenance.status.${order.status}`)}</span>
      </div>

      {order.partsUsed?.length > 0 && (
        <div className="text-xs text-slate-500">
          {order.partsUsed.map((p: any, i: number) => <div key={i}>{p.quantity}× {p.itemName}</div>)}
        </div>
      )}

      {order.status !== 'completed' && canManage && (
        <>
          <AddPartRow workOrderId={order._id} />
          {showComplete ? (
            <div className="flex items-center gap-2 mt-2">
              <input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder={t('maintenance.laborCost')} className="h-8 w-24 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} placeholder={t('maintenance.otherCost')} className="h-8 w-24 border border-slate-200 rounded-lg px-2 text-xs" />
              <button onClick={complete} disabled={completing} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">
                {completing ? t('common.saving') : t('maintenance.confirmComplete')}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowComplete(true)} className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('maintenance.complete')}
            </button>
          )}
        </>
      )}
      {order.status === 'completed' && (
        <p className="text-xs text-slate-500">{t('maintenance.totalCost')}: {order.totalCost?.toLocaleString()}</p>
      )}
    </div>
  );
}

export function MaintenanceTab({ level }: { level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { workOrders, isLoading } = useWorkOrders();
  const [showAdd, setShowAdd] = useState(false);
  const canManage = level === 'admin' || level === 'opsAdmin';

  if (level !== 'admin' && level !== 'opsAdmin') {
    return <p className="text-sm text-slate-400 text-center py-16">{t('common.notAuthorized')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Wrench className="h-4 w-4" /> {t('maintenance.title')}</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
          <Plus className="h-4 w-4" /> {t('maintenance.addWorkOrder')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">{t('common.loading')}</p>
      ) : workOrders.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('maintenance.none')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workOrders.map((o) => <WorkOrderCard key={o._id} order={o} canManage={canManage} />)}
        </div>
      )}

      {showAdd && <AddWorkOrderModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
