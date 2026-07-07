'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useLearningPaths } from '../Hooks/useLearningPaths';

export function LearningPathsListPage({ locale }: { locale: string }) {
  const { paths } = useLearningPaths();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Learning Paths</h1>
          <p className="text-sm text-slate-400">Sequenced course journeys</p>
        </div>
        <Link href={`/${locale}/training/learning-paths/new`} className="px-3 py-2 rounded-md bg-primary text-white text-sm font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Path
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Courses</th>
              <th className="text-left px-4 py-2">Enrolled</th>
              <th className="text-left px-4 py-2">Trigger</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((p) => (
              <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2"><Link href={`/${locale}/training/learning-paths/${p._id}/edit`} className="text-primary hover:underline font-medium">{p.name}</Link></td>
                <td className="px-4 py-2 text-slate-600">{p.courses.length}</td>
                <td className="px-4 py-2 text-slate-600">{p.enrolledCount ?? 0}</td>
                <td className="px-4 py-2 text-slate-500">{p.enrollmentTrigger}</td>
                <td className="px-4 py-2 capitalize text-slate-600">{p.status}</td>
              </tr>
            ))}
            {paths.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No learning paths yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
