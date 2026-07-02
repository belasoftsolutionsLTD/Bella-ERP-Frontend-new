'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, ArrowRight } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';
import { leaveColor, LEAVE_TYPE_LABELS } from '../constants';

interface AbsenceRecord {
  _id: string;
  employeeId: string;
  employee?: { fullName: string; department?: string; designation?: string };
  leaveType: string;
  leaveTypeName?: string;
  endDate: string;
  status: string;
}

interface TeamStats {
  clockedIn: number;
  onBreak: number;
  completed: number;
  notClockedIn: number;
}

interface Props {
  onViewAll?: () => void;
}

const PILL_COLORS = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    sub: 'text-blue-400/70'    },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   sub: 'text-amber-400/70'   },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', sub: 'text-emerald-400/70' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400',  sub: 'text-violet-400/70'  },
} as const;

export function TodayAbsencesCard({ onViewAll }: Props) {
  const [absences,  setAbsences]  = useState<AbsenceRecord[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/today-absences`,
      showToast: false,
      thenFn: r => setAbsences(Array.isArray(r.data) ? r.data : []),
      finallyFn: () => setLoading(false),
    });
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/team-status`,
      showToast: false,
      thenFn: r => setTeamStats(r.data?.stats ?? null),
      catchFn: () => {},
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

  const pills: { label: string; value: string; color: keyof typeof PILL_COLORS }[] = [
    { label: 'Out of office',    value: loading ? '—' : String(absences.length),                                color: 'blue'    },
    { label: 'Missing clock-in', value: teamStats ? String(teamStats.notClockedIn) : '—',                       color: 'amber'   },
    { label: 'Working',          value: teamStats ? String(teamStats.clockedIn + teamStats.completed) : '—',    color: 'emerald' },
    { label: 'On break',         value: teamStats ? String(teamStats.onBreak) : '—',                            color: 'violet'  },
  ];

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Today&apos;s Absences</h3>
            <p className="text-[11px] text-slate-500">{today}</p>
          </div>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* 4 stat pills */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-700">
        {pills.map(({ label, value, color }) => {
          const c = PILL_COLORS[color];
          return (
            <div key={label} className={cn('rounded-lg px-3 py-2 text-center border', c.bg, c.border)}>
              <p className={cn('text-lg font-bold', c.text)}>{value}</p>
              <p className={cn('text-[10px]', c.sub)}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* Absence list */}
      <div className="divide-y divide-slate-700/60">
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : absences.length === 0 ? (
          <div className="py-6 text-center text-slate-600 text-sm">Everyone is in today.</div>
        ) : (
          absences.slice(0, 5).map(rec => {
            const color    = leaveColor(rec.leaveType, 0);
            const label    = rec.leaveTypeName ?? LEAVE_TYPE_LABELS[rec.leaveType] ?? rec.leaveType;
            const backDate = new Date(rec.endDate);
            backDate.setDate(backDate.getDate() + 1);
            const back     = backDate.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
            const initials = (rec.employee?.fullName ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={rec._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: color + '33', color }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{rec.employee?.fullName ?? 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">Back {back}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}>
                  {label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {absences.length > 5 && (
        <button onClick={onViewAll}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border-t border-slate-700 transition-colors">
          View all {absences.length} absences <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
