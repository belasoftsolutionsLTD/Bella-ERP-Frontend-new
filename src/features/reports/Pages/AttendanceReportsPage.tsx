'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface SummaryGroup { key: string; label: string; present: number; late: number; absent: number; halfDay: number; totalDays: number; }
interface OvertimeGroup { key: string; label: string; overtimeMinutes: number; overtimeHours: number; }
interface Punctuality {
  trend: { date: string; count: number }[];
  leaderboard: { employeeId: string; employee: { fullName: string; department?: string } | null; lateCount: number }[];
}

export default function AttendanceReportsPage() {
  const { data: summary, loading: sLoading } = useReportQuery<SummaryGroup[]>('/attendance/summary', { groupBy: 'department' });
  const { data: overtime, loading: oLoading } = useReportQuery<OvertimeGroup[]>('/attendance/overtime', { groupBy: 'department' });
  const { data: punctuality, loading: pLoading } = useReportQuery<Punctuality>('/attendance/punctuality');
  const loading = sLoading || oLoading || pLoading;

  const totalPresent = summary?.reduce((s, r) => s + r.present, 0) ?? 0;
  const totalAbsent = summary?.reduce((s, r) => s + r.absent, 0) ?? 0;
  const totalLate = summary?.reduce((s, r) => s + r.late, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Attendance Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Presence, overtime, and punctuality across the organization</p>
      </div>
      <ReportsNav active="attendance" />

      {loading ? <LoadingBlock /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Present" value={totalPresent} colorCls="text-emerald-400" />
            <StatTile label="Late" value={totalLate} colorCls="text-amber-400" />
            <StatTile label="Absent" value={totalAbsent} colorCls="text-red-400" />
          </div>

          {summary && (
            <ChartCard title="Present / Absent / Late by Department (this month)" action={<ExportCSVButton rows={summary} filename="attendance-summary.csv" />}>
              <ResponsiveContainer width="100%" height={Math.max(200, summary.length * 40)}>
                <BarChart data={summary} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="present" stackId="a" name="Present" fill={CHART_COLORS[2]} />
                  <Bar dataKey="late" stackId="a" name="Late" fill={CHART_COLORS[3]} />
                  <Bar dataKey="absent" stackId="a" name="Absent" fill={CHART_COLORS[4]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {overtime && (
            <ChartCard title="Overtime Hours by Department (this month)">
              {overtime.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No overtime recorded this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, overtime.length * 34)}>
                  <BarChart data={overtime} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="overtimeHours" name="Hours" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          {punctuality && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Late Arrivals Trend (last 30 days)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={punctuality.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="Late arrivals" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Late Arrival Leaderboard (top 10)">
                <div className="divide-y divide-slate-700/60">
                  {punctuality.leaderboard.map((e) => (
                    <div key={e.employeeId} className="flex items-center justify-between py-2 text-sm">
                      <div><span className="text-brand-text">{e.employee?.fullName ?? 'Unknown'}</span>{e.employee?.department && <span className="text-xs text-slate-500 ml-2">{e.employee.department}</span>}</div>
                      <span className="text-amber-400 font-semibold">{e.lateCount}</span>
                    </div>
                  ))}
                  {punctuality.leaderboard.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No late arrivals recorded.</p>}
                </div>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
