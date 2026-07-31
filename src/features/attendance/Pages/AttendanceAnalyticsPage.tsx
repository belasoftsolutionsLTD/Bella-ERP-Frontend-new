'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  LineChart, Line, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, UserCheck, UserX, Clock, CalendarOff, HelpCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendanceAnalytics } from '../Hooks/useAttendanceAnalytics';

const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

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

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-brand-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary font-semibold mb-0.5">{d.name}</p>
      <p className="font-bold" style={{ color: d.payload?.fill }}>{d.value}</p>
    </div>
  );
}

export default function AttendanceAnalyticsPage() {
  const locale = useLocale();
  const [groupBy, setGroupBy] = useState<'employee' | 'department'>('department');
  const { overview, summary, overtime, lateTrend, lateLeaderboard, absenteeism, loading } = useAttendanceAnalytics(groupBy);

  // Top-N + "Other" bucket so the overtime donut stays readable when there are many employees/departments.
  const OVERTIME_TOP_N = 6;
  const overtimeSorted = [...overtime].sort((a: any, b: any) => b.overtimeHours - a.overtimeHours);
  const overtimeDonutData = (() => {
    const top = overtimeSorted.slice(0, OVERTIME_TOP_N);
    const rest = overtimeSorted.slice(OVERTIME_TOP_N);
    const otherTotal = rest.reduce((s: number, r: any) => s + r.overtimeHours, 0);
    return otherTotal > 0 ? [...top, { label: 'Other', overtimeHours: otherTotal }] : top;
  })();

  const attendanceRadarData = summary.slice(0, 8).map((s: any) => ({ category: s.label, value: s.attendanceRate }));

  const kpis = [
    { label: 'Present Today', value: overview?.present ?? 0, color: 'text-emerald-600', icon: UserCheck },
    { label: 'Absent Today', value: overview?.absent ?? 0, color: 'text-red-600', icon: UserX },
    { label: 'Late Today', value: overview?.late ?? 0, color: 'text-amber-600', icon: Clock },
    { label: 'On Leave Today', value: overview?.onLeave ?? 0, color: 'text-blue-600', icon: CalendarOff },
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
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={overtimeDonutData} dataKey="overtimeHours" nameKey="label" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={52} paddingAngle={2}>
                      {overtimeDonutData.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Absenteeism Rate by Department">
              {!absenteeism.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={absenteeism} dataKey="absenteeismRate" nameKey="department" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={52} paddingAngle={2}>
                      {absenteeism.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title={`Attendance Rate (by ${groupBy})`}>
              {!summary.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={attendanceRadarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Radar dataKey="value" name="Attendance Rate" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.4} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
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
