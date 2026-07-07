'use client';

import Link from 'next/link';
import { BookOpen, Award, Clock, AlertTriangle } from 'lucide-react';
import { useMyEnrollments, useMyLearningPaths } from '../Hooks/useEnrollments';
import { useMyCertificates } from '../Hooks/useCertificates';
import { ENROLLMENT_STATUS_STYLES, ENROLLMENT_STATUS_LABELS } from '../constants';

function StatTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent || 'bg-primary/10 text-primary'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function MyLearningDashboardPage({ locale }: { locale: string }) {
  const { enrollments, isLoading } = useMyEnrollments();
  const { paths } = useMyLearningPaths();
  const { certificates } = useMyCertificates();

  const inProgress = enrollments.filter((e) => e.courseId && ['notStarted', 'inProgress'].includes(e.status));
  const overdue = enrollments.filter((e) => e.status === 'overdue');
  const completed = enrollments.filter((e) => e.status === 'completed');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">My Training</h1>
        <p className="text-sm text-slate-400">Continue your courses, track progress, and earn certificates.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Clock} label="In Progress" value={inProgress.length} />
        <StatTile icon={BookOpen} label="Completed" value={completed.length} />
        <StatTile icon={AlertTriangle} label="Overdue" value={overdue.length} accent="bg-red-50 text-red-600" />
        <Link href={`/${locale}/my/training/certificates`}>
          <StatTile icon={Award} label="Certificates" value={certificates.length} accent="bg-amber-50 text-amber-600" />
        </Link>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800">You have {overdue.length} overdue course{overdue.length > 1 ? 's' : ''} — please complete them as soon as possible.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Continue Learning</h2>
          <Link href={`/${locale}/my/training/catalog`} className="text-sm text-primary hover:underline">Browse Catalog</Link>
        </div>
        <div className="space-y-3">
          {enrollments.filter((e) => e.courseId && e.status !== 'waived').map((e) => (
            <Link key={e._id} href={`/${locale}/my/training/courses/${e.courseId}/learn`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition">
              <div>
                <p className="font-medium text-slate-800">{e.course?.title ?? 'Course'}</p>
                <p className="text-xs text-slate-500">{e.course?.category} {e.dueDate ? `· Due ${new Date(e.dueDate).toLocaleDateString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${e.progressPercentage}%` }} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${ENROLLMENT_STATUS_STYLES[e.status]}`}>{ENROLLMENT_STATUS_LABELS[e.status]}</span>
              </div>
            </Link>
          ))}
          {!isLoading && enrollments.filter((e) => e.courseId).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No courses assigned yet. Browse the catalog to get started.</p>
          )}
        </div>
      </div>

      {paths.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Learning Paths</h2>
          <div className="space-y-3">
            {paths.map((p) => (
              <Link key={p._id} href={`/${locale}/my/training/learning-paths/${p.learningPathId}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition">
                <div>
                  <p className="font-medium text-slate-800">{p.learningPath?.name ?? 'Learning Path'}</p>
                  <p className="text-xs text-slate-500">{p.learningPath?.courses.length ?? 0} courses</p>
                </div>
                <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
