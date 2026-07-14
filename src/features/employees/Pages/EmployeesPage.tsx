'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Plus, LayoutGrid, List, Settings, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { EmployeeTable } from '../Components/EmployeeTable';
import { EmployeeCard } from '../Components/EmployeeCard';
import { EmployeeFilters } from '../Components/EmployeeFilters';
import { AddEmployeeDrawer } from '../Components/AddEmployeeDrawer';
import { useEmployees } from '../Hooks/useEmployees';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile } from '@/functions/downloadFile';

type ViewMode = 'list' | 'grid';

export default function EmployeesPage() {
  const { isHR } = useAuth();
  const locale = useLocale();
  const [view, setView] = useState<ViewMode>('list');
  const [showDrawer, setShowDrawer] = useState(false);
  const { employees, total, loading, error, filters, setFilters, refetch } = useEmployees();

  const page      = filters.page ?? 1;
  const limit     = filters.limit ?? 25;
  const totalPages = Math.ceil(total / limit);
  const from      = Math.min((page - 1) * limit + 1, total);
  const to        = Math.min(page * limit, total);

  const handleDelete = (id: string) => {
    if (!confirm('Remove this employee? This cannot be undone.')) return;
    const terminationReason = window.prompt('Reason for termination (optional):') || undefined;
    apiCallFunction({ url: `${API_BASE_URL}/employees/${id}`, method: 'DELETE', data: { terminationReason }, thenFn: () => refetch() });
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.department) params.set('department', filters.department);
    if (filters.designation) params.set('designation', filters.designation);
    if (filters.employmentType) params.set('employmentType', filters.employmentType);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    downloadFile(`${API_BASE_URL}/employees/export${qs ? `?${qs}` : ''}`, 'employees.csv').catch(err => toast.error(err.message));
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text">People</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">{total} employee{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {isHR && (
            <Link
              href={`/${locale}/employees/analytics`}
              className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          )}
          {isHR && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
          {isHR && (
            <Link
              href={`/${locale}/employees/settings`}
              className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              People Settings
            </Link>
          )}
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add employee
          </button>
        </div>
      </div>

      {/* ── Filters + view toggle ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <EmployeeFilters filters={filters} onChange={setFilters} />

        {/* View toggle */}
        <div className="flex items-center bg-brand-bg-soft rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setView('list')}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-all',
              view === 'list' ? 'bg-brand-bg-muted shadow-sm text-indigo-400' : 'text-brand-text-secondary hover:text-brand-text-secondary',
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-all',
              view === 'grid' ? 'bg-brand-bg-muted shadow-sm text-indigo-400' : 'text-brand-text-secondary hover:text-brand-text-secondary',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {view === 'list' ? (
          <EmployeeTable employees={employees} onDelete={handleDelete} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {employees.length === 0 ? (
              <div className="col-span-full bg-brand-bg-soft rounded-2xl border border-brand-border/60 py-20 flex flex-col items-center gap-3 text-center">
                <p className="font-semibold text-brand-text">No employees found</p>
                <p className="text-sm text-brand-text-secondary">Try adjusting your filters or add a new employee.</p>
              </div>
            ) : employees.map(emp => (
              <EmployeeCard key={emp._id} emp={emp} />
            ))}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {total > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-brand-text-secondary">
              Showing <span className="font-medium text-brand-text-secondary">{from}–{to}</span> of{' '}
              <span className="font-medium text-brand-text-secondary">{total}</span> employees
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                className="h-8 px-3 rounded-lg border border-brand-border text-sm font-medium text-brand-text-secondary hover:bg-brand-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="h-8 px-3 flex items-center text-brand-text-secondary">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                className="h-8 px-3 rounded-lg border border-brand-border text-sm font-medium text-brand-text-secondary hover:bg-brand-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Wrapper>

      {showDrawer && (
        <AddEmployeeDrawer
          onClose={() => setShowDrawer(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
