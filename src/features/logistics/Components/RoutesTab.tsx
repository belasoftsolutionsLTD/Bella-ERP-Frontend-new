'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, ChevronRight, Camera, PenLine, CheckCircle2, XCircle, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useRoutes } from '../Hooks/useRoutes';
import { useVehicles } from '../Hooks/useLogisticsConfig';
import type { LogisticsAccessLevel, RouteStatus, StopStatus } from '../types';

const ROUTE_STATUS_CLS: Record<RouteStatus, string> = {
  planned: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};
const STOP_STATUS_CLS: Record<StopStatus, string> = {
  pending: 'bg-slate-100 text-slate-500',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-600',
  rescheduled: 'bg-amber-100 text-amber-700',
};

function useEmployeeOptions() {
  const [employees, setEmployees] = useState<{ _id: string; fullName: string }[]>([]);
  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=200`, showToast: false,
      thenFn: (r) => setEmployees((r.data?.data ?? r.data ?? []).map((e: any) => ({ _id: e._id, fullName: e.fullName }))),
    });
  }, []);
  return employees;
}

function AddRouteModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Logistics');
  const { createRoute } = useRoutes();
  const { vehicles } = useVehicles();
  const employees = useEmployeeOptions();
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState('');
  const [stops, setStops] = useState([{ address: '', timeWindowStart: '', timeWindowEnd: '' }]);
  const [saving, setSaving] = useState(false);

  const addStop = () => setStops((s) => [...s, { address: '', timeWindowStart: '', timeWindowEnd: '' }]);
  const updateStop = (i: number, patch: Partial<(typeof stops)[number]>) => setStops((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  const removeStop = (i: number) => setStops((s) => s.filter((_, idx) => idx !== i));

  const save = () => {
    const validStops = stops.filter((s) => s.address.trim());
    if (!vehicleId || !driverId || !date || !validStops.length) return;
    setSaving(true);
    createRoute({ vehicleId, driverId, date, stops: validStops })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-bold text-slate-900">{t('routes.addRoute')}</p>
        <div className="grid grid-cols-2 gap-3">
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('routes.selectVehicle')}</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} — {v.licensePlate}</option>)}
          </select>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="">{t('routes.selectDriver')}</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 col-span-2 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-500">{t('routes.stops')}</label>
            <button onClick={addStop} className="flex items-center gap-1 text-xs text-brand-primary font-semibold"><Plus className="h-3 w-3" /> {t('common.add')}</button>
          </div>
          {stops.map((stop, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_90px_28px] gap-2 items-center">
              <input value={stop.address} onChange={(e) => updateStop(i, { address: e.target.value })} placeholder={t('routes.address')} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="time" value={stop.timeWindowStart} onChange={(e) => updateStop(i, { timeWindowStart: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <input type="time" value={stop.timeWindowEnd} onChange={(e) => updateStop(i, { timeWindowEnd: e.target.value })} className="h-9 border border-slate-200 rounded-lg px-2 text-xs" />
              <button onClick={() => removeStop(i)} className="text-slate-300 hover:text-red-500 text-xs">✕</button>
            </div>
          ))}
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

function StopRow({ routeId, stop }: { routeId: string; stop: any }) {
  const t = useTranslations('Logistics');
  const { updateStopStatus, uploadProofOfDelivery } = useRoutes();
  const photoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);
  const isTerminal = stop.status === 'delivered' || stop.status === 'failed';

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800 truncate">{stop.sequence}. {stop.address}</p>
        {(stop.timeWindowStart || stop.timeWindowEnd) && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {stop.timeWindowStart}–{stop.timeWindowEnd}</p>
        )}
      </div>
      <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full shrink-0', STOP_STATUS_CLS[stop.status as StopStatus])}>{t(`routes.stopStatus.${stop.status}`)}</span>
      {!isTerminal && (
        <div className="flex items-center gap-1 shrink-0">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProofOfDelivery(routeId, stop.id, 'photo', f); }} />
          <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProofOfDelivery(routeId, stop.id, 'signature', f); }} />
          <button onClick={() => photoRef.current?.click()} title={t('routes.uploadPhoto')} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Camera className="h-3.5 w-3.5" /></button>
          <button onClick={() => sigRef.current?.click()} title={t('routes.uploadSignature')} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><PenLine className="h-3.5 w-3.5" /></button>
          <button onClick={() => updateStopStatus(routeId, stop.id, 'delivered')} title={t('routes.stopStatus.delivered')} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50"><CheckCircle2 className="h-4 w-4" /></button>
          <button onClick={() => updateStopStatus(routeId, stop.id, 'failed')} title={t('routes.stopStatus.failed')} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><XCircle className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

function RouteCard({ route }: { route: any }) {
  const t = useTranslations('Logistics');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
        <div className="flex items-center gap-2">
          <ChevronRight className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', expanded && 'rotate-90')} />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">{new Date(route.date).toLocaleDateString()}</p>
            <p className="text-xs text-slate-400">{route.stops.length} {t('routes.stopsCount')}</p>
          </div>
        </div>
        <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full', ROUTE_STATUS_CLS[route.status as RouteStatus])}>{t(`routes.status.${route.status}`)}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t border-slate-100">
          {route.stops.map((stop: any) => <StopRow key={stop.id} routeId={route._id} stop={stop} />)}
        </div>
      )}
    </div>
  );
}

export function RoutesTab({ level }: { level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { routes, isLoading } = useRoutes();
  const [showAdd, setShowAdd] = useState(false);
  const canCreate = level === 'admin' || level === 'opsAdmin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{t('routes.title')}</p>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
            <Plus className="h-4 w-4" /> {t('routes.addRoute')}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">{t('common.loading')}</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('routes.none')}</p>
      ) : (
        <div className="space-y-2">
          {routes.map((r) => <RouteCard key={r._id} route={r} />)}
        </div>
      )}

      {showAdd && <AddRouteModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
