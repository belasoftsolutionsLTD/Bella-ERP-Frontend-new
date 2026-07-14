'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequisitions } from '../Hooks/useRequisitions';
import { RequisitionCard } from '../Components/RequisitionCard';
import { REQUISITION_STATUS_LABELS } from '../constants';

export function RequisitionsListPage({ locale }: { locale: string }) {
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const { requisitions, isLoading } = useRequisitions({ status: status || undefined, department: department || undefined });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Job Requisitions</h1>
          <p className="text-sm text-brand-text-secondary">Manage open roles and hiring approvals</p>
        </div>
        <Link href={`/${locale}/recruitment/requisitions/new`}>
          <Button className="bg-primary text-white"><Plus className="h-4 w-4 mr-1" /> New Requisition</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-brand-border bg-brand-bg-soft text-brand-text px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.entries(REQUISITION_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Filter by department"
          className="rounded-md border border-brand-border bg-brand-bg-soft text-brand-text placeholder:text-brand-text-muted px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-text-secondary">Loading...</p>
      ) : requisitions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-brand-text-muted">
          No requisitions found. Create one to start hiring.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requisitions.map((r) => <RequisitionCard key={r._id} requisition={r} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
