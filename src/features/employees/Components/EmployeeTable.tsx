'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Employee } from '../Hooks/useEmployees';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  on_leave: 'bg-warning/20 text-yellow-700',
  suspended: 'bg-orange-100 text-orange-700',
  terminated: 'bg-danger/10 text-danger',
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
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-primary/5 border-b">
          <tr>
            {[t('staffNumber'), t('fullName'), tc('department'), tc('designation'), t('employmentType'), tc('status'), tc('actions')].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-foreground/50">{tc('noResults')}</td></tr>
          ) : employees.map((emp) => (
            <tr key={emp._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-primary">{emp.staffNumber}</td>
              <td className="px-4 py-3 font-medium">{emp.fullName}</td>
              <td className="px-4 py-3 text-foreground/70">{emp.department}</td>
              <td className="px-4 py-3 text-foreground/70">{emp.designation}</td>
              <td className="px-4 py-3 capitalize">{emp.employmentType}</td>
              <td className="px-4 py-3">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[emp.status] ?? 'bg-gray-100 text-gray-600')}>
                  {emp.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link href={`/${locale}/employees/${emp._id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  </Link>
                  {onEdit && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(emp)}><Pencil className="h-4 w-4" /></Button>}
                  {onDelete && <Button size="icon" variant="ghost" className="h-8 w-8 text-danger hover:text-danger" onClick={() => onDelete(emp._id)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
