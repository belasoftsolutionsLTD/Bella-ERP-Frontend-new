'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Search, Users, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { useOrgChart, type OrgDepartment, type OrgEmployee } from '../Hooks/useOrgChart';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-500',
  on_leave:  'bg-blue-400',
  suspended: 'bg-yellow-400',
  terminated:'bg-red-400',
};

const DEPT_ACCENT_COLORS = [
  'border-orange-400 bg-orange-50',
  'border-violet-400 bg-violet-50',
  'border-blue-400 bg-blue-50',
  'border-emerald-400 bg-emerald-50',
  'border-pink-400 bg-pink-50',
  'border-indigo-400 bg-indigo-50',
  'border-teal-400 bg-teal-50',
  'border-rose-400 bg-rose-50',
  'border-amber-400 bg-amber-50',
  'border-cyan-400 bg-cyan-50',
];
const DEPT_HEADER_COLORS = [
  'bg-orange-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500',
];

function EmployeeNode({ emp, locale, compact = false }: {
  emp: OrgEmployee; locale: string; compact?: boolean;
}) {
  return (
    <Link href={`/${locale}/employees/${emp._id}`}>
      <div className={cn(
        'bg-white border border-gray-100 rounded-xl flex items-center gap-2.5 hover:border-indigo-300 hover:shadow-sm transition-all duration-150 group cursor-pointer',
        compact ? 'p-2' : 'p-3',
      )}>
        <div className="relative shrink-0">
          <div className={cn(
            'rounded-full flex items-center justify-center text-white font-bold',
            avatarColor(emp.fullName),
            compact ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-xs',
          )}>
            {initials(emp.fullName)}
          </div>
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
            STATUS_COLORS[emp.status] ?? 'bg-gray-300',
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors leading-tight',
            compact ? 'text-[11px]' : 'text-xs',
          )}>
            {emp.fullName}
          </p>
          <p className={cn('text-slate-400 truncate leading-tight mt-0.5', compact ? 'text-[10px]' : 'text-[11px]')}>
            {emp.designation || 'Staff'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function DepartmentColumn({ dept, index, locale, searchQuery }: {
  dept: OrgDepartment; index: number; locale: string; searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const accent  = DEPT_ACCENT_COLORS[index % DEPT_ACCENT_COLORS.length];
  const hdrBg   = DEPT_HEADER_COLORS[index % DEPT_HEADER_COLORS.length];

  const filtered = useMemo(() => {
    if (!searchQuery) return dept.employees;
    const q = searchQuery.toLowerCase();
    return dept.employees.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      (e.designation ?? '').toLowerCase().includes(q),
    );
  }, [dept.employees, searchQuery]);

  if (searchQuery && filtered.length === 0) return null;

  return (
    <div className={cn('min-w-[220px] max-w-[240px] flex flex-col rounded-xl border-2 overflow-hidden', accent)}>
      {/* Department header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={cn('w-full flex items-center justify-between px-3 py-2.5 text-white', hdrBg)}
      >
        <div className="text-left">
          <p className="text-[11px] font-bold leading-tight truncate">{dept.name}</p>
          <p className="text-[10px] text-white/70 mt-0.5">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-white/70 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-white/70 shrink-0" />
        }
      </button>

      {/* Employee list */}
      {expanded && (
        <div className="p-2 space-y-1.5 flex-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No members</p>
          ) : (
            filtered.map(emp => (
              <EmployeeNode key={String(emp._id)} emp={emp} locale={locale} compact />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const locale = useLocale();
  const { data, loading, error, refetch } = useOrgChart();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const visibleDepts = useMemo(() => {
    if (!data) return [];
    let depts = data.departments;
    if (filterDept) depts = depts.filter(d => d.name === filterDept);
    return depts;
  }, [data, filterDept]);

  return (
    <div className="space-y-5 pb-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Org Chart</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data ? `${data.total} people across ${data.departments.length} departments` : 'Visual company hierarchy'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or title…"
            className="h-9 pl-9 pr-4 rounded-full border border-gray-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all w-56"
          />
        </div>

        {/* Department filter */}
        {data && (
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 appearance-none"
          >
            <option value="">All Departments</option>
            {data.departments.map(d => (
              <option key={d.name} value={d.name}>{d.name} ({d.employees.length})</option>
            ))}
          </select>
        )}

        {(search || filterDept) && (
          <button
            onClick={() => { setSearch(''); setFilterDept(''); }}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 h-9 border border-gray-200 rounded-full bg-white hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Active</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />On Leave</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Suspended</span>
        </div>
      </div>

      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            {visibleDepts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
                <Users className="h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-600">No departments found</p>
                <p className="text-sm text-slate-400">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
                {/* Summary row */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Company Structure</p>
                    <p className="text-xs text-slate-400">{data.total} employees · {data.departments.length} departments</p>
                  </div>
                </div>

                {/* Department columns */}
                <div className="flex gap-4 min-w-max pb-2">
                  {visibleDepts.map((dept, i) => (
                    <DepartmentColumn
                      key={dept.name}
                      dept={dept}
                      index={i}
                      locale={locale}
                      searchQuery={search}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stats footer */}
            {!filterDept && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Employees', value: data.total, color: 'text-slate-900' },
                  { label: 'Departments', value: data.departments.length, color: 'text-violet-600' },
                  { label: 'Active', value: data.departments.flatMap(d => d.employees).filter(e => e.status === 'active').length, color: 'text-emerald-600' },
                  { label: 'On Leave', value: data.departments.flatMap(d => d.employees).filter(e => e.status === 'on_leave').length, color: 'text-blue-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className={cn('text-2xl font-black leading-none', stat.color)}>{stat.value}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Wrapper>
    </div>
  );
}
