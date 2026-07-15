'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, Briefcase, DollarSign, CalendarClock, Clock3, Star,
  ClipboardCheck, Hourglass, AlertTriangle, ShieldAlert,
} from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, LoadingBlock, ErrorBlock, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface ExecutiveSummary {
  headcount: { total: number; active: number; onLeave: number; offboarding: number; terminatedThisMonth: number };
  openPositions: number;
  payrollCost: { thisMonth: number; lastMonth: number };
  leaveLiability: number;
  attendanceRateThisWeek: number;
  avgPerformanceRating: number | null;
  trainingCompletionRate: number;
  pendingApprovals: { total: number; leave: number; expenses: number; timesheets: number; purchaseRequests: number };
  alerts: { probationEndings: number; certsExpiring: number; contractEndings: number; activePIPs: number };
}

interface ExecutiveTrends {
  headcountTrend: { month: string; count: number }[];
  payrollTrend: { month: string; cost: number }[];
  attendanceTrend: { weekStart: string; rate: number }[];
  headcountByDepartment: { department: string; count: number }[];
  leaveByTypeThisMonth: { type: string; days: number }[];
}

const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const pctChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null);

export default function ExecutiveDashboardPage() {
  const locale = useLocale();
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useReportQuery<ExecutiveSummary>('/executive');
  const { data: trends, loading: trendsLoading } = useReportQuery<ExecutiveTrends>('/executive/trends');
  const loading = summaryLoading || trendsLoading;

  const payrollDelta = summary ? pctChange(summary.payrollCost.thisMonth, summary.payrollCost.lastMonth) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Reports &amp; Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">The whole organization, at a glance</p>
      </div>

      <ReportsNav active="executive" />

      {summaryError ? <ErrorBlock message={summaryError} onRetry={refetchSummary} /> : loading || !summary ? <LoadingBlock /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard icon={Users} label="Total Headcount" value={summary.headcount.total} sub={`${summary.headcount.active} active`} colorCls="text-indigo-400" />
            <StatCard icon={Briefcase} label="Open Positions" value={summary.openPositions} colorCls="text-sky-400" />
            <StatCard icon={DollarSign} label="Payroll This Month" value={fmtKES(summary.payrollCost.thisMonth)}
              sub={payrollDelta != null ? `${payrollDelta >= 0 ? '+' : ''}${payrollDelta}% vs last month` : undefined} colorCls="text-emerald-400" />
            <StatCard icon={CalendarClock} label="Leave Liability" value={fmtKES(summary.leaveLiability)} colorCls="text-amber-400" />
            <StatCard icon={Clock3} label="Attendance This Week" value={`${summary.attendanceRateThisWeek}%`} colorCls="text-teal-400" />
            <StatCard icon={Star} label="Avg Rating (last cycle)" value={summary.avgPerformanceRating != null ? `${summary.avgPerformanceRating}/5` : '—'} colorCls="text-violet-400" />
          </div>

          {/* Alert cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <AlertCard icon={ClipboardCheck} label="Pending Approvals" value={summary.pendingApprovals.total}
              sub={`Leave ${summary.pendingApprovals.leave} · Exp ${summary.pendingApprovals.expenses} · TS ${summary.pendingApprovals.timesheets} · PR ${summary.pendingApprovals.purchaseRequests}`}
              href={`/${locale}/leave`} />
            <AlertCard icon={Hourglass} label="Probation Endings (30d)" value={summary.alerts.probationEndings} href={`/${locale}/employees`} />
            <AlertCard icon={AlertTriangle} label="Certs Expiring (30d)" value={summary.alerts.certsExpiring} href={`/${locale}/training/compliance`} />
            <AlertCard icon={ShieldAlert} label="Employees on PIP" value={summary.alerts.activePIPs} href={`/${locale}/performance`} />
          </div>

          {trends && (
            <>
              {/* Trend charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard title="Headcount (12 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trends.headcountTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="count" name="Headcount" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Payroll Cost (12 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trends.payrollTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="cost" name="Cost (KES)" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Attendance Rate (12 weeks)">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trends.attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="weekStart" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="rate" name="Rate %" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Breakdown charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Headcount by Department">
                  <ResponsiveContainer width="100%" height={Math.max(200, trends.headcountByDepartment.length * 34)}>
                    <BarChart data={trends.headcountByDepartment} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="department" width={140} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Employees" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Leave Taken by Type (this month)">
                  {trends.leaveByTypeThisMonth.length === 0 ? (
                    <p className="text-sm text-brand-text-muted text-center py-16">No leave taken yet this month.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={trends.leaveByTypeThisMonth} dataKey="days" nameKey="type" cx="50%" cy="50%" outerRadius={85} label={(e: any) => e.type}>
                          {trends.leaveByTypeThisMonth.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, colorCls }: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; colorCls: string }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-lg font-bold ${colorCls}`}><Icon className="h-4 w-4" /> {value}</div>
      <p className="text-xs text-brand-text-secondary mt-1">{label}</p>
      {sub && <p className="text-[11px] text-brand-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function AlertCard({ icon: Icon, label, value, sub, href }: { icon: React.ElementType; label: string; value: number; sub?: string; href: string }) {
  return (
    <Link href={href} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-amber-500/50 transition-colors block">
      <div className="flex items-center gap-1.5 text-lg font-bold text-amber-400"><Icon className="h-4 w-4" /> {value}</div>
      <p className="text-xs text-brand-text-secondary font-medium mt-1">{label}</p>
      {sub && <p className="text-[11px] text-brand-text-muted mt-0.5">{sub}</p>}
    </Link>
  );
}
