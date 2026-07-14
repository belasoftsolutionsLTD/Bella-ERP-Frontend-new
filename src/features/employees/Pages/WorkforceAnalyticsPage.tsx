'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Users, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkforceAnalytics } from '../Hooks/useWorkforceAnalytics';

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

const BUCKET_LABEL: Record<number, string> = { 30: 'Next 30 days', 60: '31–60 days', 90: '61–90 days' };
const BUCKET_COLOR: Record<number, string> = { 30: 'text-red-400', 60: 'text-amber-400', 90: 'text-brand-text-secondary' };

function UpcomingList({ title, items, dateField }: { title: string; items: { _id: string; fullName: string; department: string; daysRemaining: number; bucket: number }[]; dateField: string }) {
  return (
    <ChartCard title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-8">Nothing in the next 90 days.</p>
      ) : (
        <div className="divide-y divide-brand-border/60">
          {items.map(e => (
            <div key={e._id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-brand-text">{e.fullName}</p>
                <p className="text-xs text-brand-text-muted">{e.department}</p>
              </div>
              <span className={cn('text-xs font-semibold', BUCKET_COLOR[e.bucket])}>
                {e.daysRemaining} day{e.daysRemaining !== 1 ? 's' : ''} · {BUCKET_LABEL[e.bucket]}
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export default function WorkforceAnalyticsPage() {
  const locale = useLocale();
  const { headcount, turnover, tenure, demographics, upcoming, loading } = useWorkforceAnalytics();

  const turnoverData = turnover.map(t => {
    const [year, month] = t.month.split('-');
    return { label: `${MONTH_ABBR[Number(month) - 1]} ${year}`, Hires: t.hires, Terminations: t.terminations };
  });

  const totalUpcoming = (upcoming?.probationEndings.length ?? 0) + (upcoming?.passportExpiries.length ?? 0) + (upcoming?.contractEndings.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/employees`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> People
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Workforce Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Headcount, turnover, tenure, and upcoming deadlines</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-400 flex items-center justify-center gap-1.5"><Users className="h-4 w-4" /> {headcount?.total ?? 0}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Active Headcount</p>
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1.5"><TrendingUp className="h-4 w-4" /> {turnover.reduce((s, t) => s + t.hires, 0)}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Hires ({turnover.length}mo)</p>
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400 flex items-center justify-center gap-1.5"><TrendingDown className="h-4 w-4" /> {turnover.reduce((s, t) => s + t.terminations, 0)}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Terminations ({turnover.length}mo)</p>
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {totalUpcoming}</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">Upcoming Deadlines</p>
            </div>
          </div>

          <ChartCard title="Hires vs Terminations">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Hires" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                <Line type="monotone" dataKey="Terminations" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title="Headcount by Department">
              {!headcount?.byDepartment.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={headcount.byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Employment Type Breakdown">
              {!headcount?.byEmploymentType.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={headcount.byEmploymentType} dataKey="count" nameKey="employmentType" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.employmentType}>
                      {headcount.byEmploymentType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <ChartCard title="Average Tenure by Department (years)">
              {!tenure.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tenure} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="averageTenureYears" name="Avg Years" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Gender Breakdown">
              {!demographics?.byGender.length ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={demographics.byGender} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.gender}>
                      {demographics.byGender.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <UpcomingList title="Probation Endings" items={upcoming?.probationEndings ?? []} dateField="probationEndDate" />
            <UpcomingList title="Passport Expiries" items={upcoming?.passportExpiries ?? []} dateField="passportExpiryDate" />
            <UpcomingList title="Contract Endings" items={upcoming?.contractEndings ?? []} dateField="contractEndDate" />
          </div>
        </>
      )}
    </div>
  );
}
