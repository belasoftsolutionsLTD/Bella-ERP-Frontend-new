'use client';

import { Button } from '@/components/ui/button';
import { useComplianceReport } from '../Hooks/useTrainingAnalytics';

const exportCsv = (rows: any[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export function ComplianceDashboardPage() {
  const { mandatoryCourses, certExpiry, sendReminder } = useComplianceReport();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Compliance Dashboard</h1>
        <p className="text-sm text-slate-400">Mandatory course completion and certificate expiry tracking</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Mandatory Courses</h2>
          <Button size="sm" variant="outline" onClick={() => exportCsv(mandatoryCourses, 'mandatory-compliance.csv')}>Export CSV</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left py-2">Course</th>
              <th className="text-left py-2">Target Audience</th>
              <th className="text-left py-2">Enrolled</th>
              <th className="text-left py-2">Completed</th>
              <th className="text-left py-2">%</th>
              <th className="text-left py-2">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {mandatoryCourses.map((c) => (
              <tr key={c.courseId} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-800">{c.title}</td>
                <td className="py-2 text-slate-500">{[...c.targetRoles, ...c.targetDepartments].join(', ') || 'Everyone'}</td>
                <td className="py-2">{c.enrolled}</td>
                <td className="py-2">{c.completed}</td>
                <td className="py-2">{c.completionRate}%</td>
                <td className="py-2 text-red-600">{c.overdue}</td>
              </tr>
            ))}
            {mandatoryCourses.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">No mandatory courses configured.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Certificates Expiring Soon</h2>
          <Button size="sm" variant="outline" onClick={() => sendReminder()}>Remind All Overdue</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left py-2">Employee</th>
              <th className="text-left py-2">Certificate</th>
              <th className="text-left py-2">Expires</th>
              <th className="text-left py-2">Days Left</th>
              <th className="text-left py-2"></th>
            </tr>
          </thead>
          <tbody>
            {certExpiry.map((c, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-800">{c.employeeName}</td>
                <td className="py-2 text-slate-600">{c.courseTitle}</td>
                <td className="py-2 text-slate-500">{new Date(c.expiresAt).toLocaleDateString()}</td>
                <td className={`py-2 ${c.daysRemaining <= 7 ? 'text-red-600' : 'text-amber-600'}`}>{c.daysRemaining}d</td>
                <td className="py-2"><button onClick={() => sendReminder(c.employeeId)} className="text-xs text-primary hover:underline">Send Reminder</button></td>
              </tr>
            ))}
            {certExpiry.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">No certificates expiring in the next 30 days.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
