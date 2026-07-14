'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, UserCheck, UserX, Clock, CalendarOff, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendanceAnalytics } from '../Hooks/useAttendanceAnalytics';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-brand-text mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="font-semibold" style={{ color: p.color ?? p.payload?.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function AttendanceAnalyticsPage() {
  const locale = useLocale();
  const [groupBy, setGroupBy] = useState<'employee' | 'department'>('department');
  const { overview, summary, overtime, lateTrend, lateLeaderboard, absenteeism, loading } = useAttendanceAnalytics(groupBy);

  const kpis = [
    { label: 'Present Today', value: overview?.present ?? 0, color: 'text-emerald-400', icon: UserCheck },
    { label: 'Absent Today', value: overview?.absent ?? 0, color: 'text-red-400', icon: UserX },
    { label: 'Late Today', value: overview?.late ?? 0, color: 'text-amber-400', icon: Clock },
    { label: 'On Leave Today', value: overview?.onLeave ?? 0, color: 'text-blue-400', icon: CalendarOff },
    { label: 'Not Clocked In', value: overview?.notClockedIn ?? 0, color: 'text-brand-text-secondary', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/attendance`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Attendance
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Attendance Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Presence, lateness, overtime, and absenteeism trends</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
                <p className={cn('text-2xl font-bold flex items-center justify-center gap-1.5', k.color)}>
                  <k.icon className="h-4 w-4" /> {k.value}
                </p>
                <p className="text-xs text-brand-text-secondary mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          <ChartCard title="Late Arrivals Trend">
            {!lateTrend.length ? (
              <p className="text-sm text-brand-text-muted text-center py-16">No late arrivals in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={lateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" name="Late arrivals" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="flex items-center justify-end">
            <div className="flex items-center bg-brand-bg-soft rounded-lg p-0.5">
              {(['department', 'employee'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors',
                    groupBy === g ? 'bg-brand-bg-muted text-indigo-400' : 'text-brand-text-secondary hover:text-brand-text-secondary',
                  )}
                >
                  By {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title={`Overtime Hours (This Month, by ${groupBy})`}>
              {!overtime.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No overtime recorded this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, overtime.length * 32)}>
                  <BarChart data={overtime.slice(0, 12)} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="overtimeHours" name="Overtime (hrs)" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Absenteeism Rate by Department">
              {!absenteeism.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, absenteeism.length * 32)}>
                  <BarChart data={absenteeism} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="absenteeismRate" name="Absenteeism %" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title={`Hours Worked vs Expected (by ${groupBy})`}>
              {!summary.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, summary.length * 32)}>
                  <BarChart data={summary.slice(0, 12)} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="attendanceRate" name="Attendance Rate" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Late Arrivals Leaderboard (This Month)">
              {!lateLeaderboard.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No repeat latecomers this month.</p>
              ) : (
                <div className="divide-y divide-brand-border/60">
                  {lateLeaderboard.map((row, i) => (
                    <div key={row.employeeId} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                          i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-bg-soft text-brand-text-muted',
                        )}>
                          {i === 0 ? <Trophy className="h-3 w-3" /> : i + 1}
                        </span>
                        <div>
                          <p className="text-brand-text">{row.employee?.fullName ?? 'Unknown'}</p>
                          <p className="text-xs text-brand-text-muted">{row.employee?.department ?? ''}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-400">{row.lateCount} late day{row.lateCount !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
