'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, CalendarDays, CheckCircle2, XCircle, Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { apiCallFunction } from '@/functions/apiCallFunction';

interface Shift {
  _id: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  location: string;
  notes?: string;
  isOpen?: boolean;
}

interface ShiftApplication {
  _id: string;
  shiftId: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  createdAt: string;
  shift: Shift | null;
}

const LOCATION_COLORS: Record<string, string> = {
  office:       'text-sky-400',
  remote:       'text-emerald-400',
  field:        'text-orange-400',
  'client site':'text-violet-400',
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ShiftCard({ shift, badge, action }: { shift: Shift; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/5 shrink-0">
        <span className="text-xs font-bold text-primary uppercase">{new Date(shift.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</span>
        <span className="text-lg font-black text-primary leading-none">{new Date(shift.date + 'T00:00:00').getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{fmtDate(shift.date)}</p>
          {badge}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-foreground/50">
            <Clock className="h-3 w-3" /> {shift.startTime} – {shift.endTime}
          </span>
          <span className={cn('flex items-center gap-1 text-xs font-medium', LOCATION_COLORS[shift.location] ?? 'text-foreground/50')}>
            <MapPin className="h-3 w-3" /> {shift.location}
          </span>
          {shift.notes && <span className="text-xs text-foreground/40 truncate max-w-[200px]">{shift.notes}</span>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MyShiftsTab() {
  const [myShifts,      setMyShifts]      = useState<Shift[]>([]);
  const [openShifts,    setOpenShifts]    = useState<Shift[]>([]);
  const [applications,  setApplications]  = useState<ShiftApplication[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [applying,      setApplying]      = useState<string | null>(null);
  const [tab,           setTab]           = useState<'mine' | 'open' | 'applied'>('mine');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/my`,               showToast: false, thenFn: r => { setMyShifts(r.data ?? []);     res(); }, catchFn: () => res() })),
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/open`,             showToast: false, thenFn: r => { setOpenShifts(r.data ?? []);   res(); }, catchFn: () => res() })),
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/my-applications`,  showToast: false, thenFn: r => { setApplications(r.data ?? []); res(); }, catchFn: () => res() })),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const apply = (shiftId: string) => {
    setApplying(shiftId);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/${shiftId}/apply`,
      method: 'POST',
      thenFn: () => fetchAll(),
      finallyFn: () => setApplying(null),
    });
  };

  const appliedIds = new Set(applications.map(a => a.shiftId));

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'mine',    label: 'My Shifts',     count: myShifts.length },
          { key: 'open',    label: 'Open Shifts',   count: openShifts.length },
          { key: 'applied', label: 'My Applications', count: applications.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.key ? 'bg-white text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground')}>
            {t.label}
            {t.count > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === t.key ? 'bg-primary text-white' : 'bg-foreground/10 text-foreground/60')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My upcoming shifts */}
      {tab === 'mine' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Upcoming assigned shifts</h3>
          {myShifts.length === 0
            ? <Empty label="No upcoming shifts assigned to you" />
            : myShifts.map(s => <ShiftCard key={s._id} shift={s} />)}
        </div>
      )}

      {/* Open shifts available to apply for */}
      {tab === 'open' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Available open shifts</h3>
          {openShifts.length === 0
            ? <Empty label="No open shifts available right now" />
            : openShifts.map(s => {
                const alreadyApplied = appliedIds.has(s._id);
                return (
                  <ShiftCard key={s._id} shift={s}
                    badge={<span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Open</span>}
                    action={
                      alreadyApplied
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="h-4 w-4" /> Applied</span>
                        : <button onClick={() => apply(s._id)} disabled={applying === s._id}
                            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {applying === s._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                          </button>
                    }
                  />
                );
              })}
        </div>
      )}

      {/* My applications */}
      {tab === 'applied' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Your shift applications</h3>
          {applications.length === 0
            ? <Empty label="You haven't applied for any shifts yet" />
            : applications.map(app => {
                const cfg = APP_STATUS[app.status];
                return app.shift
                  ? <ShiftCard key={app._id} shift={app.shift}
                      badge={<span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.cls)}>{cfg.label}</span>}
                    />
                  : null;
              })}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-foreground/30 gap-2">
      <Inbox className="h-10 w-10 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
