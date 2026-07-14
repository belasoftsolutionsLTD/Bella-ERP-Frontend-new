'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, LoadingBlock, CHART_COLORS } from '../Components/shared';
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
  const { data: breakdown, loading: bLoading } = useReportQuery<Breakdown>('/payroll/breakdown');
  const { data: overtime, loading: oLoading } = useReportQuery<OvertimeCost>('/payroll/overtime');
  const loading = bLoading || oLoading;

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

      {loading ? <LoadingBlock /> : (
        <>
          {breakdown && (
            <ChartCard title={`Earnings vs Deductions vs Net — ${breakdown.month}/${breakdown.year} (${breakdown.headcount} employees)`}>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div><p className="text-lg font-bold text-emerald-400">{fmtKES(breakdown.gross)}</p><p className="text-xs text-brand-text-secondary">Gross</p></div>
                <div><p className="text-lg font-bold text-red-400">{fmtKES(breakdown.paye + breakdown.sha + breakdown.nssf + breakdown.ahl + breakdown.otherDeductions)}</p><p className="text-xs text-brand-text-secondary">Deductions</p></div>
                <div><p className="text-lg font-bold text-indigo-400">{fmtKES(breakdown.net)}</p><p className="text-xs text-brand-text-secondary">Net</p></div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Gross" stackId="a" fill={CHART_COLORS[2]} />
                  <Bar dataKey="PAYE" stackId="a" fill={CHART_COLORS[4]} />
                  <Bar dataKey="SHA" stackId="a" fill={CHART_COLORS[3]} />
                  <Bar dataKey="NSSF" stackId="a" fill={CHART_COLORS[5]} />
                  <Bar dataKey="AHL" stackId="a" fill={CHART_COLORS[6]} />
                  <Bar dataKey="Other" stackId="a" fill={CHART_COLORS[7]} />
                  <Bar dataKey="Net" stackId="a" fill={CHART_COLORS[0]} />
                </BarChart>
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
                    <BarChart data={overtime.byDepartmentThisMonth} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="cost" name="Cost (KES)" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
                    </BarChart>
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
