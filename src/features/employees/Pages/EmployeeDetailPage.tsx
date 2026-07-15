'use client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { EmployeeDetailTabs } from '../Components/EmployeeDetailTabs';
import { useEmployeeDetail } from '../Hooks/useEmployeeDetail';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';

const EMPLOYEE_STATUS_MAP: Record<string, Status> = {
  active: 'active', on_leave: 'onLeave', suspended: 'suspended', terminated: 'terminated',
};

export default function EmployeeDetailPage({ id }: { id: string }) {
  const { employee, loading, error, refetch } = useEmployeeDetail(id);
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={() => router.push(`/${locale}/employees`)} className="gap-2 text-slate-400 hover:text-brand-text">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {employee && (
          <>
            <div className="flex items-center gap-5 rounded-xl bg-brand-primary p-6 text-white">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold text-white">
                {employee.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{employee.fullName}</h1>
                <p className="opacity-70">{employee.designation} · {employee.department}</p>
                <p className="font-mono text-sm opacity-60">{employee.staffNumber}</p>
              </div>
              <StatusBadge status={EMPLOYEE_STATUS_MAP[employee.status] ?? 'inactive'} className="text-sm px-3 py-1" />
            </div>
            <EmployeeDetailTabs employee={employee} onChanged={refetch} />
          </>
        )}
      </Wrapper>
    </div>
  );
}
