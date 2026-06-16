'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { EmployeeTable } from '../Components/EmployeeTable';
import { EmployeeFilters } from '../Components/EmployeeFilters';
import { useEmployees } from '../Hooks/useEmployees';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export default function EmployeesPage() {
  const t = useTranslations('Employees');
  const locale = useLocale();
  const { employees, total, loading, error, filters, setFilters, refetch } = useEmployees();
  const totalPages = Math.ceil(total / (filters.limit ?? 10));

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    apiCallFunction({ url: `${API_BASE_URL}/employees/${id}`, method: 'DELETE', thenFn: () => refetch() });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <Button asChild variant="accent" className="gap-2">
          <Link href={`/${locale}/employees/new`}>
            <Plus className="h-4 w-4" />{t('addEmployee')}
          </Link>
        </Button>
      </div>
      <EmployeeFilters filters={filters} onChange={setFilters} />
      <Wrapper loading={loading} error={error} onRetry={refetch}>
        <EmployeeTable employees={employees} onDelete={handleDelete} />
        <div className="flex items-center justify-between mt-3 text-sm text-foreground/60">
          <span>{total} total</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!filters.page || filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Prev</Button>
            <span className="px-2 py-1">{filters.page ?? 1} / {totalPages || 1}</span>
            <Button size="sm" variant="outline" disabled={(filters.page ?? 1) >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
          </div>
        </div>
      </Wrapper>
    </div>
  );
}
