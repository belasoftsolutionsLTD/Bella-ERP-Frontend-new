'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface Liability {
  year: number;
  total: { days: number; value: number };
  byDepartment: { department: string; totalDays: number; value: number }[];
  topExposure: { employeeId: string; employeeName: string; department: string; unusedDays: number; value: number }[];
}
interface Patterns {
  year: number;
  byDayOfWeek: { day: string; count: number }[];
  byMonth: { month: number; days: number }[];
}

const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LeaveReportsPage() {
  const locale = useLocale();
  const { data: liability, loading: lLoading } = useReportQuery<Liability>('/leave/liability');
  const { data: patterns, loading: pLoading } = useReportQuery<Patterns>('/leave/patterns');
  const loading = lLoading || pLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Leave Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Financial exposure &amp; usage patterns — see Leave Dashboard for summary &amp; absenteeism</p>
      </div>
      <ReportsNav active="leave" />

      <Link href={`/${locale}/leave`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Absence Trend, Type Breakdown &amp; Top Leave-Takers</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full leave analytics already live at the Leave Dashboard</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {loading ? <LoadingBlock /> : (
        <>
          {liability && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Total Unused Leave Days" value={liability.total.days} colorCls="text-amber-400" />
                <StatTile label="Total Liability" value={fmtKES(liability.total.value)} colorCls="text-red-400" />
              </div>
              <ChartCard title={`Leave Liability by Department (${liability.year})`}>
                <ResponsiveContainer width="100%" height={Math.max(180, liability.byDepartment.length * 34)}>
                  <BarChart data={liability.byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="department" width={140} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Liability (KES)" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Top Exposure (unused days × daily rate)" action={<ExportCSVButton rows={liability.topExposure} filename="leave-liability.csv" />}>
                <div className="divide-y divide-brand-border/60">
                  {liability.topExposure.slice(0, 10).map((e) => (
                    <div key={e.employeeId} className="flex items-center justify-between py-2.5 text-sm">
                      <div><p className="text-brand-text">{e.employeeName}</p><p className="text-xs text-brand-text-muted">{e.department} · {e.unusedDays} days unused</p></div>
                      <span className="text-sm font-semibold text-red-400">{fmtKES(e.value)}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )}

          {patterns && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Most Common Leave Days">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={patterns.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Requests" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={`Leave Days by Month (${patterns.year})`}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={patterns.byMonth.map((m) => ({ month: MONTH_ABBR[m.month - 1], days: m.days }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="days" name="Days" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
