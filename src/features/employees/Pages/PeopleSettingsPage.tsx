'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfigSection } from '@/hooks/useConfigSection';
import { ConfigTable } from '@/components/custom-ui/ConfigTable';
import { DesignationsPanel } from '../Components/DesignationsPanel';
import { FixedAllowancesPanel } from '@/features/payroll/Components/FixedAllowancesPanel';
import { DeductionsPanel } from '@/features/payroll/Components/DeductionsPanel';
import { TaxConfigPanel } from '@/features/payroll/Components/TaxConfigPanel';
import { OvertimeConfigPanel } from '@/features/payroll/Components/OvertimeConfigPanel';

type Tab = 'departments' | 'jobGroups' | 'designations' | 'allowances' | 'deductions' | 'taxConfig' | 'overtime';

const TABS: { key: Tab; label: string }[] = [
  { key: 'departments',  label: 'Departments' },
  { key: 'jobGroups',    label: 'Job Groups' },
  { key: 'designations', label: 'Designations' },
  { key: 'allowances',   label: 'Allowances' },
  { key: 'deductions',   label: 'Deductions' },
  { key: 'taxConfig',    label: 'Tax & Payroll Configuration' },
  { key: 'overtime',     label: 'Overtime Rates' },
];

function JobGroupBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 mb-4">
      <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
      <p className="text-xs text-indigo-800">
        Entries here are applied automatically during payroll runs, scoped by the job group(s) selected below —
        leave job groups empty to apply an entry to every employee. An employee must have a job group assigned
        (Employees → Work tab) for job-group-scoped entries to reach them.
      </p>
    </div>
  );
}

export default function PeopleSettingsPage() {
  const [tab, setTab] = useState<Tab>('departments');
  const departments  = useConfigSection('departments');
  const jobGroups    = useConfigSection('job-groups');
  const designations = useConfigSection('designations');
  const allowances   = useConfigSection('fixed-allowances');
  const deductions   = useConfigSection('deductions');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">People Settings</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Org structure, job groups, and payroll configuration — everything HR sets up once and the rest of the system reads from.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
              tab === t.key
                ? 'bg-brand-primary text-white'
                : 'bg-brand-bg-muted/60 text-brand-text-secondary hover:bg-brand-border-strong/60 hover:text-brand-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'departments' && (
        <ConfigTable
          title="Departments"
          items={departments.items}
          loading={departments.loading}
          columns={[
            { key: 'name',        label: 'Department Name' },
            { key: 'description', label: 'Description' },
          ]}
          defaultForm={{ name: '', description: '' }}
          onCreate={(d) => departments.create(d)}
          onUpdate={(id, d) => departments.update(id, d)}
          onDelete={(id) => departments.remove(id)}
        />
      )}

      {tab === 'jobGroups' && (
        <ConfigTable
          title="Job Groups"
          items={jobGroups.items}
          loading={jobGroups.loading}
          columns={[
            { key: 'name',        label: 'Group Name' },
            { key: 'salaryMin',   label: 'Min Salary (KES)', type: 'number' },
            { key: 'salaryMax',   label: 'Max Salary (KES)', type: 'number' },
            { key: 'description', label: 'Description' },
          ]}
          defaultForm={{ name: '', salaryMin: '', salaryMax: '', description: '' }}
          onCreate={(d) => jobGroups.create(d)}
          onUpdate={(id, d) => jobGroups.update(id, d)}
          onDelete={(id) => jobGroups.remove(id)}
        />
      )}

      {tab === 'designations' && (
        <DesignationsPanel
          items={designations.items}
          loading={designations.loading}
          departments={departments.items}
          onCreate={(d) => designations.create(d)}
          onUpdate={(id, d) => designations.update(id, d)}
          onDelete={(id) => designations.remove(id)}
        />
      )}

      {tab === 'allowances' && (
        <div>
          <JobGroupBanner />
          <FixedAllowancesPanel
            items={allowances.items}
            loading={allowances.loading}
            jobGroups={jobGroups.items}
            onCreate={(d) => allowances.create(d)}
            onUpdate={(id, d) => allowances.update(id, d)}
            onDelete={(id) => allowances.remove(id)}
          />
        </div>
      )}

      {tab === 'deductions' && (
        <div>
          <JobGroupBanner />
          <DeductionsPanel
            items={deductions.items}
            loading={deductions.loading}
            jobGroups={jobGroups.items}
            onCreate={(d) => deductions.create(d)}
            onUpdate={(id, d) => deductions.update(id, d)}
            onDelete={(id) => deductions.remove(id)}
          />
        </div>
      )}

      {tab === 'taxConfig' && <TaxConfigPanel />}
      {tab === 'overtime' && <OvertimeConfigPanel />}
    </div>
  );
}
