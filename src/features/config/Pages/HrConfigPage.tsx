'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useHrConfig } from '../Hooks/useHrConfig';
import { ConfigTable } from '../Components/ConfigTable';

import { CompanySettingsPanel } from '../Components/CompanySettingsPanel';
import { CommunicationSettingsPanel } from '../Components/CommunicationSettingsPanel';
import { FixedAllowancesPanel } from '../Components/FixedAllowancesPanel';
import { DeductionsPanel } from '../Components/DeductionsPanel';
import { DesignationsPanel } from '../Components/DesignationsPanel';
import { JdTemplatesPanel } from '../Components/JdTemplatesPanel';
import { CompanyAccountsPanel } from '../Components/CompanyAccountsPanel';

type Tab = 'departments' | 'jobGroups' | 'allowances' | 'fixedAllowances' | 'deductions' | 'leaveTypes' | 'designations' | 'jdTemplates' | 'companyAccounts' | 'commSettings' | 'companySettings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'departments',      label: 'Departments' },
  { key: 'jobGroups',        label: 'Job Groups' },
  { key: 'allowances',       label: 'Allowances' },
  { key: 'fixedAllowances',  label: 'Fixed Allowances' },
  { key: 'deductions',       label: 'Deductions' },
  { key: 'leaveTypes',       label: 'Leave Types' },
  { key: 'designations',     label: 'Designations' },
  { key: 'jdTemplates',      label: 'JD Templates' },
  { key: 'companyAccounts',  label: 'Company Accounts' },
  { key: 'commSettings',     label: 'Communication' },
  { key: 'companySettings',  label: 'Company Settings' },
];

export default function HrConfigPage() {
  const [tab, setTab] = useState<Tab>('departments');
  const { departments, jobGroups, allowances, fixedAllowances, deductions, leaveTypes, designations, jdTemplates, companyAccounts } = useHrConfig();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary">HR Configuration</h1>
        <p className="text-sm text-foreground/50 mt-1">
          Configure your organisation's structure. Changes here are reflected across all modules.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
              tab === t.key
                ? 'bg-accent text-white'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 hover:text-white'
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

      {tab === 'allowances' && (
        <ConfigTable
          title="Allowances (Job Group Linked)"
          items={allowances.items}
          loading={allowances.loading}
          columns={[
            { key: 'name',        label: 'Allowance Name' },
            { key: 'amount',      label: 'Amount (KES)', type: 'number' },
            { key: 'description', label: 'Description' },
          ]}
          defaultForm={{ name: '', amount: '', description: '' }}
          onCreate={(d) => allowances.create(d)}
          onUpdate={(id, d) => allowances.update(id, d)}
          onDelete={(id) => allowances.remove(id)}
        />
      )}

      {tab === 'fixedAllowances' && (
        <FixedAllowancesPanel
          items={fixedAllowances.items}
          loading={fixedAllowances.loading}
          jobGroups={jobGroups.items}
          onCreate={(d) => fixedAllowances.create(d)}
          onUpdate={(id, d) => fixedAllowances.update(id, d)}
          onDelete={(id) => fixedAllowances.remove(id)}
        />
      )}

      {tab === 'deductions' && (
        <DeductionsPanel
          items={deductions.items}
          loading={deductions.loading}
          jobGroups={jobGroups.items}
          onCreate={(d) => deductions.create(d)}
          onUpdate={(id, d) => deductions.update(id, d)}
          onDelete={(id) => deductions.remove(id)}
        />
      )}

      {tab === 'leaveTypes' && (
        <ConfigTable
          title="Leave Types"
          items={leaveTypes.items}
          loading={leaveTypes.loading}
          columns={[
            { key: 'name',        label: 'Leave Type Name' },
            { key: 'defaultDays', label: 'Default Days', type: 'integer' },
            { key: 'isEnabled',   label: 'Enabled', type: 'checkbox' },
            { key: 'description', label: 'Description' },
          ]}
          defaultForm={{ name: '', defaultDays: '', isEnabled: 'true', description: '' }}
          onCreate={(d) => leaveTypes.create(d)}
          onUpdate={(id, d) => leaveTypes.update(id, d)}
          onDelete={(id) => leaveTypes.remove(id)}
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

      {tab === 'jdTemplates' && (
        <JdTemplatesPanel
          items={jdTemplates.items as any}
          loading={jdTemplates.loading}
          refetch={jdTemplates.refetch}
        />
      )}

      {tab === 'companyAccounts' && (
        <CompanyAccountsPanel
          items={companyAccounts.items as any}
          refetch={companyAccounts.refetch}
        />
      )}

      {tab === 'commSettings' && <CommunicationSettingsPanel />}
      {tab === 'companySettings' && <CompanySettingsPanel />}
    </div>
  );
}
