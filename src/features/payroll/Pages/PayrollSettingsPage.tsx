'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfigSection } from '@/hooks/useConfigSection';
import { FixedAllowancesPanel } from '../Components/FixedAllowancesPanel';
import { DeductionsPanel } from '../Components/DeductionsPanel';
import { TaxConfigPanel } from '../Components/TaxConfigPanel';

type Tab = 'allowances' | 'deductions' | 'taxConfig';

const TABS: { key: Tab; label: string }[] = [
  { key: 'allowances', label: 'Allowances' },
  { key: 'deductions',  label: 'Deductions' },
  { key: 'taxConfig',   label: 'Tax & Payroll Configuration' },
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

export default function PayrollSettingsPage() {
  const [tab, setTab] = useState<Tab>('allowances');
  const allowances = useConfigSection('fixed-allowances');
  const deductions = useConfigSection('deductions');
  const jobGroups = useConfigSection('job-groups');

  return (
    <div className="min-h-screen bg-white p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Payroll Settings</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Allowances, deductions, and tax configuration for payroll.</p>
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
    </div>
  );
}
