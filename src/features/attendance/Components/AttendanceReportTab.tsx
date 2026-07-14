'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile } from '@/functions/downloadFile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ManualEntryModal } from './ManualEntryModal';

interface DayRecord {
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkMinutes?: number;
}

interface EmployeeRow {
  employee: { _id: string; fullName: string; staffNumber?: string; department?: string };
  days: Record<string, DayRecord>;
}

interface Stats {
  attendanceRate: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalRecords: number;
}

const STATUS_CFG: Record<string, { bg: string; label: string }> = {
  present:    { bg: 'bg-emerald-500/80',   label: 'P'  },
  late:       { bg: 'bg-amber-500/80',     label: 'L'  },
  absent:     { bg: 'bg-red-500/80',       label: 'A'  },
  half_day:   { bg: 'bg-blue-500/80',      label: 'H'  },
  leave:      { bg: 'bg-violet-500/80',    label: 'LV' },
  holiday:    { bg: 'bg-slate-600',        label: 'PH' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function AttendanceReportTab() {
  const { isHR } = useAuth();
  const now = new Date();
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [dept,   setDept]   = useState('');
  const [report, setReport] = useState<EmployeeRow[]>([]);
  const [stats,  setStats]  = useState<Stats | null>(null);
  const [depts,  setDepts]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualEntry, setManualEntry] = useState<{ employeeId?: string; date?: string } | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleExport = () => {
    const deptParam = dept ? `&department=${encodeURIComponent(dept)}` : '';
    downloadFile(`${API_BASE_URL}/attendance/report/export?month=${month}&year=${year}${deptParam}`, `attendance-${year}-${String(month).padStart(2, '0')}.csv`)
      .catch((err) => toast.error(err.message || 'Export failed.'));
  };

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/departments`,
      showToast: false,
      thenFn: r => setDepts((r.data?.data ?? []).map((d: { name: string }) => d.name)),
    });
  }, []);

  const fetchReport = useCallback(() => {
    setLoading(true);
    const params = `month=${month}&year=${year}${dept ? `&department=${encodeURIComponent(dept)}` : ''}`;
    Promise.all([
      new Promise<void>(resolve => apiCallFunction<any>({
        url: `${API_BASE_URL}/attendance/report?${params}`,
        showToast: false,
        thenFn: r => { setReport(r.data?.data?.report ?? []); resolve(); },
        catchFn: () => resolve(),
      })),
      new Promise<void>(resolve => apiCallFunction<any>({
        url: `${API_BASE_URL}/attendance/stats?${params}`,
        showToast: false,
        thenFn: r => { setStats(r.data?.data ?? null); resolve(); },
        catchFn: () => resolve(),
      })),
    ]).finally(() => setLoading(false));
  }, [month, year, dept]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const dateKey = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-brand-text min-w-[140px] text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={nextMonth} disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
            className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <select value={dept} onChange={e => setDept(e.target.value)}
          className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {isHR && (
          <button onClick={() => setManualEntry({})} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg-soft border border-brand-border text-brand-text-secondary hover:text-brand-text text-sm transition-colors">
            <UserPlus className="h-4 w-4" /> Add Manual Entry
          </button>
        )}

        <button onClick={handleExport} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg-soft border border-brand-border text-brand-text-secondary hover:text-brand-text text-sm transition-colors', !isHR && 'ml-auto')}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Attendance Rate', value: `${stats.attendanceRate}%`,  color: 'text-emerald-400' },
            { label: 'Present',         value: stats.totalPresent,          color: 'text-emerald-400' },
            { label: 'Late',            value: stats.totalLate,             color: 'text-amber-400'   },
            { label: 'Absent',          value: stats.totalAbsent,           color: 'text-red-400'     },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 text-center">
              <p className="text-[11px] text-brand-text-muted uppercase tracking-wide mb-0.5">{label}</p>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : report.length === 0 ? (
        <div className="py-16 text-center text-brand-text-muted text-sm">No attendance records found for this period.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table className="w-full text-xs border-collapse bg-brand-bg-soft">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg-soft/60">
                <th className="sticky left-0 bg-brand-bg-soft z-10 text-left px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold min-w-[160px] border-r border-brand-border">
                  Employee
                </th>
                {dayNums.map(d => {
                  const dt = new Date(year, month - 1, d);
                  const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                  const isToday = dateKey(d) === new Date().toISOString().split('T')[0];
                  return (
                    <th key={d} className={cn('text-center px-0.5 py-2.5 font-semibold min-w-[28px]',
                      isToday ? 'text-indigo-400' : isWeekend ? 'text-brand-text-muted' : 'text-brand-text-secondary')}>
                      {d}
                    </th>
                  );
                })}
                <th className="text-center px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold min-w-[60px]">P</th>
                <th className="text-center px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold min-w-[60px]">A</th>
                <th className="text-center px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold min-w-[60px]">%</th>
              </tr>
            </thead>
            <tbody>
              {report.map(({ employee, days }) => {
                const presentDays = Object.values(days).filter(d => d.status === 'present' || d.status === 'late').length;
                const absentDays  = Object.values(days).filter(d => d.status === 'absent').length;
                const workDays    = dayNums.filter(d => { const dt = new Date(year, month - 1, d); return dt.getDay() !== 0 && dt.getDay() !== 6; }).length;
                const rate = workDays > 0 ? Math.round((presentDays / workDays) * 100) : 0;

                return (
                  <tr key={String(employee._id)} className="border-b border-brand-border/60 hover:bg-brand-bg-soft/30 transition-colors">
                    <td className="sticky left-0 bg-brand-bg-soft z-10 px-3 py-2 border-r border-brand-border">
                      <p className="font-medium text-brand-text truncate max-w-[150px]">{employee.fullName}</p>
                      {employee.department && <p className="text-[10px] text-brand-text-muted">{employee.department}</p>}
                    </td>
                    {dayNums.map(d => {
                      const key = dateKey(d);
                      const rec = days[key];
                      const dt  = new Date(year, month - 1, d);
                      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                      const cfg = rec?.status ? STATUS_CFG[rec.status] : null;
                      return (
                        <td key={d} className="text-center p-0.5">
                          <div
                            title={rec?.checkInTime ? `${rec.checkInTime}–${rec.checkOutTime ?? '?'}` : isHR ? 'Click to add a manual entry' : undefined}
                            onClick={isHR ? () => setManualEntry({ employeeId: String(employee._id), date: key }) : undefined}
                            className={cn('mx-auto h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold',
                              isHR ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400/50' : 'cursor-default',
                              cfg ? cfg.bg + ' text-white' : isWeekend ? 'bg-brand-bg-soft text-slate-700' : 'bg-brand-bg-soft/50 text-slate-700')}>
                            {cfg ? cfg.label : isWeekend ? '—' : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-2 text-emerald-400 font-bold">{presentDays}</td>
                    <td className="text-center px-3 py-2 text-red-400 font-bold">{absentDays}</td>
                    <td className="text-center px-3 py-2">
                      <span className={cn('font-bold', rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400')}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(STATUS_CFG).map(([key, { bg, label }]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
            <span className={cn('h-4 w-4 rounded flex items-center justify-center text-[9px] font-bold text-white', bg)}>{label}</span>
            {key.replace('_', ' ')}
          </span>
        ))}
      </div>

      {manualEntry && (
        <ManualEntryModal
          employees={report.map(r => ({ _id: String(r.employee._id), fullName: r.employee.fullName, staffNumber: r.employee.staffNumber }))}
          defaultEmployeeId={manualEntry.employeeId}
          defaultDate={manualEntry.date}
          onClose={() => setManualEntry(null)}
          onSaved={fetchReport}
        />
      )}
    </div>
  );
}
