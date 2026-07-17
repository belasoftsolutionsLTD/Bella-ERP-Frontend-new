'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, TrendingUp, Repeat, DollarSign } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ErrorBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface Movement {
  year: number;
  promotionsByDept: { department: string; count: number }[];
  transfers: { employeeId: string; employeeName: string; department: string; effectiveDate: string; reason: string | null }[];
  salaryChangeCount: number;
}

export default function WorkforceReportsPage() {
  const locale = useLocale();
  const { data, loading, error, refetch } = useReportQuery<Movement>('/workforce/movement');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Workforce Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Movement this year — see Workforce Analytics for headcount, turnover, tenure &amp; demographics</p>
      </div>
      <ReportsNav active="workforce" />

      <Link href={`/${locale}/employees/analytics`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Headcount, Turnover, Tenure &amp; Demographics</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full workforce analytics already live at Employees → Analytics</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading || !data ? <LoadingBlock /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile icon={TrendingUp} label="Promotions this year" value={data.promotionsByDept.reduce((s, d) => s + d.count, 0)} colorCls="text-emerald-400" />
            <StatTile icon={Repeat} label="Internal Transfers" value={data.transfers.length} colorCls="text-sky-400" />
            <StatTile icon={DollarSign} label="Salary Changes" value={data.salaryChangeCount} colorCls="text-amber-400" />
          </div>

          <ChartCard title={`Promotions by Department (${data.year})`}>
            {data.promotionsByDept.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-10">No promotions recorded this year.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, data.promotionsByDept.length * 34)}>
                <BarChart data={data.promotionsByDept} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="department" width={140} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Promotions" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Internal Transfers" action={<ExportCSVButton rows={data.transfers} filename="transfers.csv" />}>
            {data.transfers.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-10">No department transfers this year.</p>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {data.transfers.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="text-brand-text">{t.employeeName}</p>
                      <p className="text-xs text-brand-text-muted">{t.department} · {new Date(t.effectiveDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                    </div>
                    {t.reason && <span className="text-xs text-brand-text-muted italic">{t.reason}</span>}
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
