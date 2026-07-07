'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLeaderboard } from '../Hooks/useTrainingAnalytics';
import { useCourses } from '../Hooks/useCourses';
import { useCourseAnalytics } from '../Hooks/useTrainingAnalytics';
import { useComplianceReport } from '../Hooks/useTrainingAnalytics';
import { useEnrollments } from '../Hooks/useEnrollments';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function CompletionTrend() {
  const { enrollments } = useEnrollments({ status: 'completed' });
  const monthly = useMemo(() => {
    const buckets: Record<string, number> = {};
    enrollments.forEach((e) => {
      if (!e.completedAt) return;
      const d = new Date(e.completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
  }, [enrollments]);

  return (
    <ChartCard title="Completions Over Time">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CategoryCompletion() {
  const { courses } = useCourses({ status: 'published' });
  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; sum: number }> = {};
    courses.forEach((c) => {
      if (!map[c.category]) map[c.category] = { total: 0, sum: 0 };
      map[c.category].total += 1;
      map[c.category].sum += c.completionRate ?? 0;
    });
    return Object.entries(map).map(([category, v]) => ({ category, avgCompletion: Math.round(v.sum / v.total) }));
  }, [courses]);

  return (
    <ChartCard title="Avg Completion Rate by Category">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={byCategory}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="avgCompletion" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function Leaderboard() {
  const { leaderboard } = useLeaderboard();
  return (
    <ChartCard title="Employee Leaderboard">
      <div className="divide-y divide-slate-100">
        {leaderboard.map((row) => (
          <div key={row.employeeId} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-700">#{row.rank} {row.name} <span className="text-xs text-slate-400">({row.department || '—'})</span></span>
            <span className="text-xs text-slate-500">{row.coursesCompleted} courses · {row.certificatesEarned} certs</span>
          </div>
        ))}
        {leaderboard.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No completions yet.</p>}
      </div>
    </ChartCard>
  );
}

function DropOffFunnel() {
  const { courses } = useCourses({ status: 'published' });
  const [courseId, setCourseId] = useState('');
  const { data } = useCourseAnalytics(courseId || undefined);

  return (
    <ChartCard title="Module Drop-off Funnel">
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3">
        <option value="">Select a course...</option>
        {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
      </select>
      {data && (
        <div className="space-y-2">
          {data.funnel.map((f) => (
            <div key={f.moduleId}>
              <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{f.title}</span><span>{f.completedCount} completed</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${100 - f.dropOffRate}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      {!courseId && <p className="text-sm text-slate-400 text-center py-6">Choose a course to see its funnel.</p>}
    </ChartCard>
  );
}

function DeptHeatmap() {
  const { mandatoryCourses } = useComplianceReport();
  const departments = [...new Set(mandatoryCourses.flatMap((c) => c.targetDepartments))];
  return (
    <ChartCard title="Department Compliance Heatmap">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase">
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
                  const color = !inScope ? 'bg-slate-50 text-slate-300' : rate >= 80 ? 'bg-green-100 text-green-800' : rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                  return <td key={c.courseId} className="py-2 px-2 text-center">{inScope ? <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${color}`}>{rate}%</span> : <span className="text-slate-300">—</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

export function TrainingAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Training Analytics</h1>
        <p className="text-sm text-slate-400">Trends, leaderboards, and engagement across your training program</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletionTrend />
        <CategoryCompletion />
        <Leaderboard />
        <DropOffFunnel />
        <div className="lg:col-span-2"><DeptHeatmap /></div>
      </div>
    </div>
  );
}
