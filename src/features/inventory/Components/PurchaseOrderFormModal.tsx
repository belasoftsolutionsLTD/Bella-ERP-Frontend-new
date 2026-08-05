'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { useInventoryPurchaseOrders } from '../Hooks/useInventoryPurchaseOrders';
import { useInventorySuppliers } from '../Hooks/useInventorySuppliers';
import { useInventoryLocations } from '../Hooks/useInventoryLocations';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import { fetchAsBlobUrl } from '@/functions/downloadFile';
import type { InventoryItem } from '../types';

interface Line { itemId: string; itemLabel: string; itemImageUrl: string | null; quantityOrdered: string; unitCost: string }

// Small thumbnail for the currently-picked item — imageUrl is served behind the same
// JWT-gated /uploads route as everything else, so a plain <img src> can't use it
// directly; fetched once as an authenticated blob the same way payslip/receipt PDFs
// already are elsewhere in the app.
function ItemThumb({ imageUrl }: { imageUrl: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    if (imageUrl) fetchAsBlobUrl(imageUrl).then((url) => { revoke = url; setSrc(url); }).catch(() => setSrc(null));
    else setSrc(null);
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [imageUrl]);
  return src
    ? <img src={src} alt="" className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0" />
    : <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-slate-300" /></div>;
}

// Search-as-you-type item picker — the previous plain <select> only ever listed the
// first page of items with no way to search, unusable for a catalog of any real size.
// One instance per line (each needs its own search text + own fetched result set, so
// this has to be a real component, not inlined in a .map — rules of hooks).
function ItemPicker({ line, onPick }: { line: Line; onPick: (item: Pick<InventoryItem, '_id' | 'sku' | 'name' | 'imageUrl'>) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const { items, isLoading } = useInventoryItems({ search: debounced || undefined });

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-slate-300 absolute left-2 top-1/2 -translate-y-1/2" />
        <input
          value={open ? query : line.itemLabel}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          placeholder="Search by SKU or name…"
          className="h-9 w-full border border-slate-200 rounded-lg pl-7 pr-2 text-xs"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-72 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No items match.</p>
          ) : (
            items.map((i: any) => (
              <button
                type="button" key={i._id}
                onClick={() => { onPick(i); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
              >
                <ItemThumb imageUrl={i.imageUrl} />
                <span className="text-xs text-slate-700 truncate">{i.sku} — {i.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PurchaseOrderFormModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { createPO } = useInventoryPurchaseOrders();
  const { suppliers } = useInventorySuppliers();
  const { locations } = useInventoryLocations();
  const [supplierId, setSupplierId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lines, setLines] = useState<Line[]>([{ itemId: '', itemLabel: '', itemImageUrl: null, quantityOrdered: '', unitCost: '' }]);
  const [saving, setSaving] = useState(false);

  const addLine = () => setLines((l) => [...l, { itemId: '', itemLabel: '', itemImageUrl: null, quantityOrdered: '', unitCost: '' }]);
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
            <div key={idx} className="grid grid-cols-[1fr_80px_80px_90px_28px] gap-2 items-start">
              <div className="flex items-center gap-2">
                {line.itemId && <ItemThumb imageUrl={line.itemImageUrl} />}
                <div className="flex-1">
                  <ItemPicker
                    line={line}
                    onPick={(i) => updateLine(idx, { itemId: i._id, itemLabel: `${i.sku} — ${i.name}`, itemImageUrl: i.imageUrl })}
                  />
                </div>
              </div>
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
