'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';
import { leaveColor, LEAVE_TYPE_LABELS } from '../constants';
import type { LeaveRequest } from '../constants';

interface Holiday { _id: string; name: string; date: string }
interface CalendarEntry extends LeaveRequest { employee?: { _id: string; fullName: string; department?: string } }

type ViewMode = 'month' | 'list';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n: number) { return String(n).padStart(2, '0'); }

interface PopoverProps {
  entry: CalendarEntry;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  isManager?: boolean;
}

function EntryPopover({ entry, onClose, onApprove, onDecline, isManager }: PopoverProps) {
  const color = leaveColor(entry.leaveType);
  const label = entry.leaveTypeName ?? LEAVE_TYPE_LABELS[entry.leaveType] ?? entry.leaveType;
  return (
    <div className="absolute z-30 top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: color + '25', color }}>
          {(entry.employee?.fullName ?? '?')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">{entry.employee?.fullName ?? 'Employee'}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: color + '20', color }}>{label}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1 text-xs text-slate-400 mb-2">
        <p>{entry.startDate} → {entry.endDate}</p>
        <p>{entry.numberOfDays ?? entry.totalDays} working days</p>
        {entry.reason && <p className="italic">&ldquo;{entry.reason}&rdquo;</p>}
      </div>
      {isManager && entry.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => { onApprove?.(entry._id); onClose(); }}
            className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
            <Check className="h-3 w-3" /> Approve
          </button>
          <button onClick={() => { onDecline?.(entry._id); onClose(); }}
            className="flex-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
            <X className="h-3 w-3" /> Decline
          </button>
        </div>
      )}
    </div>
  );
}

// Separate component so useRef is called at component top level, not inside .map()
interface EntryButtonProps {
  entry: CalendarEntry;
  index: number;
  onOpen: (entry: CalendarEntry) => void;
}
function LeaveEntryButton({ entry, index, onOpen }: EntryButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = leaveColor(entry.leaveType, index);
  return (
    <button ref={ref}
      onClick={e => { e.stopPropagation(); onOpen(entry); }}
      className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate mb-0.5 hover:brightness-110 transition-all"
      style={{ backgroundColor: color + '30', color, border: `1px solid ${color}40` }}>
      {entry.employee?.fullName?.split(' ')[0] ?? 'Staff'}
    </button>
  );
}

