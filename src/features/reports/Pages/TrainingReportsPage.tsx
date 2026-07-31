'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, ErrorBlock, CHART_COLORS } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface CompletionByDept { department: string; total: number; completed: number; completionRate: number; }
interface Compliance {
  mandatoryCourses: { courseId: string; title: string; enrolled: number; completed: number; overdue: number; completionRate: number }[];
  certExpiry: { employeeId: string; employeeName: string; courseTitle: string; daysRemaining: number }[];
}
interface Engagement {
  mostEnrolled: { courseId: string; title: string; enrollments: number; completed: number }[];
  completionTrend: { month: string; enrollments: number; completed: number }[];
}

export default function TrainingReportsPage() {
  const locale = useLocale();
  const { data: byDept, loading: dLoading, error: dError, refetch: dRefetch } = useReportQuery<CompletionByDept[]>('/training/completion');
  const { data: compliance, loading: cLoading, error: cError, refetch: cRefetch } = useReportQuery<Compliance>('/training/compliance');
  const { data: engagement, loading: eLoading, error: eError, refetch: eRefetch } = useReportQuery<Engagement>('/training/engagement');
  const loading = dLoading || cLoading || eLoading;
  const error = dError || cError || eError;
  const refetch = () => { dRefetch(); cRefetch(); eRefetch(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Training Reports</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Completion by department &amp; engagement — see Compliance Dashboard for cert expiry actions</p>
      </div>
      <ReportsNav active="training" />

      <Link href={`/${locale}/training/compliance`}
        className="flex items-center justify-between bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 hover:border-brand-primary/50 transition-colors">
        <div>
          <p className="text-sm font-semibold text-brand-text">Mandatory Course Compliance &amp; Send Reminders</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">Full compliance dashboard already live at Training → Compliance</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-indigo-400" />
      </Link>

      {error ? <ErrorBlock message={error} onRetry={refetch} /> : loading ? <LoadingBlock /> : (
        <>
          {byDept && (
            <ChartCard title="Mandatory Course Completion Rate by Department">
              <ResponsiveContainer width="100%" height={Math.max(220, byDept.length * 20)}>
                <PieChart>
                  <Pie data={byDept} dataKey="completionRate" nameKey="department" cx="50%" cy="50%"
                    outerRadius={85} innerRadius={48} paddingAngle={2}>
                    {byDept.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {compliance && (
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Certs Expiring Soon" value={compliance.certExpiry.length} colorCls="text-amber-400" />
              <StatTile label="Overdue Enrollments" value={compliance.mandatoryCourses.reduce((s, c) => s + c.overdue, 0)} colorCls="text-red-400" />
            </div>
          )}

          {engagement && (
            <>
              <ChartCard title="Most Enrolled Courses">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const sorted = [...engagement.mostEnrolled].sort((a, b) => b.enrollments - a.enrollments);
                        const topN = sorted.slice(0, 7);
                        const rest = sorted.slice(7);
                        const restTotal = rest.reduce((s, c) => s + c.enrollments, 0);
                        return restTotal > 0 ? [...topN, { title: 'Other', enrollments: restTotal }] : topN;
                      })()}
                      dataKey="enrollments" nameKey="title" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={50} paddingAngle={2}
                    >
                      {engagement.mostEnrolled.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Enrollment &amp; Completion Trend">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={engagement.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </>
      )}
    </div>
  );
}
