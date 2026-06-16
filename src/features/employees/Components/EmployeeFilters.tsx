'use client';
import { useTranslations } from 'next-intl';
import { Search, ChevronDown } from 'lucide-react';
import { DEPARTMENTS, DESIGNATIONS } from './EmployeeSchema';
import type { EmployeeFilters as Filters } from '../Hooks/useEmployees';

interface Props { filters: Filters; onChange: (f: Filters) => void }

function FilterChip({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const active = !!value;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          appearance-none h-9 pl-3 pr-8 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-primary/20
          ${active
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-white text-foreground border-gray-200 hover:border-primary/40 hover:bg-gray-50'
          }
        `}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${active ? 'text-white/80' : 'text-foreground/40'}`} />
    </div>
  );
}

export function EmployeeFilters({ filters, onChange }: Props) {
  const t = useTranslations('Employees');
  const tc = useTranslations('Common');

  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value || undefined, page: 1 });

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
        <input
          className="h-9 pl-9 pr-4 rounded-full border border-gray-200 bg-white text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 hover:border-primary/40 transition-all w-52"
          placeholder="Search by name or staff no..."
          value={filters.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <FilterChip
        label="Department"
        value={String(filters.department ?? '')}
        options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
        onChange={(v) => set('department', v)}
      />
      <FilterChip
        label="Designation"
        value={String(filters.designation ?? '')}
        options={DESIGNATIONS.map((d) => ({ label: d, value: d }))}
        onChange={(v) => set('designation', v)}
      />
      <FilterChip
        label="Employment Type"
        value={String(filters.employmentType ?? '')}
        options={[
          { label: 'Permanent', value: 'permanent' },
          { label: 'Contract', value: 'contract' },
          { label: 'Part-time', value: 'part-time' },
          { label: 'Intern', value: 'intern' },
        ]}
        onChange={(v) => set('employmentType', v)}
      />
      <FilterChip
        label="Status"
        value={String(filters.status ?? '')}
        options={[
          { label: 'Active', value: 'active' },
          { label: 'On Leave', value: 'on_leave' },
          { label: 'Suspended', value: 'suspended' },
          { label: 'Terminated', value: 'terminated' },
        ]}
        onChange={(v) => set('status', v)}
      />

      {/* Clear all */}
      {(filters.search || filters.department || filters.designation || filters.employmentType || filters.status) && (
        <button
          onClick={() => onChange({ page: 1, limit: filters.limit })}
          className="h-9 px-3 rounded-full text-xs font-medium text-danger border border-danger/30 bg-danger/5 hover:bg-danger/10 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
