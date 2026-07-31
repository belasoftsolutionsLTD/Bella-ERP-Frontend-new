'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useInventorySuppliers } from '../Hooks/useInventorySuppliers';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import type { Supplier, InventoryAccessLevel } from '../types';

function SupplierFormModal({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { createSupplier, updateSupplier } = useInventorySuppliers();
  const { items } = useInventoryItems();
  const [form, setForm] = useState({
    name: supplier?.name || '', contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '', email: supplier?.email || '', address: supplier?.address || '',
    leadTimeDays: supplier?.leadTimeDays ?? 0,
    linkedItemIds: supplier?.linkedItemIds || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleItem = (id: string) => setForm((f) => ({
    ...f, linkedItemIds: f.linkedItemIds.includes(id) ? f.linkedItemIds.filter((i) => i !== id) : [...f.linkedItemIds, id],
  }));

  const save = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const done = () => { setSaving(false); onClose(); };
    (supplier ? updateSupplier(supplier._id, form) : createSupplier(form))?.then(done).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-bold text-slate-900">{supplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('suppliers.supplierName')}</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('suppliers.contactPerson')}</label>
            <input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('suppliers.phone')}</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('suppliers.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs text-slate-500">{t('suppliers.address')}</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('suppliers.leadTimeDays')}</label>
            <input type="number" value={form.leadTimeDays} onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: Number(e.target.value) }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('suppliers.linkedItems')}</label>
          <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
            {items.map((i) => (
              <label key={i._id} className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.linkedItemIds.includes(i._id)} onChange={() => toggleItem(i._id)} />
                {i.sku} — {i.name}
              </label>
            ))}
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

export function SuppliersTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const { suppliers, isLoading, deleteSupplier } = useInventorySuppliers();
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const canEdit = level === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('suppliers.title')}</h3>
        {canEdit && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('suppliers.addSupplier')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : suppliers.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('suppliers.noSuppliers')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suppliers.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              <p className="font-semibold text-sm text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{s.contactPerson}</p>
              <p className="text-xs text-slate-400">{s.phone} {s.email && `· ${s.email}`}</p>
              <p className="text-xs text-slate-400">{t('suppliers.leadTimeDays')}: {s.leadTimeDays}</p>
              {(s.linkedItems?.length ?? 0) > 0 && (
                <p className="text-xs text-slate-400">{t('suppliers.linkedItems')}: {s.linkedItems!.map((i) => i.sku).join(', ')}</p>
              )}
              {canEdit && (
                <div className="flex items-center gap-1 pt-2">
                  <button onClick={() => setEditing(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteSupplier(s._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && <SupplierFormModal supplier={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
