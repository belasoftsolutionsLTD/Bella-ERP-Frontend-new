'use client';

import Link from 'next/link';
import { Clock, Star, ShieldCheck } from 'lucide-react';
import type { Course } from '../types';
import { COURSE_STATUS_MAP } from '../constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function CourseCard({ course, href, showStatus, footer }: {
  course: Course;
  href: string;
  showStatus?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-primary/40 hover:shadow-sm transition">
      <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImageUrl} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-primary/70">{course.category}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2">{course.title}</h3>
          {showStatus && (
            <StatusBadge status={COURSE_STATUS_MAP[course.status]} label={course.status} className="shrink-0" />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.estimatedDurationMinutes}m</span>
          <span className="capitalize">{course.difficultyLevel}</span>
          {course.isMandatory && <span className="flex items-center gap-1 text-amber-600"><ShieldCheck className="h-3.5 w-3.5" /> Mandatory</span>}
          {course.avgRating != null && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {course.avgRating}</span>}
        </div>
        {footer}
      </div>
    </Link>
  );
}
