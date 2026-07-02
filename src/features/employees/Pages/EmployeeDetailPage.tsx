'use client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { EmployeeDetailTabs } from '../Components/EmployeeDetailTabs';
import { useEmployeeDetail } from '../Hooks/useEmployeeDetail';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  on_leave: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-orange-500/20 text-orange-400',
  terminated: 'bg-red-500/20 text-red-400',
};

export default function EmployeeDetailPage({ id }: { id: string }) {
  const { employee, loading, error, refetch } = useEmployeeDetail(id);
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={() => router.push(`/${locale}/employees`)} className="gap-2 text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {employee && (
          <>
            <div className="flex items-center gap-5 rounded-xl bg-indigo-600 p-6 text-white">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold text-white">
                {employee.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{employee.fullName}</h1>
                <p className="opacity-70">{employee.designation} · {employee.department}</p>
                <p className="font-mono text-sm opacity-60">{employee.staffNumber}</p>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize', STATUS_COLORS[employee.status] ?? 'bg-slate-700 text-slate-300')}>
                {employee.status.replace('_', ' ')}
              </span>
            </div>
            <EmployeeDetailTabs employee={employee} />
          </>
        )}
      </Wrapper>
    </div>
  );
}
