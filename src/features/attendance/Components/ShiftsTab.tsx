'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, MapPin, Search, Check, Users } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface Employee { _id: string; fullName: string; designation?: string; department?: string }

interface Shift {
  _id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  location: string;
  notes?: string;
}

const SHIFT_TYPES = [
  { value: 'morning',   label: 'Morning',   start: '06:00', end: '14:00', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'    },
  { value: 'afternoon', label: 'Afternoon', start: '14:00', end: '22:00', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'  },
  { value: 'night',     label: 'Night',     start: '22:00', end: '06:00', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20'  },
  { value: 'full_day',  label: 'Full Day',  start: '08:00', end: '17:00', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  { value: 'custom',    label: 'Custom',    start: '09:00', end: '18:00', color: 'bg-slate-700 text-slate-400'                            },
];

const LOCATION_COLORS: Record<string, string> = {
  office:       'text-sky-400',
  remote:       'text-emerald-400',
  field:        'text-orange-400',
  'client site':'text-violet-400',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMondayOffset(offsetWeeks = 0): Date {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function shiftColor(type: string) {
  return SHIFT_TYPES.find(s => s.value === type)?.color ?? 'bg-slate-700 text-slate-400';
}

// ── Bulk Shift Modal ───────────────────────────────────────────────────────────

interface BulkShiftModalProps {
  weekDates: string[];
  defaultDate?: string;
  shift?: Partial<Shift>;
  onClose: () => void;
  onSave: () => void;
}

function BulkShiftModal({ weekDates, defaultDate, shift, onClose, onSave }: BulkShiftModalProps) {
  const isEdit = !!shift?._id;

  // Employees
  const [allEmployees, setAllEmployees]   = useState<Employee[]>([]);
  const [empSearch,    setEmpSearch]      = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(
    new Set(shift?.employeeId ? [shift.employeeId] : [])
  );

  // Dates (multi-select within week)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set(defaultDate ? [defaultDate] : [])
  );

  // Open shift toggle
  const [openShift, setOpenShift] = useState(false);

  // Shift details
  const [type,   setType]   = useState(shift?.shiftType  || 'full_day');
  const [start,  setStart]  = useState(shift?.startTime  || '08:00');
  const [end,    setEnd]    = useState(shift?.endTime    || '17:00');
  const [brk,    setBrk]    = useState(String(shift?.breakMinutes ?? 60));
  const [loc,    setLoc]    = useState(shift?.location   || 'office');
  const [notes,  setNotes]  = useState(shift?.notes      || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=300`,
      showToast: false,
      thenFn: r => setAllEmployees(r.data?.data ?? []),
    });
  }, []);

  const filtered = empSearch.trim()
    ? allEmployees.filter(e => e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.department?.toLowerCase().includes(empSearch.toLowerCase()))
    : allEmployees;

  const applyType = (t: string) => {
    setType(t);
    const cfg = SHIFT_TYPES.find(s => s.value === t);
    if (cfg && t !== 'custom') { setStart(cfg.start); setEnd(cfg.end); }
  };

  const toggleEmp = (id: string) => {
    setSelectedEmpIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const selectWeekdays = () => setSelectedDates(new Set(weekDates.slice(0, 5)));
  const selectAllWeek  = () => setSelectedDates(new Set(weekDates));

  const handleSave = () => {
    setSaving(true);

    if (isEdit && shift?._id) {
      // Single edit
      apiCallFunction({
        url: `${API_BASE_URL}/attendance/shifts/${shift._id}`,
        method: 'PUT',
        data: { employeeId: shift.employeeId, date: shift.date, shiftType: type, startTime: start, endTime: end, breakMinutes: Number(brk), location: loc, notes },
        thenFn: () => { onSave(); onClose(); },
        finallyFn: () => setSaving(false),
      });
      return;
    }

    // Bulk create
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/bulk`,
      method: 'POST',
      data: {
        employeeIds: openShift ? [] : Array.from(selectedEmpIds),
        dates: Array.from(selectedDates),
        isOpen: openShift,
        shiftType: type, startTime: start, endTime: end, breakMinutes: Number(brk), location: loc, notes,
      },
      thenFn: () => { onSave(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  const canSave = isEdit
    ? true
    : selectedDates.size > 0 && (openShift || selectedEmpIds.size > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-sm font-bold text-slate-100">{isEdit ? 'Edit Shift' : 'Assign Shift'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Day selector (hidden when editing single shift) */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-wide">Days <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectWeekdays} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold">Weekdays</button>
                  <span className="text-slate-600">·</span>
                  <button type="button" onClick={selectAllWeek} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold">All week</button>
                  <span className="text-slate-600">·</span>
                  <button type="button" onClick={() => setSelectedDates(new Set())} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
                </div>
              </div>
              <div className="flex gap-2">
                {weekDates.map((date, i) => {
                  const d = new Date(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const sel = selectedDates.has(date);
                  return (
                    <button key={date} type="button" onClick={() => toggleDate(date)}
                      className={cn('flex-1 flex flex-col items-center py-2 rounded-xl border text-xs font-semibold transition-all',
                        sel ? 'bg-indigo-500 border-indigo-500 text-white' : isToday ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400' : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600')}>
                      <span className="text-[10px] font-bold uppercase">{DAYS[i]}</span>
                      <span className="text-sm font-black">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              {selectedDates.size > 0 && (
                <p className="text-[11px] text-slate-500 mt-1.5">{selectedDates.size} day{selectedDates.size > 1 ? 's' : ''} selected</p>
              )}
            </div>
          )}

          {/* Open shift toggle (hidden when editing) */}
          {!isEdit && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setOpenShift(v => !v)}
                className={cn('w-9 h-5 rounded-full relative transition-colors', openShift ? 'bg-amber-500' : 'bg-slate-700')}>
                <span className={cn('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', openShift && 'translate-x-4')} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Post as open shift</p>
                <p className="text-xs text-slate-500">Staff can see and apply — no employee pre-assigned</p>
              </div>
            </label>
          )}

          {/* Employee selector (hidden when editing or open shift) */}
          {!isEdit && !openShift && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-wide">Employees <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedEmpIds(new Set(allEmployees.map(e => e._id)))} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold">Select all</button>
                  <span className="text-slate-600">·</span>
                  <button type="button" onClick={() => setSelectedEmpIds(new Set())} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees…"
                  className="w-full h-8 pl-8 pr-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="border border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No employees found</p>
                )}
                {filtered.map(emp => {
                  const sel = selectedEmpIds.has(emp._id);
                  return (
                    <button key={emp._id} type="button" onClick={() => toggleEmp(emp._id)}
                      className={cn('w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800 transition-colors border-b border-slate-700/50 last:border-0',
                        sel && 'bg-indigo-500/5')}>
                      <div className={cn('h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                        sel ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600')}>
                        {sel && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', sel ? 'text-indigo-300' : 'text-slate-200')}>{emp.fullName}</p>
                        {emp.department && <p className="text-[11px] text-slate-500 truncate">{emp.department}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedEmpIds.size > 0 && (
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" /> {selectedEmpIds.size} employee{selectedEmpIds.size > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Shift type */}
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-2">Shift Type</label>
            <div className="flex flex-wrap gap-2">
              {SHIFT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => applyType(t.value)}
                  className={cn('px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    type === t.value ? t.color + ' border-current' : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600')}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times + break */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Start',       val: start, set: setStart, type: 'time'   },
              { label: 'End',         val: end,   set: setEnd,   type: 'time'   },
              { label: 'Break (min)', val: brk,   set: setBrk,   type: 'number' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} min={0}
                  className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
            ))}
          </div>

          {/* Location + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">Location</label>
              <select value={loc} onChange={e => setLoc(e.target.value)}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                {['office', 'remote', 'field', 'client site'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {/* Summary */}
          {!isEdit && canSave && (
            openShift
              ? <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300">
                  Will post <strong>{selectedDates.size}</strong> open shift{selectedDates.size !== 1 ? 's' : ''} — staff can apply from their portal
                </div>
              : <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-xs text-indigo-300">
                  Will create <strong>{selectedEmpIds.size * selectedDates.size}</strong> shift{selectedEmpIds.size * selectedDates.size !== 1 ? 's' : ''}
                  {' '}({selectedEmpIds.size} employee{selectedEmpIds.size > 1 ? 's' : ''} × {selectedDates.size} day{selectedDates.size > 1 ? 's' : ''})
                </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !canSave}
            className={cn('px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors',
              openShift ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500')}>
            {saving ? 'Saving…' : isEdit ? 'Update Shift' : openShift ? `Post ${selectedDates.size || ''} Open Shift${selectedDates.size !== 1 ? 's' : ''}` : `Assign ${selectedEmpIds.size * selectedDates.size || ''} Shift${selectedEmpIds.size * selectedDates.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export function ShiftsTab({ isManager = false }: { isManager?: boolean }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [shifts,     setShifts]     = useState<Shift[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<{ shift?: Partial<Shift>; defaultDate?: string } | null>(null);

  const monday = getMondayOffset(weekOffset);
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const weekLabel = (() => {
    const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  const fetchShifts = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/shifts?startDate=${weekDates[0]}&endDate=${weekDates[6]}`,
      showToast: false,
      thenFn: r => setShifts(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const deleteShift = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/${id}`,
      method: 'DELETE',
      thenFn: () => fetchShifts(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-200 min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isManager && (
          <button onClick={() => setModal({})}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Assign Shift
          </button>
        )}
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dayShifts = shifts.filter(s => s.date === date);
            const d = new Date(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            const isWeekend = i >= 5;
            return (
              <div key={date}
                className={cn('bg-[#1e293b] border rounded-xl overflow-hidden',
                  isToday ? 'border-indigo-500/50' : 'border-slate-700',
                  isWeekend && 'opacity-60')}>
                <div className={cn('px-2 py-2 text-center border-b border-slate-700',
                  isToday ? 'bg-indigo-500/10' : 'bg-slate-800/50')}>
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wide', isToday ? 'text-indigo-400' : 'text-slate-500')}>
                    {DAYS[i]}
                  </p>
                  <p className={cn('text-sm font-bold', isToday ? 'text-indigo-300' : 'text-slate-300')}>
                    {d.getDate()}
                  </p>
                </div>
                <div className="p-1.5 space-y-1 min-h-[80px]">
                  {dayShifts.map(s => (
                    <div key={s._id}
                      className={cn('rounded-lg px-2 py-1.5 border text-[10px] group relative', shiftColor(s.shiftType))}>
                      <p className="font-semibold truncate">{s.employee?.fullName?.split(' ')[0] ?? 'Staff'}</p>
                      <p className="opacity-70">{s.startTime}–{s.endTime}</p>
                      <p className={cn('flex items-center gap-0.5 mt-0.5', LOCATION_COLORS[s.location] ?? 'text-slate-400')}>
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="capitalize truncate">{s.location}</span>
                      </p>
                      {isManager && (
                        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                          <button onClick={() => setModal({ shift: s, defaultDate: s.date })}
                            className="h-4 w-4 rounded bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200">
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button onClick={() => deleteShift(s._id)}
                            className="h-4 w-4 rounded bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {dayShifts.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      {isManager ? (
                        <button onClick={() => setModal({ defaultDate: date })}
                          className="text-[10px] text-slate-600 hover:text-indigo-400 transition-colors">+ add</button>
                      ) : (
                        <p className="text-[10px] text-slate-700">—</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {SHIFT_TYPES.filter(t => t.value !== 'custom').map(t => (
          <span key={t.value} className={cn('flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border', t.color)}>
            {t.label} · {t.start}–{t.end}
          </span>
        ))}
      </div>

      {modal !== null && (
        <BulkShiftModal
          weekDates={weekDates}
          defaultDate={modal.defaultDate}
          shift={modal.shift}
          onClose={() => setModal(null)}
          onSave={fetchShifts}
        />
      )}
    </div>
  );
}
