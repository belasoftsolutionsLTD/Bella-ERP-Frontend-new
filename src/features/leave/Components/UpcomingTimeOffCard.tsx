'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';
import { leaveColor, LEAVE_TYPE_LABELS, STATUS_CFG } from '../constants';
import type { LeaveRequest } from '../constants';

interface Props {
  onViewCalendar?: () => void;
}

export function UpcomingTimeOffCard({ onViewCalendar }: Props) {
  const [items,   setItems]   = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/upcoming?days=30`,
      showToast: false,
      thenFn: r => setItems(Array.isArray(r.data) ? r.data : []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function fmtRange(start: string, end: string) {
    const s = new Date(start).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    return s === e ? s : `${s} — ${e}`;
  }

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <Calendar className="h-4 w-4 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-slate-100">Upcoming Time Off</h3>
          <p className="text-[11px] text-slate-500">Next 30 days</p>
        </div>
      </div>

      <div className="divide-y divide-slate-700/60">
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-slate-600 text-sm">No upcoming leave in the next 30 days.</div>
        ) : (
          items.slice(0, 8).map(item => {
            const color  = leaveColor(item.leaveType, 0);
            const label  = item.leaveTypeName ?? LEAVE_TYPE_LABELS[item.leaveType] ?? item.leaveType;
            const stCfg  = STATUS_CFG[item.status] ?? STATUS_CFG.pending;
            const initials = (item.employee?.fullName ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={item._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: color + '25', color }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.employee?.fullName ?? 'Employee'}</p>
                  <p className="text-[10px] text-slate-500">
                    {fmtRange(item.startDate, item.endDate)} · {item.numberOfDays ?? item.totalDays} days
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                    style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}>
                    {label}
                  </span>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', stCfg.darkBg, stCfg.darkText)}>
                    {stCfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <button onClick={onViewCalendar}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border-t border-slate-700 transition-colors">
          View all in calendar <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
