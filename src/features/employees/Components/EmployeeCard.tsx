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
      <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm">{emp.fullName}</p>
            <p className="text-xs text-foreground/50 font-mono">{emp.staffNumber}</p>
          </div>
        </div>
        <p className="text-xs text-foreground/60">{emp.designation}</p>
        <p className="text-xs text-foreground/50">{emp.department}</p>
        <div className="mt-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
            emp.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
            {emp.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
