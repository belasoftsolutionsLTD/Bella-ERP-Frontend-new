'use client';

import Link from 'next/link';
import { BookOpen, Users, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTrainingOverview } from '../Hooks/useTrainingAnalytics';
import { useComplianceReport } from '../Hooks/useTrainingAnalytics';

function StatTile({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-brand-text-muted">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function TrainingDashboardPage({ locale }: { locale: string }) {
  const { overview, isLoading } = useTrainingOverview();
  const { mandatoryCourses } = useComplianceReport();

  const departments = [...new Set(mandatoryCourses.flatMap((c) => c.targetDepartments))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Training</h1>
          <p className="text-sm text-brand-text-secondary">Build courses, track compliance, and grow your team&apos;s skills.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/training/courses/new`} className="px-3 py-2 rounded-md bg-primary text-white text-sm font-medium">Build Course</Link>
          <Link href={`/${locale}/training/assignments`} className="px-3 py-2 rounded-md border border-brand-border text-brand-text text-sm font-medium">Assign Training</Link>
          <Link href={`/${locale}/training/compliance`} className="px-3 py-2 rounded-md border border-brand-border text-brand-text text-sm font-medium">Compliance Report</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile icon={BookOpen} label="Published Courses" value={isLoading ? '-' : overview?.publishedCourses ?? 0} />
        <StatTile icon={Users} label="Active Enrollments" value={isLoading ? '-' : overview?.activeEnrollments ?? 0} />
        <StatTile icon={TrendingUp} label="Org Completion Rate" value={isLoading ? '-' : `${overview?.orgCompletionRate ?? 0}%`} />
        <StatTile icon={AlertTriangle} label="Overdue" value={isLoading ? '-' : overview?.overdueCount ?? 0} />
        <StatTile icon={ShieldAlert} label="Certs Expiring (30d)" value={isLoading ? '-' : overview?.certsExpiringIn30Days ?? 0} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Department Compliance</h2>
        {mandatoryCourses.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">No mandatory courses configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-text-muted uppercase">
                  <th className="py-2 pr-4">Department</th>
                  {mandatoryCourses.map((c) => <th key={c.courseId} className="py-2 px-2 text-center">{c.title}</th>)}
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">{dept}</td>
                    {mandatoryCourses.map((c) => {
                      const inScope = c.targetDepartments.includes(dept);
                      const rate = c.completionRate;
                      const color = !inScope ? 'bg-slate-50 text-brand-text-secondary' : rate >= 80 ? 'bg-green-100 text-green-800' : rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                      return (
                        <td key={c.courseId} className="py-2 px-2 text-center">
                          {inScope ? <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${color}`}>{rate}%</span> : <span className="text-brand-text-secondary">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr><td colSpan={mandatoryCourses.length + 1} className="py-4 text-center text-brand-text-secondary">No target departments configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { href: 'courses', label: 'Course Management', desc: 'All courses, drafts and archived' },
          { href: 'learning-paths', label: 'Learning Paths', desc: 'Sequenced course journeys' },
          { href: 'analytics', label: 'Analytics', desc: 'Completion trends, leaderboards' },
        ].map((item) => (
          <Link key={item.href} href={`/${locale}/training/${item.href}`} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary/40 hover:shadow-sm transition">
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="text-xs text-brand-text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
