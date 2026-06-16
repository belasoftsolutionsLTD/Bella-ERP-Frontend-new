'use client';

import { useState } from 'react';
import { Plus, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { PayrollTable } from '../Components/PayrollTable';
import { GeneratePayrollModal } from '../Components/GeneratePayrollModal';
import { usePayroll } from '../Hooks/usePayroll';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [showGenerate, setShowGenerate] = useState(false);
  const [bulking, setBulking] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Bulk filters
  const [bulkDept, setBulkDept]               = useState('');
  const [bulkJobGroup, setBulkJobGroup]        = useState('');
  const [bulkEmploymentType, setBulkEmploymentType] = useState('');

  const { records, loading, error, refetch } = usePayroll(undefined, month, year);

  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const handleBulkGenerate = async () => {
    if (isFuture) { toast.error('Cannot generate payroll for a future period.'); return; }
    setBulking(true);
    const data: Record<string, unknown> = { month, year };
    if (bulkDept)            data.department     = bulkDept;
    if (bulkJobGroup)        data.jobGroupId     = bulkJobGroup;
    if (bulkEmploymentType)  data.employmentType = bulkEmploymentType;
    await apiCallFunction({
      url: `${API_BASE_URL}/payroll/bulk`,
      method: 'POST',
      data,
      thenFn: (res: any) => { toast.success(res.message || 'Bulk payroll generated.'); refetch(); },
    });
    setBulking(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-foreground/50 mt-0.5">Generate and review monthly payroll records. Gross pay is pulled from each employee's profile.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 text-foreground/60" onClick={() => setShowBulkPanel(v => !v)}>
            <Layers className="h-4 w-4" />
            Bulk Generate
            {showBulkPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <Button className="bg-primary text-white gap-2" onClick={() => setShowGenerate(true)}>
            <Plus className="h-4 w-4" /> Generate Payroll
          </Button>
        </div>
      </div>

      {/* Bulk generation panel */}
      {showBulkPanel && (
        <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Bulk Payroll Generation</h3>
            <p className="text-xs text-foreground/50">Leave filters blank to generate for all active employees</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Filter by Department</label>
              <input type="text" value={bulkDept} onChange={e => setBulkDept(e.target.value)}
                placeholder="e.g. Finance (blank = all)"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Filter by Employment Type</label>
              <select value={bulkEmploymentType} onChange={e => setBulkEmploymentType(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                <option value="">All Types</option>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="part_time">Part-time</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Period</label>
              <div className="flex gap-2">
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="flex-1 h-9 border border-gray-200 rounded-xl px-2 text-sm focus:outline-none bg-white">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-24 h-9 border border-gray-200 rounded-xl px-2 text-sm focus:outline-none bg-white">
                  {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          {isFuture && <p className="text-xs text-red-600">Cannot generate for a future period.</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowBulkPanel(false)} className="text-xs text-foreground/40 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleBulkGenerate} disabled={bulking || isFuture}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Layers className="h-3.5 w-3.5" />
              {bulking ? 'Generating…' : 'Run Bulk Payroll'}
            </button>
          </div>
        </div>
      )}

      {/* Month / year filter for table */}
      <div className="flex gap-3">
        <div className="relative">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="appearance-none h-9 border rounded-full bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none text-xs">▾</span>
        </div>
        <div className="relative">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="appearance-none h-9 border rounded-full bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium">
            {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none text-xs">▾</span>
        </div>
      </div>

      <Wrapper loading={loading} error={error} onRetry={refetch}>
        <PayrollTable records={records} onRefetch={refetch} />
      </Wrapper>

      {showGenerate && (
        <GeneratePayrollModal
          defaultMonth={month}
          defaultYear={year}
          onClose={() => setShowGenerate(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
