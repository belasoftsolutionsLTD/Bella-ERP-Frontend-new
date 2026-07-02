'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveColor, LEAVE_TYPE_LABELS } from '../constants';
import type { LeaveBalance } from '../constants';

interface Props {
  balances: LeaveBalance[];
  onClose: () => void;
  onSuccess: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function getWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW    = ['Mo','Tu','We','Th','Fr','Sa','Su'];

interface MiniCalProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

function MiniCal({ startDate, endDate, onChange }: MiniCalProps) {
  const now = new Date();
  const [cy, setCy] = useState(now.getFullYear());
  const [cm, setCm] = useState(now.getMonth() + 1);
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const daysInMonth = new Date(cy, cm, 0).getDate();
  const firstDow = new Date(cy, cm - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const clickDay = (d: number) => {
    const date = `${cy}-${pad(cm)}-${pad(d)}`;
    if (picking === 'start') { onChange(date, ''); setPicking('end'); }
    else {
      if (date < startDate) { onChange(date, startDate); }
      else                  { onChange(startDate, date); }
      setPicking('start');
    }
  };

  const inRange = (d: number) => {
    const date = `${cy}-${pad(cm)}-${pad(d)}`;
    return startDate && endDate && date >= startDate && date <= endDate;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => { if (cm === 1) { setCm(12); setCy(y => y - 1); } else setCm(m => m - 1); }}
          className="p-1 rounded text-slate-400 hover:text-slate-200">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-200">{MONTHS[cm - 1]} {cy}</span>
        <button onClick={() => { if (cm === 12) { setCm(1); setCy(y => y + 1); } else setCm(m => m + 1); }}
          className="p-1 rounded text-slate-400 hover:text-slate-200">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DOW.map(d => <div key={d} className="text-center text-[10px] text-slate-600 font-semibold py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {[...Array(startOffset)].map((_, i) => <div key={`e${i}`} />)}
        {[...Array(daysInMonth)].map((_, idx) => {
          const d = idx + 1;
          const date = `${cy}-${pad(cm)}-${pad(d)}`;
          const isStart = date === startDate;
          const isEnd   = date === endDate;
          const inR     = inRange(d);
          const dow     = new Date(cy, cm - 1, d).getDay();
          const isWknd  = dow === 0 || dow === 6;
          return (
            <button key={d} onClick={() => clickDay(d)}
              className={cn(
                'h-7 w-full rounded text-xs font-medium transition-all',
                isStart || isEnd ? 'bg-indigo-600 text-white' :
                inR ? 'bg-indigo-500/20 text-indigo-300' :
                isWknd ? 'text-slate-600 hover:bg-slate-700' :
                'text-slate-300 hover:bg-slate-700',
              )}>
              {d}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-2 text-center">
        {picking === 'start' ? 'Click to select start date' : 'Now click end date'}
      </p>
    </div>
  );
}

export function RequestTimeOffDrawer({ balances, onClose, onSuccess }: Props) {
  const [selectedType, setSelectedType] = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [isHalfDay,    setIsHalfDay]    = useState(false);
  const [halfDayPeriod,setHalfDayPeriod]= useState<'morning' | 'afternoon'>('morning');
  const [reason,       setReason]       = useState('');
  const [saving,       setSaving]       = useState(false);
  const [employees,    setEmployees]    = useState<{ _id: string; fullName: string }[]>([]);
  const [coverageId,   setCoverageId]   = useState('');
  const [myEmpId,      setMyEmpId]      = useState('');

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees?limit=200`, showToast: false, thenFn: r => setEmployees(r.data?.data ?? []) });
    apiCallFunction<any>({ url: `${API_BASE_URL}/me`, showToast: false, thenFn: r => setMyEmpId(r.data?.data?.employeeId ?? '') });
  }, []);

  const workingDays = getWorkingDays(startDate, endDate);
  const singleDay   = startDate && startDate === endDate;
  const selBalance  = balances.find(b => b.leaveType === selectedType);
  const afterBalance = selBalance ? selBalance.remainingDays - (isHalfDay ? 0.5 : workingDays) : null;
  const invalidRange = !!(startDate && endDate && endDate < startDate);

  const handleSubmit = () => {
    if (!selectedType || !startDate || invalidRange) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests`,
      method: 'POST',
      data: {
        employeeId: myEmpId || undefined,
        leaveType:  selectedType,
        startDate,
        endDate: endDate || startDate,
        reason,
        isHalfDay,
        halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
        coverageEmployeeId: coverageId || undefined,
      },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  const canSubmit = selectedType && startDate && !invalidRange && (afterBalance === null || afterBalance >= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100">Request Time Off</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submit a leave request for approval</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Leave type cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Leave Type <span className="text-red-400">*</span>
            </label>
            {balances.length === 0 ? (
              <p className="text-xs text-slate-500">No leave balances available. Contact HR.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {balances.map(b => {
                  const color = b.color ?? leaveColor(b.leaveType);
                  const isSelected = selectedType === b.leaveType;
                  return (
                    <button key={b.leaveType} type="button" onClick={() => setSelectedType(b.leaveType)}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                        isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600',
                      )}>
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className={cn('text-xs font-semibold truncate', isSelected ? 'text-indigo-300' : 'text-slate-300')}>
                          {b.leaveTypeName}
                        </p>
                        <p className="text-[10px] text-slate-500">{b.remainingDays} days left</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Dates <span className="text-red-400">*</span>
            </label>
            <MiniCal startDate={startDate} endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); setIsHalfDay(false); }} />
            {invalidRange && (
              <p className="mt-2 text-xs text-red-400">End date must be on or after the start date.</p>
            )}
            {startDate && (
              <div className="mt-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-xs text-indigo-300 font-semibold">
                  {startDate}{endDate && endDate !== startDate ? ` — ${endDate}` : ''}
                  {workingDays > 0 && ` · ${workingDays} working day${workingDays !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </div>

          {/* Half-day toggle (single day only) */}
          {singleDay && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Half Day?</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsHalfDay(v => !v)}
                  className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', isHalfDay ? 'bg-indigo-500' : 'bg-slate-700')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', isHalfDay ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
                {isHalfDay && (
                  <div className="flex gap-2">
                    {(['morning', 'afternoon'] as const).map(p => (
                      <button key={p} type="button" onClick={() => setHalfDayPeriod(p)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all',
                          halfDayPeriod === p ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-400')}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Add a note for your manager…" rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          {/* Coverage */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Coverage (optional)</label>
            <select value={coverageId} onChange={e => setCoverageId(e.target.value)}
              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="">Who will cover your work?</option>
              {employees.filter(e => e._id !== myEmpId).map(e => (
                <option key={e._id} value={e._id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          {/* Summary card */}
          {selectedType && startDate && (
            <div className="bg-[#0f172a] border border-indigo-500/20 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-indigo-400">Request Summary</p>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Leave type</span>
                  <span className="text-slate-200 font-medium">{selBalance?.leaveTypeName ?? selectedType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="text-slate-200 font-medium">{isHalfDay ? `0.5 day (${halfDayPeriod})` : `${workingDays} working day${workingDays !== 1 ? 's' : ''}`}</span>
                </div>
                {selBalance && (
                  <div className="flex justify-between">
                    <span>Balance after approval</span>
                    <span className={cn('font-bold', (afterBalance ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400')}>
                      {afterBalance} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !canSubmit}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
