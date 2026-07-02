'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveColor, LEAVE_TYPE_LABELS } from '../constants';
import { cn } from '@/lib/utils';

interface Analytics {
  totalDays: number;
  avgDays: number;
  mostUsedType: { type: string; days: number } | null;
  zeroCount: number;
  byType: Record<string, number>;
  byMonth: number[];
  byDept: Record<string, number>;
  topEmployees: { employee: { fullName: string; department?: string } | null; days: number }[];
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function LeaveAnalyticsTab() {
  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading,   setLoading]   = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/analytics?year=${year}`,
      showToast: false,
      thenFn: r => setAnalytics(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="py-20 text-center text-slate-600">No analytics data available.</div>;
  }

  const { totalDays, avgDays, mostUsedType, zeroCount, byType, byMonth, byDept, topEmployees } = analytics;

  // Chart calculations
  const byTypeEntries  = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const totalByType    = byTypeEntries.reduce((s, [, v]) => s + v, 0);

  const monthMax  = Math.max(...byMonth, 1);
  const deptEntries = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const deptMax   = Math.max(...deptEntries.map(d => d[1]), 1);

  return (
    <div className="space-y-6">
      {/* Year picker */}
      <div className="flex items-center gap-2">
        <button onClick={() => setYear(y => y - 1)}
          className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-slate-100 w-16 text-center">{year}</span>
        <button onClick={() => setYear(y => y + 1)} disabled={year >= now.getFullYear()}
          className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Leave Days',     value: totalDays,                        color: 'text-indigo-400' },
          { label: 'Most Used Type',       value: mostUsedType ? `${LEAVE_TYPE_LABELS[mostUsedType.type] ?? mostUsedType.type} (${mostUsedType.days}d)` : '—', color: 'text-blue-400'  },
          { label: 'Avg Days / Employee',  value: `${avgDays}d`,                    color: 'text-emerald-400'},
          { label: 'No Leave Taken',       value: zeroCount,                        color: zeroCount > 5 ? 'text-red-400' : 'text-slate-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={cn('text-xl font-bold truncate', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave by type — donut */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Leave by Type</h3>
          {byTypeEntries.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-6">No data for {year}.</p>
          ) : (
            <div className="flex items-start gap-4">
              {/* SVG donut */}
              <DonutChart entries={byTypeEntries} total={totalByType} />
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {byTypeEntries.map(([type, days], i) => {
                  const color = leaveColor(type, i);
                  const pct   = Math.round((days / totalByType) * 100);
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-slate-300 truncate max-w-[120px]">{LEAVE_TYPE_LABELS[type] ?? type}</span>
                      </div>
                      <span className="text-slate-400 font-semibold">{days}d <span className="text-slate-600">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Monthly trend — vertical bars */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Monthly Leave Trend</h3>
          <div className="flex items-end gap-1 h-32">
            {byMonth.map((days, m) => {
              const h   = monthMax > 0 ? Math.round((days / monthMax) * 100) : 0;
              const isThisMonth = m === now.getMonth() && year === now.getFullYear();
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-600">{days > 0 ? days : ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    <div className={cn('w-full rounded-t transition-all duration-500', isThisMonth ? 'bg-indigo-500' : 'bg-indigo-500/40')}
                      style={{ height: `${Math.max(h, days > 0 ? 4 : 0)}%`, minHeight: days > 0 ? '2px' : '0' }} />
                  </div>
                  <span className={cn('text-[9px]', isThisMonth ? 'text-indigo-400 font-bold' : 'text-slate-600')}>
                    {MONTHS_SHORT[m]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* By department — horizontal bars */}
      {deptEntries.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Leave by Department</h3>
          <div className="space-y-3">
            {deptEntries.map(([dept, days]) => {
              const pct = Math.round((days / deptMax) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[200px]">{dept}</span>
                    <span className="text-slate-400 font-semibold">{days} days</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top employees */}
      {topEmployees.length > 0 && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-slate-100">Top 10 Employees by Leave Days</h3>
          </div>
          <div className="divide-y divide-slate-700/60">
            {topEmployees.map(({ employee, days }, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                <span className={cn('text-sm font-bold w-5 text-center', i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-600')}>
                  {i + 1}
                </span>
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                  {employee?.fullName?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{employee?.fullName ?? 'Unknown'}</p>
                  {employee?.department && <p className="text-[10px] text-slate-500">{employee.department}</p>}
                </div>
                <span className="text-sm font-bold text-slate-100">{days} days</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

function DonutChart({ entries, total }: { entries: [string, number][]; total: number }) {
  const R = 44; const CIRC = 2 * Math.PI * R;
  let cumPct = 0;
  return (
    <div className="relative shrink-0">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#334155" strokeWidth="10" />
        {entries.map(([type, days], i) => {
          const pct    = days / total;
          const offset = CIRC * (1 - cumPct - pct);
          const dash   = CIRC * pct - 2;
          const el = (
            <circle key={type} cx="55" cy="55" r={R} fill="none"
              stroke={leaveColor(type, i)} strokeWidth="10"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt" />
          );
          cumPct += pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-100">{total}</span>
        <span className="text-[10px] text-slate-500">days</span>
      </div>
    </div>
  );
}
