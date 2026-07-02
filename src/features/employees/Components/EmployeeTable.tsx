'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Employee } from '../Hooks/useEmployees';

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
            {[t('staffNumber'), t('fullName'), tc('department'), tc('designation'), t('employmentType'), tc('status'), tc('actions')].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-slate-500">{tc('noResults')}</td></tr>
          ) : employees.map((emp) => (
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
                <div className="flex gap-1">
                  <Link href={`/${locale}/employees/${emp._id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700"><Eye className="h-4 w-4" /></Button>
                  </Link>
                  {onEdit && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => onEdit(emp)}><Pencil className="h-4 w-4" /></Button>}
                  {onDelete && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(emp._id)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
