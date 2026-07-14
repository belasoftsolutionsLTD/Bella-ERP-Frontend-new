'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AlertTriangle, DollarSign, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportQuery } from '../Hooks/useReportQuery';
import { ChartCard, LoadingBlock, ExportCSVButton } from '../Components/shared';
import { ReportsNav } from '../Components/ReportsNav';

interface AttritionRisk { employeeId: string; employeeName: string; department: string; managerName: string; riskSignals: string[]; daysSinceLastCheckIn: number | null; }
interface CostPerEmployee { employeeId: string; employeeName: string; department: string; baseSalary: number; overtimeCost3mo: number; expenseReimbursements3mo: number; coursesCompleted3mo: number; trainingCost3mo: number | null; totalCost: number; }
interface DeptHealth { department: string; headcount: number; attendanceRate: number | null; avgPerformanceRating: number | null; leaveLiability: number; openRoles: number; activePips: number; }
interface ManagerEffectiveness { managerId: string; managerName: string; teamSize: number; teamAttendanceRate: number | null; teamAvgPerformanceRating: number | null; checkInFrequencyPerMonth: number; teamTurnoverRate12mo: number; }

const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString()}`;

function healthColor(value: number | null, goodMin: number, warnMin: number, invert = false) {
  if (value == null) return 'text-brand-text-muted';
  const good = invert ? value <= goodMin : value >= goodMin;
  const warn = invert ? value <= warnMin : value >= warnMin;
  if (good) return 'text-emerald-400';
  if (warn) return 'text-amber-400';
  return 'text-red-400';
}

export default function InsightsPage() {
  const locale = useLocale();
  const [department, setDepartment] = useState('');
  const { data: attrition, loading: aLoading } = useReportQuery<AttritionRisk[]>('/insights/attrition-risk');
  const { data: cost, loading: cLoading } = useReportQuery<CostPerEmployee[]>('/insights/cost-per-employee', department ? { department } : undefined);
  const { data: deptHealth, loading: dLoading } = useReportQuery<DeptHealth[]>('/insights/dept-health');
  const { data: managers, loading: mLoading } = useReportQuery<ManagerEffectiveness[]>('/insights/manager-effectiveness');
  const loading = aLoading || cLoading || dLoading || mLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Cross-Module Insights</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">The big picture no single module can show on its own</p>
      </div>
      <ReportsNav active="insights" />

      {loading ? <LoadingBlock /> : (
        <>
          {/* Attrition Risk */}
          <ChartCard title="Attrition Risk" action={<ExportCSVButton rows={attrition ?? []} filename="attrition-risk.csv" />}>
            <div className="flex items-center gap-2 mb-3 text-xs text-brand-text-secondary">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Employees flagged with below-average rating, above-average absenteeism, and no feedback in 60+ days.
            </div>
            {!attrition?.length ? (
              <p className="text-sm text-brand-text-muted text-center py-8">No employees currently flagged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-brand-text-muted border-b border-brand-border">
                    <th className="pb-2">Employee</th><th className="pb-2">Dept</th><th className="pb-2">Manager</th><th className="pb-2">Risk Signals</th><th className="pb-2">Last Check-in</th><th className="pb-2"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-brand-border/60">
                    {attrition.map((r) => (
                      <tr key={r.employeeId}>
                        <td className="py-2 text-brand-text">{r.employeeName}</td>
                        <td className="py-2 text-brand-text-secondary">{r.department}</td>
                        <td className="py-2 text-brand-text-secondary">{r.managerName}</td>
                        <td className="py-2 text-brand-text-secondary text-xs">{r.riskSignals.join('; ')}</td>
                        <td className="py-2 text-brand-text-secondary">{r.daysSinceLastCheckIn != null ? `${r.daysSinceLastCheckIn}d ago` : 'Never'}</td>
                        <td className="py-2">
                          <Link href={`/${locale}/performance`} className="text-xs text-indigo-400 hover:underline whitespace-nowrap">Schedule Check-in →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          {/* Department Health Scorecard */}
          <ChartCard title="Department Health Scorecard" action={<ExportCSVButton rows={deptHealth ?? []} filename="dept-health.csv" />}>
            <div className="flex items-center gap-2 mb-3 text-xs text-brand-text-secondary"><Building2 className="h-3.5 w-3.5 text-sky-400" /> Green = healthy, amber = watch, red = needs attention.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-brand-text-muted border-b border-brand-border">
                  <th className="pb-2">Department</th><th className="pb-2">Headcount</th><th className="pb-2">Attendance</th><th className="pb-2">Avg Rating</th><th className="pb-2">Leave Liability</th><th className="pb-2">Open Roles</th><th className="pb-2">Active PIPs</th>
                </tr></thead>
                <tbody className="divide-y divide-brand-border/60">
                  {(deptHealth ?? []).map((d) => (
                    <tr key={d.department}>
                      <td className="py-2 text-brand-text font-medium">{d.department}</td>
                      <td className="py-2 text-brand-text-secondary">{d.headcount}</td>
                      <td className={cn('py-2 font-semibold', healthColor(d.attendanceRate, 90, 75))}>{d.attendanceRate != null ? `${d.attendanceRate}%` : '—'}</td>
                      <td className={cn('py-2 font-semibold', healthColor(d.avgPerformanceRating, 4, 3))}>{d.avgPerformanceRating ?? '—'}</td>
                      <td className="py-2 text-brand-text-secondary">{fmtKES(d.leaveLiability)}</td>
                      <td className="py-2 text-brand-text-secondary">{d.openRoles}</td>
                      <td className={cn('py-2 font-semibold', healthColor(d.activePips, 0, 2, true))}>{d.activePips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Manager Effectiveness */}
          <ChartCard title="Manager Effectiveness">
            <div className="flex items-center gap-2 mb-3 text-xs text-brand-text-secondary"><Users className="h-3.5 w-3.5 text-violet-400" /> Helps HR identify which managers need support.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-brand-text-muted border-b border-brand-border">
                  <th className="pb-2">Manager</th><th className="pb-2">Team Size</th><th className="pb-2">Team Attendance</th><th className="pb-2">Team Avg Rating</th><th className="pb-2">Check-ins /mo</th><th className="pb-2">Turnover (12mo)</th>
                </tr></thead>
                <tbody className="divide-y divide-brand-border/60">
                  {(managers ?? []).map((m) => (
                    <tr key={m.managerId}>
                      <td className="py-2 text-brand-text">{m.managerName}</td>
                      <td className="py-2 text-brand-text-secondary">{m.teamSize}</td>
                      <td className="py-2 text-brand-text-secondary">{m.teamAttendanceRate != null ? `${m.teamAttendanceRate}%` : '—'}</td>
                      <td className="py-2 text-brand-text-secondary">{m.teamAvgPerformanceRating ?? '—'}</td>
                      <td className={cn('py-2 font-semibold', healthColor(m.checkInFrequencyPerMonth, 1, 0))}>{m.checkInFrequencyPerMonth}</td>
                      <td className={cn('py-2 font-semibold', healthColor(m.teamTurnoverRate12mo, 0, 20, true))}>{m.teamTurnoverRate12mo}%</td>
                    </tr>
                  ))}
                  {!managers?.length && <tr><td colSpan={6} className="py-8 text-center text-brand-text-muted">No managers with direct reports yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Cost Per Employee */}
          <ChartCard title="Cost Per Employee" action={<ExportCSVButton rows={cost ?? []} filename="cost-per-employee.csv" />}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Filter by department..."
                className="h-8 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-xs text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-brand-text-muted border-b border-brand-border">
                  <th className="pb-2">Employee</th><th className="pb-2">Dept</th><th className="pb-2">Base Salary</th><th className="pb-2">Overtime (3mo)</th><th className="pb-2">Expenses (3mo)</th><th className="pb-2">Courses (3mo)</th><th className="pb-2">Total Cost</th>
                </tr></thead>
                <tbody className="divide-y divide-brand-border/60">
                  {(cost ?? []).slice(0, 50).map((c) => (
                    <tr key={c.employeeId}>
                      <td className="py-2 text-brand-text">{c.employeeName}</td>
                      <td className="py-2 text-brand-text-secondary">{c.department}</td>
                      <td className="py-2 text-brand-text-secondary">{fmtKES(c.baseSalary)}</td>
                      <td className="py-2 text-brand-text-secondary">{fmtKES(c.overtimeCost3mo)}</td>
                      <td className="py-2 text-brand-text-secondary">{fmtKES(c.expenseReimbursements3mo)}</td>
                      <td className="py-2 text-brand-text-secondary">{c.coursesCompleted3mo}</td>
                      <td className="py-2 text-brand-text font-semibold">{fmtKES(c.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