interface Props {
  isManager?: boolean;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export function LeaveMonthCalendar({ isManager, onApprove, onDecline }: Props) {
  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [view,     setView]     = useState<ViewMode>('month');
  const [dept,     setDept]     = useState('');
  const [depts,    setDepts]    = useState<string[]>([]);
  const [leaves,   setLeaves]   = useState<CalendarEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [popover,  setPopover]  = useState<{ entry: CalendarEntry } | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const daysInMonth     = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const startOffset     = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const monthStr        = `${year}-${pad(month)}`;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/departments`,
      showToast: false,
      thenFn: r => setDepts((r.data?.data ?? []).map((d: { name: string }) => d.name)),
    });
  }, []);

  const fetchCalendar = useCallback(() => {
    setLoading(true);
    const from = `${monthStr}-01`;
    const to   = `${monthStr}-${pad(daysInMonth)}`;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/calendar/entries?from=${from}&to=${to}${dept ? `&dept=${encodeURIComponent(dept)}` : ''}`,
      showToast: false,
      thenFn: r => {
        setLeaves(r.data?.leaves ?? []);
        setHolidays(r.data?.holidays ?? []);
      },
      finallyFn: () => setLoading(false),
    });
  }, [year, month, dept]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  function getLeavesForDay(day: number): CalendarEntry[] {
    const date = `${monthStr}-${pad(day)}`;
    return leaves.filter(l => l.startDate <= date && l.endDate >= date);
  }
  function getHolidayForDay(day: number): Holiday | undefined {
    const date = `${monthStr}-${pad(day)}`;
    return holidays.find(h => h.date === date || h.date.startsWith(date));
  }

  const legendTypes = [...new Set(leaves.map(l => l.leaveType))];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-slate-100 min-w-[140px] text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={nextMonth}
            className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 ml-auto">
          {(['month', 'list'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                view === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200')}>
              {v}
            </button>
          ))}
        </div>

        <select value={dept} onChange={e => setDept(e.target.value)}
          className="h-8 bg-slate-800 border border-slate-700 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Legend */}
      {legendTypes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {legendTypes.map((t, i) => {
            const color = leaveColor(t, i);
            return (
              <span key={t} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {LEAVE_TYPE_LABELS[t] ?? t}
              </span>
            );
          })}
          {holidays.length > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
              Public Holiday
            </span>
          )}
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className={cn('py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide',
                d === 'Sat' || d === 'Sun' ? 'text-slate-600' : 'text-slate-500')}>
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {[...Array(startOffset)].map((_, i) => (
                <div key={`off-${i}`} className="min-h-[90px] border-b border-r border-slate-700/40 bg-slate-800/20" />
              ))}

              {[...Array(daysInMonth)].map((_, idx) => {
                const day      = idx + 1;
                const colPos   = (startOffset + idx) % 7;
                const isWeekend = colPos === 5 || colPos === 6;
                const date     = `${monthStr}-${pad(day)}`;
                const isToday  = date === now.toISOString().split('T')[0];
                const dayLeaves = getLeavesForDay(day);
                const holiday  = getHolidayForDay(day);
                const isLastCol = (startOffset + idx) % 7 === 6;

                return (
                  <div key={day}
                    className={cn(
                      'min-h-[90px] border-b border-r border-slate-700/40 p-1.5 relative',
                      isWeekend && 'bg-slate-800/30',
                      holiday && 'bg-emerald-900/10',
                      isLastCol && 'border-r-0',
                    )}>
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1',
                      isToday ? 'bg-indigo-600 text-white' : isWeekend ? 'text-slate-600' : 'text-slate-400',
                    )}>
                      {day}
                    </div>

                    {holiday && (
                      <p className="text-[9px] text-emerald-400 truncate mb-0.5">{holiday.name}</p>
                    )}

                    {dayLeaves.slice(0, 3).map((entry, ei) => (
                      <LeaveEntryButton key={entry._id} entry={entry} index={ei} onOpen={e => setPopover({ entry: e })} />
                    ))}
                    {dayLeaves.length > 3 && (
                      <p className="text-[10px] text-slate-500 px-1">+{dayLeaves.length - 3} more</p>
                    )}

                    {popover && dayLeaves.some(l => l._id === popover.entry._id) && (
                      <div ref={popRef}>
                        <EntryPopover
                          entry={popover.entry}
                          onClose={() => setPopover(null)}
                          onApprove={onApprove}
                          onDecline={onDecline}
                          isManager={isManager}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-sm">No leave entries for {MONTHS[month - 1]} {year}.</div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_120px_160px_60px_100px_80px] border-b border-slate-700 bg-slate-800/60">
                {['Employee', 'Leave Type', 'Date Range', 'Days', 'Status', 'Actions'].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
                ))}
              </div>
              {leaves.map(entry => {
                const color    = leaveColor(entry.leaveType);
                const label    = entry.leaveTypeName ?? LEAVE_TYPE_LABELS[entry.leaveType] ?? entry.leaveType;
                const initials = (entry.employee?.fullName ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={entry._id} className="grid grid-cols-[1fr_120px_160px_60px_100px_80px] border-b border-slate-700/60 hover:bg-slate-800/30 transition-colors">
                    <div className="px-4 py-3 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: color + '25', color }}>{initials}</div>
                      <span className="text-sm text-slate-200 truncate">{entry.employee?.fullName}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: color + '20', color }}>{label}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center text-xs text-slate-400">
                      {entry.startDate} → {entry.endDate}
                    </div>
                    <div className="px-4 py-3 flex items-center text-sm font-semibold text-slate-200">
                      {entry.numberOfDays ?? entry.totalDays}
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        {entry.status}
                      </span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      {isManager && entry.status === 'pending' && (
                        <>
                          <button onClick={() => onApprove?.(entry._id)}
                            className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => onDecline?.(entry._id)}
                            className="h-6 w-6 rounded-md bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
