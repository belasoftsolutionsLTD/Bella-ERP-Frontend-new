'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, ChartTooltip, StatTile, LoadingBlock, CHART_COLORS } from '../Components/shared';
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
  const { data: byDept, loading: dLoading } = useReportQuery<CompletionByDept[]>('/training/completion');
  const { data: compliance, loading: cLoading } = useReportQuery<Compliance>('/training/compliance');
  const { data: engagement, loading: eLoading } = useReportQuery<Engagement>('/training/engagement');
  const loading = dLoading || cLoading || eLoading;

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

      {loading ? <LoadingBlock /> : (
        <>
          {byDept && (
            <ChartCard title="Mandatory Course Completion Rate by Department">
              <ResponsiveContainer width="100%" height={Math.max(180, byDept.length * 34)}>
                <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="completionRate" name="Completion %" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
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
                <ResponsiveContainer width="100%" height={Math.max(180, engagement.mostEnrolled.length * 30)}>
                  <BarChart data={engagement.mostEnrolled} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="title" width={160} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="enrollments" name="Enrollments" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
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
