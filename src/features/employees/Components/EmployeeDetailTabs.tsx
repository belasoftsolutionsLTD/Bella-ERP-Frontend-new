'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileTab } from './ProfileTab';
import { WorkTab } from './WorkTab';
import { DocumentsTab } from './DocumentsTab';
import { LeaveTab } from './LeaveTab';
import { PayrollTab } from './PayrollTab';
import { PerformanceTab } from './PerformanceTab';
import { NotesTab } from './NotesTab';
import { AssetsTab } from './AssetsTab';
import { JobHistoryTab } from './JobHistoryTab';
import { SkillsTab } from './SkillsTab';
import type { Employee } from '../Hooks/useEmployees';

type Tab = 'profile' | 'work' | 'documents' | 'leave' | 'payroll' | 'performance' | 'notes' | 'assets' | 'jobHistory' | 'skills';

const TABS: { key: Tab; label: string; hrOnly?: boolean }[] = [
  { key: 'profile',     label: 'Personal'    },
  { key: 'work',        label: 'Work'        },
  { key: 'documents',   label: 'Documents'   },
  { key: 'leave',       label: 'Time'        },
  { key: 'payroll',     label: 'Payroll'     },
  { key: 'performance', label: 'Performance' },
  { key: 'assets',      label: 'Assets'      },
  { key: 'skills',      label: 'Skills & Qualifications' },
  { key: 'jobHistory',  label: 'Job History', hrOnly: true },
  { key: 'notes',       label: 'Notes'       },
];

export function EmployeeDetailTabs({ employee, onChanged }: { employee: Employee; onChanged: () => void }) {
  const { isHR } = useAuth();
  const [active, setActive] = useState<Tab>('profile');
  const visibleTabs = TABS.filter(t => !t.hrOnly || isHR);

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-brand-border overflow-x-auto px-2">
        {visibleTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              active === tab.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {active === 'profile'     && <ProfileTab employee={employee} />}
        {active === 'work'        && <WorkTab employee={employee} />}
        {active === 'documents'   && <DocumentsTab employeeId={employee._id} documents={(employee as any).documents ?? []} />}
        {active === 'leave'       && <LeaveTab employeeId={employee._id} />}
        {active === 'payroll'     && <PayrollTab employeeId={employee._id} />}
        {active === 'performance' && <PerformanceTab employee={employee} />}
        {active === 'assets'      && <AssetsTab employeeId={employee._id} />}
        {active === 'skills'      && <SkillsTab employee={employee} onChanged={onChanged} />}
        {active === 'jobHistory'  && <JobHistoryTab employeeId={employee._id} />}
        {active === 'notes'       && <NotesTab employeeId={employee._id} />}
      </div>
    </div>
  );
}
