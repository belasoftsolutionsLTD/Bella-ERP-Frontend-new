'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfigSection } from '@/hooks/useConfigSection';
import { ConfigTable } from '@/components/custom-ui/ConfigTable';
import { FixedAllowancesPanel } from '../Components/FixedAllowancesPanel';
import { DeductionsPanel } from '../Components/DeductionsPanel';
import { TaxConfigPanel } from '../Components/TaxConfigPanel';

type Tab = 'allowances' | 'fixedAllowances' | 'deductions' | 'taxConfig';

const TABS: { key: Tab; label: string }[] = [
  { key: 'allowances',      label: 'Allowances' },
  { key: 'fixedAllowances', label: 'Fixed Allowances' },
  { key: 'deductions',      label: 'Deductions' },
  { key: 'taxConfig',       label: 'Tax & Payroll Configuration' },
];

function LegacyBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800">
        Legacy configuration — payslips are calculated from <span className="font-semibold">Payroll Concepts</span> (see the
        &ldquo;Concepts&rdquo; tab), not from this list. Entries here are kept for reference but do not affect active payroll runs.
      </p>
    </div>
  );
}

export default function PayrollSettingsPage() {
  const [tab, setTab] = useState<Tab>('allowances');
  const allowances = useConfigSection('allowances');
  const fixedAllowances = useConfigSection('fixed-allowances');
  const deductions = useConfigSection('deductions');
  const jobGroups = useConfigSection('job-groups');

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Payroll Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Allowances, deductions, and tax configuration for payroll.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'allowances' && (
        <div>
          <LegacyBanner />
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
        </div>
      )}

      {tab === 'fixedAllowances' && (
        <div>
          <LegacyBanner />
          <FixedAllowancesPanel
            items={fixedAllowances.items}
            loading={fixedAllowances.loading}
            jobGroups={jobGroups.items}
            onCreate={(d) => fixedAllowances.create(d)}
            onUpdate={(id, d) => fixedAllowances.update(id, d)}
            onDelete={(id) => fixedAllowances.remove(id)}
          />
        </div>
      )}

      {tab === 'deductions' && (
        <div>
          <LegacyBanner />
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
