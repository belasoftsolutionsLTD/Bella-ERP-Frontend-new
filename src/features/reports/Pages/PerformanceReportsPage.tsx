'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ErrorBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface GoalsReport {
  byDepartment: { department: string; total: number; completed: number; completionRate: number }[];
  byCategory: { category: string; total: number; completed: number; completionRate: number }[];
}
interface FeedbackReport { trend: { month: string; total: number; positive: number; constructive: number }[]; }
interface PipReport {
  active: { _id: string; employeeName: string; managerName: string; startDate: string; endDate: string }[];
  completed: { _id: string; employeeName: string; managerName: string; outcome: string }[];
  outcomeSummary: { passed: number; failed: number };
}

export default function PerformanceReportsPage() {
  const locale = useLocale();
  const { data: goals, loading: gLoading, error: gError, refetch: gRefetch } = useReportQuery<GoalsReport>('/performance/goals');
  const { data: feedback, loading: fLoading, error: fError, refetch: fRefetch } = useReportQuery<FeedbackReport>('/performance/feedback');
  const { data: pip, loading: pLoading, error: pError, refetch: pRefetch } = useReportQuery<PipReport>('/performance/pip');
  const loading = gLoading || fLoading || pLoading;
  const error = gError || fError || pError;
  const refetch = () => { gRefetch(); fRefetch(); pRefetch(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Performance Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Goals, feedback &amp; PIPs — see Performance Analytics for rating distribution</p>
      </div>
      <ReportsNav active="performance" />

      <Link href={`/${locale}/performance`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Rating Distribution &amp; Review Participation</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full performance analytics already live at the Performance module</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading ? <LoadingBlock /> : (
        <>
          {goals && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Goal Completion Rate by Department">
                <ResponsiveContainer width="100%" height={Math.max(180, goals.byDepartment.length * 34)}>
                  <BarChart data={goals.byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="completionRate" name="Completion %" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Goal Completion Rate by Category">
                <ResponsiveContainer width="100%" height={Math.max(180, goals.byCategory.length * 34)}>
                  <BarChart data={goals.byCategory} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="completionRate" name="Completion %" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {feedback && (
            <ChartCard title="Feedback Volume Trend">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={feedback.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="positive" name="Positive" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="constructive" name="Constructive" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {pip && (
            <ChartCard title="Performance Improvement Plans" action={<ExportCSVButton rows={[...pip.active, ...pip.completed]} filename="pips.csv" />}>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div><p className="text-lg font-bold text-amber-400">{pip.active.length}</p><p className="text-xs text-brand-text-secondary">Active</p></div>
                <div><p className="text-lg font-bold text-emerald-400">{pip.outcomeSummary.passed}</p><p className="text-xs text-brand-text-secondary">Passed</p></div>
                <div><p className="text-lg font-bold text-red-400">{pip.outcomeSummary.failed}</p><p className="text-xs text-brand-text-secondary">Not Met</p></div>
              </div>
              <div className="divide-y divide-brand-border/60">
                {pip.active.map((p) => (
                  <div key={p._id} className="flex items-center justify-between py-2.5 text-sm">
                    <div><p className="text-brand-text">{p.employeeName}</p><p className="text-xs text-brand-text-muted">Manager: {p.managerName}</p></div>
                    <span className="text-xs text-amber-400">
                      {new Date(p.startDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })} → {new Date(p.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                    </span>
                  </div>
                ))}
                {pip.active.length === 0 && <p className="text-sm text-brand-text-muted text-center py-6">No active PIPs.</p>}
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
