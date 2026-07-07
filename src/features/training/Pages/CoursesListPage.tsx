'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCourses } from '../Hooks/useCourses';
import { CATEGORY_OPTIONS, COURSE_STATUS_STYLES } from '../constants';

export function CoursesListPage({ locale }: { locale: string }) {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isMandatory, setIsMandatory] = useState('');
  const { courses, isLoading } = useCourses({
    category: category || undefined,
    status: status || undefined,
    isMandatory: isMandatory ? isMandatory === 'true' : undefined,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Course Management</h1>
          <p className="text-sm text-slate-400">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href={`/${locale}/training/courses/new`} className="px-3 py-2 rounded-md bg-primary text-white text-sm font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>

      <div className="flex gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={isMandatory} onChange={(e) => setIsMandatory(e.target.value)} className="rounded-md border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm">
          <option value="">All</option>
          <option value="true">Mandatory only</option>
          <option value="false">Optional only</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Enrolled</th>
              <th className="text-left px-4 py-2">Completion</th>
              <th className="text-left px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/${locale}/training/courses/${c._id}`} className="text-primary hover:underline font-medium">{c.title}</Link>
                  <p className="text-xs text-slate-400">{c.category}{c.isMandatory ? ' · Mandatory' : ''}</p>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${COURSE_STATUS_STYLES[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-2 text-slate-600">{c.enrolledCount ?? 0}</td>
                <td className="px-4 py-2 text-slate-600">{c.completionRate ?? 0}%</td>
                <td className="px-4 py-2 text-slate-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!isLoading && courses.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No courses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
