'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface TimesheetEntry {
  date: string;
  projectName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalMinutes: number;
  description: string;
  isLocked?: boolean;
}

interface Timesheet {
  _id: string;
  weekStart: string;
  weekEnd: string;
  entries: TimesheetEntry[];
  totalMinutes: number;
  overtimeMinutes: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const STATUS_CFG = {
  draft:     { label: 'Draft',     cls: 'bg-brand-bg-muted text-brand-text-secondary',     icon: Clock         },
  submitted: { label: 'Submitted', cls: 'bg-brand-primary/10 text-indigo-400 border border-brand-primary/20', icon: Send },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: CheckCircle },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: AlertCircle },
};

function getMondayOfWeek(offsetWeeks = 0): Date {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function fmtDuration(mins: number) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function calcMins(start: string, end: string, breakMins: number): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm) - breakMins);
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimesheetsTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheet,      setSheet]      = useState<Timesheet | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const weekLabel = (() => {
    const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  const blankSheet = useCallback((): Timesheet => ({
    _id: '',
    weekStart: monday.toISOString(),
    weekEnd: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    entries: [],
    totalMinutes: 0,
    overtimeMinutes: 0,
    status: 'draft',
  }), [monday]);

  const fetchSheet = useCallback(() => {
    setLoading(true);
    const url = weekOffset === 0
      ? `${API_BASE_URL}/attendance/timesheets/current`
      : `${API_BASE_URL}/attendance/timesheets?weekStart=${monday.toISOString()}`;
    apiCallFunction<any>({
      url,
      showToast: false,
      thenFn: (r) => setSheet(r.data?.data ?? blankSheet()),
      finallyFn: () => setLoading(false),
    });
  }, [weekOffset, monday, blankSheet]);

  useEffect(() => { fetchSheet(); }, [fetchSheet]);

  const upsertEntry = (date: string, field: keyof TimesheetEntry, value: string | number) => {
    setSheet(prev => {
      if (!prev) return prev;
      const existing = prev.entries.find(e => e.date === date);
      let entries: TimesheetEntry[];
      if (existing) {
        entries = prev.entries.map(e => {
          if (e.date !== date) return e;
          const updated = { ...e, [field]: value };
          if (field === 'startTime' || field === 'endTime' || field === 'breakMinutes') {
            updated.totalMinutes = calcMins(
              field === 'startTime' ? String(value) : e.startTime,
              field === 'endTime'   ? String(value) : e.endTime,
              field === 'breakMinutes' ? Number(value) : e.breakMinutes
            );
          }
          return updated;
        });
      } else {
        const newEntry: TimesheetEntry = {
          date, projectName: 'General', startTime: '', endTime: '', breakMinutes: 0, totalMinutes: 0, description: '',
          [field]: value,
        };
        entries = [...prev.entries, newEntry];
      }
      return { ...prev, entries, totalMinutes: entries.reduce((s, e) => s + e.totalMinutes, 0) };
    });
  };

  const saveSheet = () => {
    if (!sheet) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/timesheets`,
      method: 'POST',
      data: {
        employeeId: 'me', // backend resolves from JWT
        weekStart:  monday.toISOString(),
        entries:    sheet.entries,
        status:     'draft',
      },
      thenFn: () => fetchSheet(),
      finallyFn: () => setSaving(false),
    });
  };

  const submitSheet = () => {
    if (!sheet?._id) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/timesheets/${sheet._id}/submit`,
      method: 'PUT',
      data: {},
      thenFn: () => fetchSheet(),
      finallyFn: () => setSaving(false),
    });
  };

  const isLocked = sheet?.status === 'submitted' || sheet?.status === 'approved';
  const statusCfg = sheet ? STATUS_CFG[sheet.status] : null;
  const totalMins = sheet?.totalMinutes || 0;
  const overMins  = sheet?.overtimeMinutes || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-brand-text min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0}
            className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {statusCfg && (
          <div className="flex items-center gap-2">
            <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', statusCfg.cls)}>
              <statusCfg.icon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
            {sheet?.status === 'rejected' && sheet.rejectionReason && (
              <span className="text-xs text-red-400">{sheet.rejectionReason}</span>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      {sheet && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Hours',    value: fmtDuration(totalMins),  color: 'text-brand-text' },
            { label: 'Standard (40h)', value: fmtDuration(2400),       color: 'text-brand-text-secondary' },
            { label: 'Overtime',       value: fmtDuration(overMins),   color: overMins > 0 ? 'text-amber-400' : 'text-brand-text-muted' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-brand-bg-soft border border-brand-border rounded-xl p-3 text-center">
              <p className="text-[11px] text-brand-text-muted uppercase tracking-wide mb-0.5">{label}</p>
              <p className={cn('text-base font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Usage hint */}
      {!isLocked && sheet && (
        <p className="text-xs text-brand-text-muted flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Click any cell to fill in your hours for the day, then hit <span className="text-brand-text-secondary font-semibold">Save Draft</span>. Submit for approval when the week is complete.
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border rounded-2xl overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[80px_1fr_80px_80px_60px_1fr] gap-0 border-b border-brand-border bg-brand-bg-soft/50">
            {['Day', 'Project', 'Start', 'End', 'Break', 'Notes'].map(h => (
              <div key={h} className="px-3 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {weekDates.map((date, dayIdx) => {
            const entry = sheet?.entries.find(e => e.date === date);
            const d = new Date(date);
            const isWeekend = dayIdx >= 5;
            const isToday = date === new Date().toISOString().split('T')[0];

            const fieldCls = cn(
              'h-8 w-full bg-brand-bg-soft/60 border border-brand-border text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary hover:border-slate-500 rounded px-2 transition-colors',
              (isLocked || isWeekend) ? 'opacity-40 pointer-events-none cursor-not-allowed' : 'cursor-text'
            );

            return (
              <div key={date}
                className={cn(
                  'grid grid-cols-[80px_1fr_80px_80px_60px_1fr] gap-0 border-b border-brand-border/60 hover:bg-brand-bg-soft/30 transition-colors',
                  isWeekend && 'bg-brand-bg-soft/20',
                  isToday && 'bg-brand-primary/5',
                )}>
                <div className="px-3 py-2 flex flex-col justify-center">
                  <p className={cn('text-xs font-semibold', isToday ? 'text-indigo-400' : isWeekend ? 'text-brand-text-muted' : 'text-brand-text-secondary')}>
                    {DAYS[dayIdx]}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">{d.getDate()}</p>
                </div>

                {/* Editable cells */}
                <div className="px-2 py-1.5 flex items-center">
                  <input value={entry?.projectName || ''} placeholder="e.g. General"
                    onChange={e => upsertEntry(date, 'projectName', e.target.value)}
                    className={fieldCls} />
                </div>
                <div className="px-2 py-1.5 flex items-center">
                  <input type="time" value={entry?.startTime || ''} step="60"
                    placeholder="08:00"
                    onChange={e => upsertEntry(date, 'startTime', e.target.value)}
                    className={fieldCls} />
                </div>
                <div className="px-2 py-1.5 flex items-center">
                  <input type="time" value={entry?.endTime || ''} step="60"
                    placeholder="17:00"
                    onChange={e => upsertEntry(date, 'endTime', e.target.value)}
                    className={fieldCls} />
                </div>
                <div className="px-2 py-1.5 flex items-center">
                  <input type="number" min={0} max={120} value={entry?.breakMinutes || ''} placeholder="0"
                    onChange={e => upsertEntry(date, 'breakMinutes', Number(e.target.value))}
                    className={cn(fieldCls, 'text-center')} />
                </div>
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <input value={entry?.description || ''} placeholder="What did you work on?"
                    onChange={e => upsertEntry(date, 'description', e.target.value)}
                    className={fieldCls} />
                  {entry?.totalMinutes ? (
                    <span className="text-[11px] text-brand-text-muted shrink-0 ml-2">{fmtDuration(entry.totalMinutes)}</span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Totals row */}
          {sheet && (
            <div className="grid grid-cols-[80px_1fr_80px_80px_60px_1fr] gap-0 border-t-2 border-brand-border-strong bg-brand-bg-soft/60">
              <div className="px-3 py-2.5 text-xs font-bold text-brand-text-secondary uppercase tracking-wide">Total</div>
              <div className="col-span-4" />
              <div className="px-3 py-2.5 flex items-center justify-end">
                <span className={cn('text-sm font-bold', totalMins > 0 ? 'text-indigo-300' : 'text-brand-text-muted')}>
                  {fmtDuration(totalMins)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      {!isLocked && sheet && (
        <div className="flex items-center justify-end gap-3">
          <button onClick={saveSheet} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text text-sm font-semibold disabled:opacity-50 transition-colors">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={submitSheet} disabled={saving || totalMins === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            <Send className="h-4 w-4" /> Submit for Approval
          </button>
        </div>
      )}
    </div>
  );
}
