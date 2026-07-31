'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, LoadingBlock, ErrorBlock, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface Breakdown {
  month: number; year: number; headcount: number;
  gross: number; paye: number; sha: number; nssf: number; ahl: number; otherDeductions: number; net: number;
}
interface OvertimeCost {
  trend: { month: string; cost: number }[];
  byDepartmentThisMonth: { department: string; cost: number }[];
}

const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString()}`;

export default function PayrollReportsPage() {
  const locale = useLocale();
  const { data: breakdown, loading: bLoading, error: bError, refetch: bRefetch } = useReportQuery<Breakdown>('/payroll/breakdown');
  const { data: overtime, loading: oLoading, error: oError, refetch: oRefetch } = useReportQuery<OvertimeCost>('/payroll/overtime');
  const loading = bLoading || oLoading;
  const error = bError || oError;
  const refetch = () => { bRefetch(); oRefetch(); };

  const breakdownData = breakdown ? [
    { name: 'Earnings', Gross: breakdown.gross },
    { name: 'Deductions', PAYE: breakdown.paye, SHA: breakdown.sha, NSSF: breakdown.nssf, AHL: breakdown.ahl, Other: breakdown.otherDeductions },
    { name: 'Net', Net: breakdown.net },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Payroll Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Earnings/deductions breakdown &amp; overtime cost — see Payroll Analytics for trend &amp; top earners</p>
      </div>
      <ReportsNav active="payroll" />

      <Link href={`/${locale}/payroll/analytics`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Monthly Trend, Dept Spend &amp; Top Earners</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full payroll analytics already live at Payroll → Analytics</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading ? <LoadingBlock /> : (
        <>
          {breakdown && (
            <ChartCard title={`Earnings vs Deductions vs Net — ${breakdown.month}/${breakdown.year} (${breakdown.headcount} employees)`}>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div><p className="text-lg font-bold text-emerald-400">{fmtKES(breakdown.gross)}</p><p className="text-xs text-brand-text-secondary">Gross</p></div>
                <div><p className="text-lg font-bold text-red-400">{fmtKES(breakdown.paye + breakdown.sha + breakdown.nssf + breakdown.ahl + breakdown.otherDeductions)}</p><p className="text-xs text-brand-text-secondary">Deductions</p></div>
                <div><p className="text-lg font-bold text-indigo-400">{fmtKES(breakdown.net)}</p><p className="text-xs text-brand-text-secondary">Net</p></div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Gross" stackId="a" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="PAYE" stackId="a" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="SHA" stackId="a" stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="NSSF" stackId="a" stroke={CHART_COLORS[5]} fill={CHART_COLORS[5]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="AHL" stackId="a" stroke={CHART_COLORS[6]} fill={CHART_COLORS[6]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Other" stackId="a" stroke={CHART_COLORS[7]} fill={CHART_COLORS[7]} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Net" stackId="a" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {overtime && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Overtime Cost Trend">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={overtime.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="cost" name="Overtime (KES)" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Overtime by Department (this month)">
                {overtime.byDepartmentThisMonth.length === 0 ? (
                  <p className="text-sm text-brand-text-muted text-center py-16">No overtime recorded this month.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={overtime.byDepartmentThisMonth} dataKey="cost" nameKey="department" cx="50%" cy="50%"
                        outerRadius={85} innerRadius={48} paddingAngle={2}>
                        {overtime.byDepartmentThisMonth.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
