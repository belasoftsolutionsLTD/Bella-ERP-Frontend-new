'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ProfileTab } from './ProfileTab';
import { DocumentsTab } from './DocumentsTab';
import { LeaveTab } from './LeaveTab';
import { PayrollTab } from './PayrollTab';
import { PerformanceTab } from './PerformanceTab';
import { NotesTab } from './NotesTab';
import type { Employee } from '../Hooks/useEmployees';

type Tab = 'profile' | 'documents' | 'leave' | 'payroll' | 'performance' | 'notes';

export function EmployeeDetailTabs({ employee }: { employee: Employee }) {
  const t = useTranslations('Employees');
  const [active, setActive] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: t('profile') },
    { key: 'documents', label: t('documents') },
    { key: 'leave', label: t('leave') },
    { key: 'payroll', label: t('payroll') },
    { key: 'performance', label: t('performance') },
    { key: 'notes', label: t('notes') },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b mb-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn('px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              active === tab.key ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active === 'profile' && <ProfileTab employee={employee} />}
      {active === 'documents' && <DocumentsTab employeeId={employee._id} documents={(employee as any).documents ?? []} />}
      {active === 'leave' && <LeaveTab employeeId={employee._id} />}
      {active === 'payroll' && <PayrollTab employeeId={employee._id} />}
      {active === 'performance' && <PerformanceTab employeeId={employee._id} />}
      {active === 'notes' && <NotesTab employeeId={employee._id} />}
    </div>
  );
}
