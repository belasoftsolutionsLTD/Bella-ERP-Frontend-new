'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { useInventoryLocations, useStockLevels } from '../Hooks/useInventoryLocations';
import type { InventoryLocation, InventoryAccessLevel } from '../types';

function LocationFormModal({ location, onClose }: { location: InventoryLocation | null; onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { createLocation, updateLocation } = useInventoryLocations();
  const [form, setForm] = useState({
    name: location?.name || '', type: location?.type || 'warehouse',
    address: location?.address || '', department: location?.department || '',
  });
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const done = () => { setSaving(false); onClose(); };
    (location ? updateLocation(location._id, form) : createLocation(form))?.then(done).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{location ? t('locations.editLocation') : t('locations.addLocation')}</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('locations.locationName')}</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('locations.type')}</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InventoryLocation['type'] }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm">
            <option value="warehouse">{t('locations.warehouse')}</option>
            <option value="store">{t('locations.store')}</option>
            <option value="room">{t('locations.room')}</option>
            <option value="other">{t('locations.other')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('locations.address')}</label>
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('locations.department')}</label>
          <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
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

export function LocationsTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const { locations, isLoading, deleteLocation } = useInventoryLocations();
  const { stockLevels } = useStockLevels();
  const [editing, setEditing] = useState<InventoryLocation | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<InventoryLocation | null>(null);
  const canEdit = level === 'admin';

  const stockByLocation = (locationId: string) => stockLevels.filter((s) => s.locationId === locationId).reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('locations.title')}</h3>
        {canEdit && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('locations.addLocation')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : locations.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('locations.noLocations')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <div key={loc._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-slate-900">{loc.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-slate-500 capitalize">{loc.type}</span>
              </div>
              {loc.address && <p className="text-xs text-slate-400">{loc.address}</p>}
              <p className="text-xs text-slate-500 pt-1">{t('stockLevels.quantity')}: <span className="font-semibold text-slate-700">{stockByLocation(loc._id).toLocaleString()}</span></p>
              {canEdit && (
                <div className="flex items-center gap-1 pt-2">
                  <button onClick={() => setEditing(loc)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleting(loc)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && <LocationFormModal location={editing} onClose={() => setEditing(undefined)} />}
      {deleting && (
        <ConfirmDialog
          title={t('locations.deleteLocation')}
          message={t('locations.deleteConfirm')}
          confirmLabel={t('common.delete')}
          variant="danger"
          onConfirm={() => { deleteLocation(deleting._id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
