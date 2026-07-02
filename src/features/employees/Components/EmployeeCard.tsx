'use client';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Employee } from '../Hooks/useEmployees';

export function EmployeeCard({ emp }: { emp: Employee }) {
  const locale = useLocale();
  const initials = emp.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Link href={`/${locale}/employees/${emp._id}`} className="block">
      <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-4 hover:border-slate-600 transition-colors cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-100">{emp.fullName}</p>
            <p className="text-xs text-slate-500 font-mono">{emp.staffNumber}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">{emp.designation}</p>
        <p className="text-xs text-slate-500">{emp.department}</p>
        <div className="mt-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
            emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
            {emp.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
