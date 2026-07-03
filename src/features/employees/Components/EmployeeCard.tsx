'use client';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee } from '../Hooks/useEmployees';

function getProfileGaps(emp: Employee) {
  const gaps: { label: string; critical: boolean }[] = [];
  if (!emp.grossPay)                               gaps.push({ label: 'Gross Pay',     critical: true  });
  if (!emp.jobGroupId)                             gaps.push({ label: 'Job Group',      critical: true  });
  if (!emp.kraPin)                                 gaps.push({ label: 'KRA PIN',        critical: false });
  if (!emp.bankAccountNumber && !emp.mpesaNumber)  gaps.push({ label: 'Payment Method', critical: false });
  return gaps;
}

export function EmployeeCard({ emp }: { emp: Employee }) {
  const locale   = useLocale();
  const initials = emp.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const gaps     = getProfileGaps(emp);
  const hasCrit  = gaps.some(g => g.critical);

  return (
    <Link href={`/${locale}/employees/${emp._id}`} className="block">
      <div className={cn(
        'rounded-2xl border bg-[#1e293b] p-4 hover:border-slate-600 transition-colors cursor-pointer',
        hasCrit         ? 'border-red-500/40'    :
        gaps.length > 0 ? 'border-amber-500/40'  :
                          'border-slate-700/60',
      )}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-100">{emp.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">{emp.staffNumber}</p>
            </div>
          </div>
          {gaps.length > 0 && (
            hasCrit
              ? <AlertCircle  className="h-4 w-4 text-red-400   shrink-0 mt-0.5" />
              : <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          )}
        </div>

        <p className="text-xs text-slate-400">{emp.designation}</p>
        <p className="text-xs text-slate-500">{emp.department}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
            emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
            {emp.status}
          </span>
          {gaps.length > 0 && (
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              hasCrit ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400',
            )}>
              {gaps.length} missing
            </span>
          )}
        </div>

        {/* Missing field tags */}
        {gaps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {gaps.map(g => (
              <span key={g.label} className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded',
                g.critical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
              )}>
                {g.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
