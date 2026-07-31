'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useStockLevels, useInventoryLocations } from '../Hooks/useInventoryLocations';
import type { InventoryAccessLevel } from '../types';

export function StockLevelsTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const [locationId, setLocationId] = useState('');
  const { locations } = useInventoryLocations();
  const { stockLevels, isLoading, setReorderPoint } = useStockLevels(locationId ? { locationId } : undefined);
  const [editingReorder, setEditingReorder] = useState<string | null>(null);
  const [reorderValue, setReorderValue] = useState('');
  const canEdit = level === 'admin';

  const saveReorder = (itemId: string, locId: string) => {
    setReorderPoint(itemId, locId, Number(reorderValue) || 0);
    setEditingReorder(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('stockLevels.title')}</h3>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('stockLevels.location')}</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : stockLevels.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('stockLevels.noStock')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">{t('items.itemName')}</th>
                <th className="px-4 py-2.5">{t('stockLevels.location')}</th>
                <th className="px-4 py-2.5 text-right">{t('stockLevels.quantity')}</th>
                <th className="px-4 py-2.5 text-right">{t('stockLevels.reorderPoint')}</th>
                {canEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockLevels.map((s) => {
                const isLow = s.reorderPoint > 0 && s.quantity <= s.reorderPoint;
                const editKey = `${s.itemId}:${s.locationId}`;
                return (
                  <tr key={s._id} className={isLow ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{s.item?.sku}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.item?.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.location?.name}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{s.quantity} {s.item?.unitOfMeasure}</td>
                    <td className="px-4 py-2.5 text-right">
                      {editingReorder === editKey ? (
                        <input autoFocus type="number" value={reorderValue} onChange={(e) => setReorderValue(e.target.value)}
                          onBlur={() => saveReorder(s.itemId, s.locationId)}
                          onKeyDown={(e) => e.key === 'Enter' && saveReorder(s.itemId, s.locationId)}
                          className="w-20 h-7 border border-slate-200 rounded px-2 text-xs text-right" />
                      ) : (
                        <span className="text-slate-500">{s.reorderPoint}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => { setEditingReorder(editKey); setReorderValue(String(s.reorderPoint)); }} className="text-xs text-brand-primary hover:underline">
                          {t('stockLevels.setReorderPoint')}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
