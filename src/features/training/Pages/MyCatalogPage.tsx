'use client';

import { useState } from 'react';
import { CourseCard } from '../Components/CourseCard';
import { useCatalog } from '../Hooks/useCatalog';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS, ENROLLMENT_STATUS_STYLES, ENROLLMENT_STATUS_LABELS } from '../constants';

export function MyCatalogPage({ locale }: { locale: string }) {
  const [category, setCategory] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [search, setSearch] = useState('');
  const { courses, isLoading } = useCatalog({ category: category || undefined, difficultyLevel: difficultyLevel || undefined });

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Course Catalog</h1>
        <p className="text-sm text-slate-400">Explore all published courses.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="rounded-md bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)} className="rounded-md bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 text-sm">
          <option value="">All Levels</option>
          {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const enrolled = !!c.myEnrollment;
          const href = enrolled ? `/${locale}/my/training/courses/${c._id}/learn` : `#`;
          return (
            <CourseCard
              key={c._id}
              course={c}
              href={href}
              footer={
                <div className="mt-3">
                  {enrolled ? (
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${c.myEnrollment!.progressPercentage}%` }} />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ENROLLMENT_STATUS_STYLES[c.myEnrollment!.status]}`}>{ENROLLMENT_STATUS_LABELS[c.myEnrollment!.status]}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Not assigned — contact HR to enroll.</p>
                  )}
                </div>
              }
            />
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <p className="col-span-full text-sm text-slate-400 text-center py-10">No courses match your filters.</p>
        )}
      </div>
    </div>
  );
}
