'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProfileTab } from './ProfileTab';
import { WorkTab } from './WorkTab';
import { DocumentsTab } from './DocumentsTab';
import { LeaveTab } from './LeaveTab';
import { PayrollTab } from './PayrollTab';
import { PerformanceTab } from './PerformanceTab';
import { NotesTab } from './NotesTab';
import { AssetsTab } from './AssetsTab';
import type { Employee } from '../Hooks/useEmployees';

type Tab = 'profile' | 'work' | 'documents' | 'leave' | 'payroll' | 'performance' | 'notes' | 'assets';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile',     label: 'Personal'    },
  { key: 'work',        label: 'Work'        },
  { key: 'documents',   label: 'Documents'   },
  { key: 'leave',       label: 'Time'        },
  { key: 'payroll',     label: 'Payroll'     },
  { key: 'performance', label: 'Performance' },
  { key: 'assets',      label: 'Assets'      },
  { key: 'notes',       label: 'Notes'       },
];

export function EmployeeDetailTabs({ employee }: { employee: Employee }) {
  const [active, setActive] = useState<Tab>('profile');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              active === tab.key
                ? 'border-indigo-500 text-indigo-600'
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
        {active === 'performance' && <PerformanceTab employeeId={employee._id} />}
        {active === 'assets'      && <AssetsTab employeeId={employee._id} />}
        {active === 'notes'       && <NotesTab employeeId={employee._id} />}
      </div>
    </div>
  );
}
