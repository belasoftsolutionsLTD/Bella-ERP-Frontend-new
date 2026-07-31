'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useOnboardingAnalytics } from '../Hooks/useOnboardingAnalytics';

const STAKEHOLDER_LABEL: Record<string, string> = { hr: 'HR', it: 'IT', manager: 'Manager', newHire: 'New Hire', finance: 'Finance' };
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function OnboardingAnalyticsPage() {
  const locale = useLocale();
  const { data, loading } = useOnboardingAnalytics();

  const monthlyData = (data?.newHiresByMonth ?? []).map(m => {
    const [year, month] = m.key.split('-');
    return { label: `${MONTH_ABBR[Number(month) - 1]} ${year}`, 'New Hires': m.count };
  });

  const stakeholderData = (data?.taskCompletionRateByStakeholder ?? []).map(s => ({
    stakeholder: STAKEHOLDER_LABEL[s.assignedTo] ?? s.assignedTo, 'Completion Rate': s.rate,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/onboarding`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Onboarding
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Onboarding Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Completion times, stakeholder throughput & new hire trends</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : !data ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No analytics data available yet.</p>
      ) : (
        <>
          <ChartCard title="New Hires — Last 12 Months">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="New Hires" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Avg Completion Time by Department (days)">
              {data.avgCompletionDaysByDepartment.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No completed records yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={data.avgCompletionDaysByDepartment}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="department" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Radar name="Avg Days" dataKey="avgDays" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Avg Completion Time by Template (days)">
              {data.avgCompletionDaysByTemplate.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-16">No completed records yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={data.avgCompletionDaysByTemplate}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="templateName" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Radar name="Avg Days" dataKey="avgDays" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Task Completion Rate by Stakeholder">
            {stakeholderData.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-16">No task data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={stakeholderData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="stakeholder" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Radar name="Completion Rate" dataKey="Completion Rate" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Stalled Employees (No Activity 7+ Days)">
            {data.stalledEmployees.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-8">No stalled onboarding records — nice work.</p>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {data.stalledEmployees.map(e => (
                  <div key={e.employeeId} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="text-brand-text">{e.fullName}</span>
                      <span className="text-xs text-brand-text-muted">{e.department}</span>
                    </div>
                    <span className="text-xs text-red-400 font-semibold">{e.daysSinceActivity}d inactive</span>
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
