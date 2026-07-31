'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Pencil, Archive, Image as ImageIcon, Loader2, Layers } from 'lucide-react';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import { useInventoryCategories, useInventoryBrands, useUnitsOfMeasure } from '../Hooks/useInventoryConfig';
import { useCustomFieldDefs } from '../Hooks/useInventoryConfig';
import { ItemFormDrawer } from './ItemFormDrawer';
import { LotTraceabilityModal } from './LotTraceabilityModal';
import type { InventoryItem, InventoryAccessLevel } from '../types';

export function ItemsTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<InventoryItem | null | undefined>(undefined);
  const [tracing, setTracing] = useState<InventoryItem | null>(null);
  const [archiving, setArchiving] = useState<InventoryItem | null>(null);
  const { items, isLoading, archiveItem, uploadItemImage } = useInventoryItems({ search, category });
  const { categories } = useInventoryCategories();
  const { brands } = useInventoryBrands();
  const { units } = useUnitsOfMeasure();
  const { fieldDefs } = useCustomFieldDefs();
  const canEdit = level === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('items.searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
            <option value="">{t('items.category')}</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {canEdit && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('items.addItem')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('items.noItems')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('items.sku')}</th>
                <th className="px-4 py-2.5">{t('items.itemName')}</th>
                <th className="px-4 py-2.5">{t('items.category')}</th>
                <th className="px-4 py-2.5">{t('items.unitOfMeasure')}</th>
                <th className="px-4 py-2.5 text-right">{t('items.costPrice')}</th>
                <th className="px-4 py-2.5 text-right">{t('items.salePrice')}</th>
                {canEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{item.sku}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{item.category || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{item.unitOfMeasure}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{item.costPrice.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{item.salePrice.toLocaleString()}</td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {item.trackingMode !== 'none' && (
                          <button onClick={() => setTracing(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10" title={t('lots.title')}>
                            <Layers className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <label className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer" title={t('items.uploadImage')}>
                          <ImageIcon className="h-3.5 w-3.5" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadItemImage(item._id, f); }} />
                        </label>
                        <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setArchiving(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && (
        <ItemFormDrawer item={editing} categories={categories} brands={brands} units={units} fieldDefs={fieldDefs} onClose={() => setEditing(undefined)} />
      )}
      {tracing && <LotTraceabilityModal item={tracing} onClose={() => setTracing(null)} />}
      {archiving && (
        <ConfirmDialog
          title={t('items.archiveItem')}
          message={t('items.archiveConfirm')}
          confirmLabel={t('common.archive')}
          variant="danger"
          onConfirm={() => { archiveItem(archiving._id); setArchiving(null); }}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
