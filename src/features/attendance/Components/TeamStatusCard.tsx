'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Coffee, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface Employee { _id: string; fullName: string; designation?: string; department?: string }

interface TeamRecord {
  employeeId: string;
  employee: Employee | null;
  clockStatus: 'clocked_in' | 'on_break' | 'completed' | 'not_clocked_in';
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkMinutes?: number;
}

interface Stats {
  clockedIn: number;
  onBreak: number;
  completed: number;
  notClockedIn: number;
}

const STATUS_CFG = {
  clocked_in:     { label: 'Working',       dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  on_break:       { label: 'On Break',      dot: 'bg-amber-400',   text: 'text-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'       },
  completed:      { label: 'Done',          dot: 'bg-indigo-400',  text: 'text-indigo-400',  badge: 'bg-brand-primary/10 text-indigo-400 border-brand-primary/20'     },
  not_clocked_in: { label: 'Not clocked in',dot: 'bg-slate-600',   text: 'text-brand-text-muted',   badge: 'bg-brand-bg-muted/50 text-brand-text-muted border-brand-border'           },
};

type FilterKey = 'all' | 'clocked_in' | 'on_break' | 'completed' | 'not_clocked_in';

export function TeamStatusCard() {
  const [records, setRecords] = useState<TeamRecord[]>([]);
  const [stats,   setStats]   = useState<Stats>({ clockedIn: 0, onBreak: 0, completed: 0, notClockedIn: 0 });
  const [filter,  setFilter]  = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/team-status`,
      showToast: false,
      thenFn: (r) => {
        setRecords(r.data?.data?.records ?? []);
        setStats(r.data?.data?.stats ?? { clockedIn: 0, onBreak: 0, completed: 0, notClockedIn: 0 });
        setLastFetch(new Date());
      },
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = filter === 'all' ? records : records.filter(r => r.clockStatus === filter);
  const total = records.length;
  const presentRate = total > 0 ? Math.round(((stats.clockedIn + stats.onBreak + stats.completed) / total) * 100) : 0;

  const STAT_TABS: { key: FilterKey; label: string; count: number; color: string }[] = [
    { key: 'all',           label: 'All',        count: total,           color: 'text-brand-text-secondary'  },
    { key: 'clocked_in',    label: 'Working',    count: stats.clockedIn, color: 'text-emerald-600'},
    { key: 'on_break',      label: 'Break',      count: stats.onBreak,   color: 'text-amber-600'  },
    { key: 'completed',     label: 'Done',       count: stats.completed, color: 'text-emerald-600' },
    { key: 'not_clocked_in',label: 'Absent',     count: stats.notClockedIn, color: 'text-brand-text-muted'},
  ];

  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-brand-text">Team Status Today</h3>
          <span className="text-xs text-brand-text-muted">— {new Date().toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-[11px] text-brand-text-muted">
              {lastFetch.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetch} disabled={loading}
            className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Attendance rate bar */}
      <div className="px-5 py-3 border-b border-brand-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-brand-text-muted">Attendance rate today</span>
          <span className="text-xs font-bold text-brand-text">{presentRate}%</span>
        </div>
        <div className="h-1.5 bg-brand-bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary rounded-full transition-all duration-500" style={{ width: `${presentRate}%` }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 py-3 border-b border-brand-border overflow-x-auto">
        {STAT_TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
              filter === t.key ? 'bg-brand-bg-muted text-brand-text' : 'text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-bg-soft'
            )}>
            <span className={t.color}>{t.count}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-brand-border/60 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-brand-text-muted">No employees in this category.</div>
        ) : (
          filtered.map((rec) => {
            const cfg = STATUS_CFG[rec.clockStatus];
            const emp = rec.employee;
            const initials = emp?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
            return (
              <div key={String(rec.employeeId)} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg-soft/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{emp?.fullName ?? 'Unknown'}</p>
                  <p className="text-[11px] text-brand-text-muted truncate">{emp?.designation || emp?.department || ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.badge)}>
                    {cfg.label}
                  </span>
                  {rec.checkInTime && (
                    <span className="text-[10px] text-brand-text-muted">{rec.checkInTime}{rec.checkOutTime ? ` – ${rec.checkOutTime}` : ''}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
