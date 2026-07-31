'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Download } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ErrorBlock, ExportCSVButton, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';
import { downloadFile } from '@/functions/downloadFile';
import { API_BASE_URL } from '@/configs/constants';

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

const todayStr = () => new Date().toISOString().split('T')[0];
const yearStart = () => `${new Date().getFullYear()}-01-01`;

export default function LeaveReportsPage() {
  const locale = useLocale();
  const { data: liability, loading: lLoading, error: lError, refetch: lRefetch } = useReportQuery<Liability>('/leave/liability');
  const { data: patterns, loading: pLoading, error: pError, refetch: pRefetch } = useReportQuery<Patterns>('/leave/patterns');
  const loading = lLoading || pLoading;
  const error = lError || pError;
  const refetch = () => { lRefetch(); pRefetch(); };

  const [exportFrom, setExportFrom] = useState(yearStart());
  const [exportTo, setExportTo] = useState(todayStr());
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const params = new URLSearchParams({ startDate: exportFrom, endDate: exportTo });
    if (exportStatus) params.set('status', exportStatus);
    downloadFile(`${API_BASE_URL}/leave/requests/export?${params.toString()}`, `leave-requests-${exportFrom}-to-${exportTo}.csv`)
      .catch((err) => alert(err.message))
      .finally(() => setExporting(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Leave Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Financial exposure &amp; usage patterns — see Leave Dashboard for summary &amp; absenteeism</p>
      </div>
      <ReportsNav active="leave" />

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">From</label>
          <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}
            className="h-9 rounded-lg border border-brand-border bg-brand-bg-soft px-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">To</label>
          <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)}
            className="h-9 rounded-lg border border-brand-border bg-brand-bg-soft px-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
        </div>
        <div>
          <label className="block text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">Status</label>
          <select value={exportStatus} onChange={(e) => setExportStatus(e.target.value)}
            className="h-9 rounded-lg border border-brand-border bg-brand-bg-soft px-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
          <Download className="h-4 w-4" /> {exporting ? 'Generating…' : 'Generate Leave Report (CSV)'}
        </button>
      </div>

      <Link href={`/${locale}/leave`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Absence Trend, Type Breakdown &amp; Top Leave-Takers</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full leave analytics already live at the Leave Dashboard</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading ? <LoadingBlock /> : (
        <>
          {liability && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Total Unused Leave Days" value={liability.total.days} colorCls="text-amber-400" />
                <StatTile label="Total Liability" value={fmtKES(liability.total.value)} colorCls="text-red-400" />
              </div>
              <ChartCard title={`Leave Liability by Department (${liability.year})`}>
                <ResponsiveContainer width="100%" height={Math.max(220, liability.byDepartment.length * 20)}>
                  <PieChart>
                    <Pie data={liability.byDepartment} dataKey="value" nameKey="department" cx="50%" cy="50%"
                      outerRadius={85} innerRadius={48} paddingAngle={2}>
                      {liability.byDepartment.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
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
                  <PieChart>
                    <Pie data={patterns.byDayOfWeek} dataKey="count" nameKey="day" cx="50%" cy="50%"
                      outerRadius={85} innerRadius={48} paddingAngle={2}>
                      {patterns.byDayOfWeek.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={`Leave Days by Month (${patterns.year})`}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={patterns.byMonth.map((m) => ({ month: MONTH_ABBR[m.month - 1], days: m.days }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="days" name="Days" stroke={CHART_COLORS[5]} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
