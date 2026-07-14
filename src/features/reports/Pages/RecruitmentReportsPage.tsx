'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface Pipeline { byDepartment: { department: string; openPositions: number; applicants: number }[]; totalOpenPositions: number; totalApplicants: number; avgTimeToHireDays: number | null; }
interface Source { source: string; applications: number; hires: number; conversionRate: number; }
interface Funnel { totalApplicants: number; funnel: { stageName: string; count: number; conversionRate: number }[]; }

export default function RecruitmentReportsPage() {
  const locale = useLocale();
  const { data: pipeline, loading: pLoading } = useReportQuery<Pipeline>('/recruitment/pipeline');
  const { data: source, loading: sLoading } = useReportQuery<Source[]>('/recruitment/source');
  const { data: funnel, loading: fLoading } = useReportQuery<Funnel>('/recruitment/funnel');
  const loading = pLoading || sLoading || fLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Recruitment Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Org-wide pipeline &amp; source effectiveness — see Recruitment Analytics for time-to-fill &amp; offer acceptance</p>
      </div>
      <ReportsNav active="recruitment" />

      <Link href={`/${locale}/recruitment/analytics`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Time to Fill, Time in Stage &amp; Offer Acceptance</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full recruitment analytics already live at Recruitment → Analytics</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {loading ? <LoadingBlock /> : (
        <>
          {pipeline && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="Open Positions" value={pipeline.totalOpenPositions} colorCls="text-sky-400" />
                <StatTile label="Total Applicants" value={pipeline.totalApplicants} colorCls="text-indigo-400" />
                <StatTile label="Avg Time to Hire" value={pipeline.avgTimeToHireDays != null ? `${pipeline.avgTimeToHireDays}d` : '—'} colorCls="text-emerald-400" />
              </div>
              <ChartCard title="Open Positions by Department">
                <ResponsiveContainer width="100%" height={Math.max(180, pipeline.byDepartment.length * 34)}>
                  <BarChart data={pipeline.byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="openPositions" name="Open Roles" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="applicants" name="Applicants" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {source && (
            <ChartCard title="Source of Hire Effectiveness">
              <ResponsiveContainer width="100%" height={Math.max(180, source.length * 40)}>
                <BarChart data={source} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="source" width={100} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="applications" name="Applications" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="hires" name="Hires" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {funnel && (
            <ChartCard title={`Application Funnel (${funnel.totalApplicants} total applicants)`}>
              <div className="space-y-2">
                {funnel.funnel.map((s) => (
                  <div key={s.stageName}>
                    <div className="flex justify-between text-xs text-brand-text-secondary mb-1"><span>{s.stageName}</span><span>{s.count} ({s.conversionRate}%)</span></div>
                    <div className="h-2 rounded-full bg-brand-bg-muted overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{ width: `${s.conversionRate}%` }} /></div>
                  </div>
                ))}
                {funnel.funnel.length === 0 && <p className="text-sm text-brand-text-muted text-center py-6">No pipeline stage data yet.</p>}
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
