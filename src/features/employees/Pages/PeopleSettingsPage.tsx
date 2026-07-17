'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useConfigSection } from '@/hooks/useConfigSection';
import { ConfigTable } from '@/components/custom-ui/ConfigTable';
import { DesignationsPanel } from '../Components/DesignationsPanel';
import { TaxConfigPanel } from '@/features/payroll/Components/TaxConfigPanel';
import { OvertimeConfigPanel } from '@/features/payroll/Components/OvertimeConfigPanel';

type Tab = 'departments' | 'jobGroups' | 'designations' | 'taxConfig' | 'overtime';

const TABS: { key: Tab; label: string }[] = [
  { key: 'departments',  label: 'Departments' },
  { key: 'jobGroups',    label: 'Job Groups' },
  { key: 'designations', label: 'Designations' },
  { key: 'taxConfig',    label: 'Tax & Payroll Configuration' },
  { key: 'overtime',     label: 'Overtime Rates' },
];

export default function PeopleSettingsPage() {
  const [tab, setTab] = useState<Tab>('departments');
  const departments  = useConfigSection('departments');
  const jobGroups    = useConfigSection('job-groups');
  const designations = useConfigSection('designations');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">People Settings</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Org structure, job groups, and payroll configuration — everything HR sets up once and the rest of the system reads from. Allowances, deductions, and loans are managed from Payroll → Concepts.</p>
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

      {tab === 'taxConfig' && <TaxConfigPanel />}
      {tab === 'overtime' && <OvertimeConfigPanel />}
    </div>
  );
}
