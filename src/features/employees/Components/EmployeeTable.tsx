'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Eye, Pencil, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Employee } from '../Hooks/useEmployees';

type Gap = { label: string; critical: boolean };

function getProfileGaps(emp: Employee): Gap[] {
  const gaps: Gap[] = [];
  if (!emp.grossPay)                                   gaps.push({ label: 'Gross Pay',      critical: true  });
  if (!emp.jobGroupId)                                 gaps.push({ label: 'Job Group',       critical: true  });
  if (!emp.kraPin)                                     gaps.push({ label: 'KRA PIN',         critical: false });
  if (!emp.bankAccountNumber && !emp.mpesaNumber)      gaps.push({ label: 'Payment Method',  critical: false });
  return gaps;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  on_leave: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-orange-500/20 text-orange-400',
  terminated: 'bg-red-500/20 text-red-400',
};

interface Props {
  employees: Employee[];
  onDelete?: (id: string) => void;
  onEdit?: (emp: Employee) => void;
}

export function EmployeeTable({ employees, onDelete, onEdit }: Props) {
  const t = useTranslations('Employees');
  const tc = useTranslations('Common');
  const locale = useLocale();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-[#1e293b]">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/60 border-b border-slate-700">
          <tr>
            {[t('staffNumber'), t('fullName'), tc('department'), tc('designation'), t('employmentType'), tc('status'), 'Profile', tc('actions')].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-8 text-slate-500">{tc('noResults')}</td></tr>
          ) : employees.map((emp) => {
            const gaps = getProfileGaps(emp);
            const hasCritical = gaps.some(g => g.critical);
            return (
              <tr key={emp._id} className="border-b border-slate-700/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{emp.staffNumber}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{emp.fullName}</td>
                <td className="px-4 py-3 text-slate-400">{emp.department}</td>
                <td className="px-4 py-3 text-slate-400">{emp.designation}</td>
                <td className="px-4 py-3 capitalize text-slate-300">{emp.employmentType}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[emp.status] ?? 'bg-slate-700 text-slate-400')}>
                    {emp.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {gaps.length === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                      Complete
                    </span>
                  ) : (
                    <div className="relative group">
                      <Link href={`/${locale}/employees/${emp._id}`} className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                        hasCritical ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
                      )}>
                        {hasCritical
                          ? <AlertCircle className="h-3 w-3" />
                          : <AlertTriangle className="h-3 w-3" />}
                        {gaps.length} missing
                      </Link>
                      {/* Tooltip */}
                      <div className="absolute left-0 top-full mt-1.5 z-20 hidden group-hover:block w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Missing fields</p>
                        {gaps.map(g => (
                          <div key={g.label} className="flex items-center gap-1.5 py-0.5">
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', g.critical ? 'bg-red-400' : 'bg-amber-400')} />
                            <span className="text-xs text-slate-300">{g.label}</span>
                          </div>
                        ))}
                        <p className="text-[9px] text-slate-500 mt-1.5 border-t border-slate-700 pt-1.5">Click to open employee profile</p>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link href={`/${locale}/employees/${emp._id}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    {onEdit && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => onEdit(emp)}><Pencil className="h-4 w-4" /></Button>}
                    {onDelete && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(emp._id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
