'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveAnalytics } from '../Hooks/useLeaveAnalytics';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

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

export default function LeaveAnalyticsPage() {
  const locale = useLocale();
  const { data, loading } = useLeaveAnalytics();

  const monthlyData = (data?.absenceTrendByMonth ?? []).map(m => {
    const [year, month] = m.month.split('-');
    return { label: `${MONTH_ABBR[Number(month) - 1]} ${year}`, 'Days Taken': m.days };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Leave
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Leave Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Trends, liability, and approval aging</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : !data ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No analytics data available yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-400 flex items-center justify-center gap-1.5"><Clock className="h-4 w-4" /> {data.pendingCount}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Pending Requests</p>
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1.5"><TrendingUp className="h-4 w-4" /> {data.totalRequests}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Total Requests</p>
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center col-span-2 sm:col-span-2">
              <p className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1.5"><Users className="h-4 w-4" /> {data.leaveLiabilityDays}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Leave Liability (unused days across the org)</p>
            </div>
          </div>

          <ChartCard title="Absence Trend — Last 12 Months">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Days Taken" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title="Leave Type Breakdown">
              {data.leaveTypeBreakdown.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No approved leave yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={data.leaveTypeBreakdown} dataKey="days" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                      {data.leaveTypeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Department Absence (days taken)">
              {data.departmentAbsence.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No approved leave yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.departmentAbsence} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="days" name="Days" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Top Leave Takers This Year">
            {data.topLeaveTakers.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-8">No approved leave yet.</p>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {data.topLeaveTakers.map((t, i) => (
                  <div key={t.employeeId} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-brand-text-secondary">#{i + 1} {t.employee?.fullName ?? 'Unknown'} <span className="text-xs text-brand-text-muted">({t.employee?.department})</span></span>
                    <span className="text-xs font-semibold text-brand-text-secondary">{t.days} days</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Pending Requests Aging">
            {data.pendingRequestsAging.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-8">No pending requests.</p>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {data.pendingRequestsAging.map(r => (
                  <div key={r._id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/${locale}/leave/requests/${r._id}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">View request</Link>
                    <span className={cn('text-xs font-semibold', r.daysWaiting > 5 ? 'text-red-400' : 'text-brand-text-secondary')}>{r.daysWaiting} day{r.daysWaiting !== 1 ? 's' : ''} waiting</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
