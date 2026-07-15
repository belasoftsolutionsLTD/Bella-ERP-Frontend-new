'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCourse } from '../Hooks/useCourses';
import { useEnrollments } from '../Hooks/useEnrollments';
import { useCourseAnalytics } from '../Hooks/useTrainingAnalytics';
import { COURSE_STATUS_MAP, ENROLLMENT_STATUS_MAP, ENROLLMENT_STATUS_LABELS, MODULE_TYPE_OPTIONS } from '../constants';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';

function ContentTab({ courseId, locale }: { courseId: string; locale: string }) {
  const { course } = useCourse(courseId);
  const modules = (course as any)?.modules || [];
  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {modules.map((m: any) => (
        <div key={m._id} className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">{m.order + 1}. {m.title}</p>
            <p className="text-xs text-brand-text-muted">{MODULE_TYPE_OPTIONS.find((o) => o.value === m.type)?.label}{m.isRequired ? ' · Required' : ''}</p>
          </div>
        </div>
      ))}
      {modules.length === 0 && <p className="p-6 text-sm text-brand-text-secondary text-center">No modules yet.</p>}
      <div className="p-3">
        <Link href={`/${locale}/training/courses/${courseId}/edit`} className="text-sm text-brand-primary hover:underline">Edit modules →</Link>
      </div>
    </div>
  );
}

function EnrollmentsTab({ courseId }: { courseId: string }) {
  const { enrollments, waiveEnrollment } = useEnrollments({ courseId });
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-brand-text-muted text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2">Employee</th>
            <th className="text-left px-4 py-2">Department</th>
            <th className="text-left px-4 py-2">Progress</th>
            <th className="text-left px-4 py-2">Status</th>
            <th className="text-left px-4 py-2">Due</th>
            <th className="text-left px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e) => (
            <tr key={e._id} className="border-t border-slate-100">
              <td className="px-4 py-2">{e.employee?.fullName || 'Unknown'}</td>
              <td className="px-4 py-2 text-brand-text-muted">{e.employee?.department || '—'}</td>
              <td className="px-4 py-2 text-brand-text-muted">{e.progressPercentage}%</td>
              <td className="px-4 py-2">
                <StatusBadge status={ENROLLMENT_STATUS_MAP[e.status]} label={ENROLLMENT_STATUS_LABELS[e.status]} />
              </td>
              <td className="px-4 py-2 text-brand-text-muted">{e.dueDate ? new Date(e.dueDate).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-2">
                {e.status !== 'completed' && e.status !== 'waived' && (
                  <button onClick={() => waiveEnrollment(e._id)} className="text-xs text-brand-primary hover:underline">Waive</button>
                )}
              </td>
            </tr>
          ))}
          {enrollments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-text-secondary">No enrollments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsTab({ courseId }: { courseId: string }) {
  const { data, isLoading } = useCourseAnalytics(courseId);
  if (isLoading || !data) return <p className="text-sm text-brand-text-secondary">Loading...</p>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Module Drop-off Funnel</h3>
        <div className="space-y-2">
          {data.funnel.map((f) => (
            <div key={f.moduleId}>
              <div className="flex justify-between text-xs text-brand-text-muted mb-1"><span>{f.title}</span><span>{f.completedCount} completed ({f.dropOffRate}% drop-off)</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{ width: `${100 - f.dropOffRate}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Summary</h3>
        <p className="flex justify-between"><span className="text-brand-text-muted">Total Enrollments</span><span className="font-medium">{data.totalEnrollments}</span></p>
        <p className="flex justify-between"><span className="text-brand-text-muted">Avg Quiz Score</span><span className="font-medium">{data.avgQuizScore != null ? `${data.avgQuizScore}%` : '—'}</span></p>
        <p className="flex justify-between"><span className="text-brand-text-muted">Avg Time to Complete</span><span className="font-medium">{data.avgTimeToCompleteDays != null ? `${data.avgTimeToCompleteDays}d` : '—'}</span></p>
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-brand-text-muted mb-1">Rating Breakdown</p>
          {data.ratingBreakdown.map((r) => (
            <div key={r.rating} className="flex items-center gap-2 text-xs">
              <span className="w-8">{r.rating}★</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${Math.min(100, r.count * 10)}%` }} /></div>
              <span className="w-6 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ courseId, locale }: { courseId: string; locale: string }) {
  const { course, archiveCourse } = useCourse(courseId);
  if (!course) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <Link href={`/${locale}/training/courses/${courseId}/edit`} className="text-sm text-brand-primary hover:underline">Edit course details →</Link>
      {course.status !== 'archived' && (
        <div>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => archiveCourse()}>Archive Course</Button>
        </div>
      )}
    </div>
  );
}

export function CourseDetailAdminPage({ id, locale }: { id: string; locale: string }) {
  const { course, isLoading } = useCourse(id);
  const [tab, setTab] = useState<'content' | 'enrollments' | 'analytics' | 'settings'>('content');

  if (isLoading) return <div className="p-6 text-sm text-brand-text-secondary">Loading...</div>;
  if (!course) return <div className="p-6 text-sm text-brand-text-secondary">Course not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">{course.title}</h1>
          <p className="text-sm text-brand-text-secondary">{course.category} · {course.difficultyLevel}</p>
        </div>
        <StatusBadge status={COURSE_STATUS_MAP[course.status]} label={course.status} className="px-2.5 py-1" />
      </div>

      <div className="flex gap-1 border-b border-brand-border">
        {(['content', 'enrollments', 'analytics', 'settings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? 'text-brand-primary border-b-2 border-brand-primary font-medium' : 'text-brand-text-secondary'}`}>{t}</button>
        ))}
      </div>

      {tab === 'content' && <ContentTab courseId={id} locale={locale} />}
      {tab === 'enrollments' && <EnrollmentsTab courseId={id} />}
      {tab === 'analytics' && <AnalyticsTab courseId={id} />}
      {tab === 'settings' && <SettingsTab courseId={id} locale={locale} />}
    </div>
  );
}
