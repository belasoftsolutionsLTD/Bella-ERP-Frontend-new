'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Plus, Loader2 } from 'lucide-react';
import { useStockMovements } from '../Hooks/useInventoryMovements';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import { useInventoryLocations } from '../Hooks/useInventoryLocations';
import { exportMovementsCSV } from '../Hooks/useInventoryReports';
import type { InventoryAccessLevel, MovementType } from '../types';

const MOVEMENT_TYPES: MovementType[] = ['receipt', 'sale', 'adjustment', 'transfer_out', 'transfer_in', 'return'];

function AdjustmentModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { items } = useInventoryItems();
  const { locations } = useInventoryLocations();
  const { createAdjustment } = useStockMovements();
  const [itemId, setItemId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!itemId || !locationId || !quantityChange) return;
    setSaving(true);
    createAdjustment({ itemId, locationId, quantityChange: Number(quantityChange), notes })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{t('movements.recordAdjustment')}</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('items.itemName')}</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('common.select')}</option>
            {items.map((i) => <option key={i._id} value={i._id}>{i.sku} — {i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('stockLevels.location')}</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('common.select')}</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('movements.quantityChange')}</label>
          <input type="number" value={quantityChange} onChange={(e) => setQuantityChange(e.target.value)} placeholder="+10 / -5" className="h-9 border border-slate-200 rounded-lg px-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('movements.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm resize-none" />
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

export function MovementsTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const [itemId, setItemId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const { items } = useInventoryItems();
  const { locations } = useInventoryLocations();
  const { movements, isLoading } = useStockMovements({ itemId, locationId, movementType });
  const canAdjust = level === 'admin' || level === 'clerk';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
            <option value="">{t('movements.filterByItem')}</option>
            {items.map((i) => <option key={i._id} value={i._id}>{i.sku}</option>)}
          </select>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
            <option value="">{t('movements.filterByLocation')}</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
            <option value="">{t('movements.filterByType')}</option>
            {MOVEMENT_TYPES.map((mt) => <option key={mt} value={mt}>{t(`movements.${mt === 'transfer_out' ? 'transferOut' : mt === 'transfer_in' ? 'transferIn' : mt}`)}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportMovementsCSV({ itemId, locationId, movementType })} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
            <Download className="h-4 w-4" /> {t('movements.export')}
          </button>
          {canAdjust && (
            <button onClick={() => setShowAdjustment(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
              <Plus className="h-4 w-4" /> {t('movements.adjustStock')}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : movements.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('movements.noMovements')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('movements.date')}</th>
                <th className="px-4 py-2.5">{t('items.itemName')}</th>
                <th className="px-4 py-2.5">{t('stockLevels.location')}</th>
                <th className="px-4 py-2.5">{t('movements.type')}</th>
                <th className="px-4 py-2.5 text-right">{t('movements.quantityChange')}</th>
                <th className="px-4 py-2.5 text-right">{t('movements.balance')}</th>
                <th className="px-4 py-2.5">{t('movements.performedBy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-700">{m.item?.name} <span className="text-xs text-slate-400 font-mono">({m.item?.sku})</span></td>
                  <td className="px-4 py-2.5 text-slate-500">{m.location?.name}</td>
                  <td className="px-4 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{m.movementType}</span></td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${m.quantityChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{m.balanceAfter}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{m.performedByName || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdjustment && <AdjustmentModal onClose={() => setShowAdjustment(false)} />}
    </div>
  );
}
