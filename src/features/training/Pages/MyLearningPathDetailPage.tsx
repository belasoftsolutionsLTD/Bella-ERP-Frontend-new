'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { useMyLearningPaths, useMyEnrollments } from '../Hooks/useEnrollments';
import { ENROLLMENT_STATUS_MAP, ENROLLMENT_STATUS_LABELS } from '../constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function MyLearningPathDetailPage({ locale, pathId }: { locale: string; pathId: string }) {
  const { paths, isLoading: pathsLoading } = useMyLearningPaths();
  const { enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();

  if (pathsLoading || enrollmentsLoading) return <div className="p-6 text-sm text-brand-text-secondary">Loading...</div>;

  const pathEnrollment = paths.find((p) => String(p.learningPathId) === pathId);
  if (!pathEnrollment || !pathEnrollment.learningPath) {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-text-secondary">Learning path not found or you are not enrolled.</p>
        <Link href={`/${locale}/my/training`} className="text-brand-primary text-sm hover:underline">Back to My Training</Link>
      </div>
    );
  }

  const courses = pathEnrollment.learningPath.courses.slice().sort((a, b) => a.order - b.order);
  const enrollmentByCourse = Object.fromEntries(
    enrollments.filter((e) => e.courseId && String(e.learningPathId) === pathId).map((e) => [String(e.courseId), e])
  );

  return (
    <div className="p-6 max-w-2xl">
      <Link href={`/${locale}/my/training`} className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-brand-text mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to My Training
      </Link>

      <h1 className="text-xl font-semibold text-brand-text">{pathEnrollment.learningPath.name}</h1>
      <p className="text-sm text-brand-text-secondary mb-2">{pathEnrollment.learningPath.description}</p>
      <div className="h-1.5 bg-brand-bg-soft rounded-full overflow-hidden mb-6 max-w-xs">
        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${pathEnrollment.progressPercentage}%` }} />
      </div>

      <div className="space-y-3">
        {courses.map((c, i) => {
          const enr = enrollmentByCourse[String(c.courseId)];
          const prereq = c.unlockAfterCourseId ? enrollmentByCourse[String(c.unlockAfterCourseId)] : null;
          const locked = !!c.unlockAfterCourseId && prereq?.status !== 'completed';
          const done = enr?.status === 'completed';

          const content = (
            <div className={`flex items-center justify-between p-4 rounded-xl border ${locked ? 'bg-white/40 border-brand-border opacity-60' : 'bg-white border-slate-200 hover:border-brand-primary/40'} transition`}>
              <div className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${done ? 'bg-green-100 text-green-700' : locked ? 'bg-brand-bg-soft text-brand-text-muted' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div>
                  <p className={`font-medium ${locked ? 'text-brand-text-secondary' : 'text-slate-900'}`}>{enr?.course?.title ?? 'Course'}</p>
                  {!c.isRequired && <p className="text-xs text-brand-text-secondary">Optional</p>}
                </div>
              </div>
              {enr && !locked && (
                <StatusBadge status={ENROLLMENT_STATUS_MAP[enr.status]} label={ENROLLMENT_STATUS_LABELS[enr.status]} />
              )}
              {locked && <span className="text-xs text-brand-text-muted">Locked</span>}
            </div>
          );

          return locked ? (
            <div key={c.courseId}>{content}</div>
          ) : (
            <Link key={c.courseId} href={`/${locale}/my/training/courses/${c.courseId}/learn`}>{content}</Link>
          );
        })}
      </div>
    </div>
  );
}
