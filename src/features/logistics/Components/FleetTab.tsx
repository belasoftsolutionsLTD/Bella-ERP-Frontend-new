'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, MapPin, Wrench, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useVehicles, useFleetUtilization, useVehicleTypes } from '../Hooks/useLogisticsConfig';
import type { LogisticsAccessLevel, VehicleStatus } from '../types';

const STATUS_CLS: Record<VehicleStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-200 text-slate-500',
};

function useDriverOptions() {
  const [employees, setEmployees] = useState<{ _id: string; fullName: string }[]>([]);
  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=200&designation=driver`, showToast: false,
      thenFn: (r) => setEmployees((r.data?.data ?? r.data ?? []).map((e: any) => ({ _id: e._id, fullName: e.fullName }))),
    });
  }, []);
  return employees;
}

function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Logistics');
  const { createVehicle } = useVehicles();
  const { vehicleTypes } = useVehicleTypes();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!make.trim() || !model.trim() || !licensePlate.trim()) return;
    setSaving(true);
    createVehicle({ make: make.trim(), model: model.trim(), licensePlate: licensePlate.trim(), vin: vin.trim() || undefined, vehicleType: vehicleType || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">{t('fleet.addVehicle')}</p>
        <input value={make} onChange={(e) => setMake(e.target.value)} placeholder={t('fleet.make')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={t('fleet.model')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder={t('fleet.licensePlate')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder={t('fleet.vin')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
          <option value="">{t('fleet.vehicleType')}</option>
          {vehicleTypes.map((vt) => <option key={vt._id} value={vt.name}>{vt.name}</option>)}
        </select>
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

function VehicleRow({ vehicle, level }: { vehicle: any; level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { assignDriver, updateStatus, updateLocation } = useVehicles();
  const [editingDriver, setEditingDriver] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [location, setLocation] = useState(vehicle.currentLocation || '');
  const employees = useDriverOptions();
  const canManage = level === 'admin' || level === 'opsAdmin';

  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">
        {vehicle.make} {vehicle.model}
        {vehicle.vehicleType && <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{vehicle.vehicleType}</span>}
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-500 font-mono">{vehicle.licensePlate}</td>
      <td className="px-4 py-2.5">
        {editingDriver && canManage ? (
          <select autoFocus defaultValue={vehicle.driverId || ''}
            onChange={(e) => { assignDriver(vehicle._id, e.target.value || null); setEditingDriver(false); }}
            onBlur={() => setEditingDriver(false)}
            className="h-8 border border-slate-200 rounded-lg px-2 text-xs">
            <option value="">{t('fleet.unassigned')}</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
          </select>
        ) : (
          <button onClick={() => canManage && setEditingDriver(true)} className="flex items-center gap-1 text-xs text-slate-600 hover:text-brand-primary">
            <User className="h-3 w-3" /> {vehicle.driverName || t('fleet.unassigned')}
          </button>
        )}
      </td>
      <td className="px-4 py-2.5">
        {canManage ? (
          <select value={vehicle.status} onChange={(e) => updateStatus(vehicle._id, e.target.value)}
            className={cn('text-[11px] font-bold px-2 py-1 rounded-full border-0', STATUS_CLS[vehicle.status as VehicleStatus])}>
            <option value="active">{t('fleet.active')}</option>
            <option value="maintenance">{t('fleet.maintenance')}</option>
            <option value="inactive">{t('fleet.inactive')}</option>
          </select>
        ) : (
          <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full', STATUS_CLS[vehicle.status as VehicleStatus])}>{t(`fleet.${vehicle.status}`)}</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        {editingLocation ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={location} onChange={(e) => setLocation(e.target.value)}
              className="h-8 w-40 border border-slate-200 rounded-lg px-2 text-xs" />
            <button onClick={() => { updateLocation(vehicle._id, location); setEditingLocation(false); }} className="text-xs text-brand-primary font-semibold">{t('common.save')}</button>
          </div>
        ) : (
          <button onClick={() => setEditingLocation(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-primary">
            <MapPin className="h-3 w-3" /> {vehicle.currentLocation || t('fleet.noLocation')}
          </button>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-slate-400">{vehicle.odometer?.toLocaleString() ?? 0}</td>
    </tr>
  );
}

export function FleetTab({ level }: { level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { vehicles, isLoading } = useVehicles();
  const { utilization } = useFleetUtilization();
  const [showAdd, setShowAdd] = useState(false);
  const canCreate = level === 'admin';

  return (
    <div className="space-y-4">
      {utilization && (level === 'admin' || level === 'opsAdmin') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-lg font-bold text-slate-900">{utilization.totalVehicles}</p>
            <p className="text-xs text-slate-500">{t('fleet.totalVehicles')}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-lg font-bold text-emerald-600">{utilization.byStatus.active || 0}</p>
            <p className="text-xs text-slate-500">{t('fleet.active')}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-lg font-bold text-amber-600">{utilization.byStatus.maintenance || 0}</p>
            <p className="text-xs text-slate-500">{t('fleet.maintenance')}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-lg font-bold text-slate-900">{utilization.assignedCount}/{utilization.totalVehicles}</p>
            <p className="text-xs text-slate-500">{t('fleet.assigned')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{t('fleet.title')}</p>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('fleet.addVehicle')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5">{t('fleet.vehicle')}</th>
              <th className="px-4 py-2.5">{t('fleet.licensePlate')}</th>
              <th className="px-4 py-2.5">{t('fleet.driver')}</th>
              <th className="px-4 py-2.5">{t('common.status')}</th>
              <th className="px-4 py-2.5">{t('fleet.location')}</th>
              <th className="px-4 py-2.5">{t('fleet.odometer')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">{t('common.loading')}</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">{t('fleet.noVehicles')}</td></tr>
            ) : (
              vehicles.map((v) => <VehicleRow key={v._id} vehicle={v} level={level} />)
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
