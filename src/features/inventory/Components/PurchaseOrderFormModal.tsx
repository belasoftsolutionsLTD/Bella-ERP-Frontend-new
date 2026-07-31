'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { useInventoryPurchaseOrders } from '../Hooks/useInventoryPurchaseOrders';
import { useInventorySuppliers } from '../Hooks/useInventorySuppliers';
import { useInventoryLocations } from '../Hooks/useInventoryLocations';
import { useInventoryItems } from '../Hooks/useInventoryItems';

interface Line { itemId: string; quantityOrdered: string; unitCost: string }

export function PurchaseOrderFormModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { createPO } = useInventoryPurchaseOrders();
  const { suppliers } = useInventorySuppliers();
  const { locations } = useInventoryLocations();
  const { items } = useInventoryItems();
  const [supplierId, setSupplierId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lines, setLines] = useState<Line[]>([{ itemId: '', quantityOrdered: '', unitCost: '' }]);
  const [saving, setSaving] = useState(false);

  const addLine = () => setLines((l) => [...l, { itemId: '', quantityOrdered: '', unitCost: '' }]);
  const removeLine = (idx: number) => setLines((l) => l.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<Line>) => setLines((l) => l.map((line, i) => (i === idx ? { ...line, ...patch } : line)));

  const lineAmount = (line: Line) => (Number(line.quantityOrdered) || 0) * (Number(line.unitCost) || 0);
  const orderTotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);

  const save = () => {
    const validLines = lines.filter((l) => l.itemId && Number(l.quantityOrdered) > 0);
    if (!supplierId || !locationId || !validLines.length) return;
    setSaving(true);
    createPO({
      supplierId, locationId, expectedDeliveryDate: expectedDeliveryDate || null,
      items: validLines.map((l) => ({ itemId: l.itemId, quantityOrdered: Number(l.quantityOrdered), unitCost: Number(l.unitCost) || 0 })),
    })?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-bold text-slate-900">{t('purchaseOrders.addPO')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('purchaseOrders.supplier')}</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              <option value="">{t('common.select')}</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('purchaseOrders.location')}</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              <option value="">{t('common.select')}</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs text-slate-500">{t('purchaseOrders.expectedDelivery')}</label>
            <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-500">{t('purchaseOrders.items')}</label>
            <button onClick={addLine} className="flex items-center gap-1 text-xs text-brand-primary font-semibold"><Plus className="h-3 w-3" /> {t('common.add')}</button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_80px_90px_28px] gap-2 items-center">
              <select value={line.itemId} onChange={(e) => updateLine(idx, { itemId: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs">
                <option value="">{t('common.select')}</option>
                {items.map((i) => <option key={i._id} value={i._id}>{i.sku} — {i.name}</option>)}
              </select>
              <input type="number" placeholder={t('purchaseOrders.quantityOrdered')} value={line.quantityOrdered} onChange={(e) => updateLine(idx, { quantityOrdered: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="number" placeholder={t('purchaseOrders.unitCost')} value={line.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <span className="h-9 flex items-center justify-end px-2 text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg" title={t('purchaseOrders.lineTotal')}>
                {lineAmount(line).toLocaleString()}
              </span>
              <button onClick={() => removeLine(idx)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-500">{t('purchaseOrders.orderTotal')}</span>
            <span className="text-sm font-bold text-slate-900">{orderTotal.toLocaleString()}</span>
          </div>
        </div>

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
