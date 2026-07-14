'use client';

import { useState } from 'react';
import { Plus, Trash2, Play, Save, Calendar, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REPORT_DATA_SOURCES } from '@/lib/reports/schemas';
import { useCustomReports, type ReportResult } from '../Hooks/useCustomReports';
import { ReportsNav } from '../Components/ReportsNav';
import { ChartCard, ExportCSVButton, LoadingBlock } from '../Components/shared';

// Mirrors SOURCE_CONFIG in the backend (reportFunctions.js) — the field allowlist a
// custom report may select from per data source.
const SOURCE_FIELDS: Record<string, string[]> = {
  employees: ['fullName', 'department', 'designation', 'employmentType', 'status', 'dateOfHire', 'grossPay', 'gender', 'nationality'],
  attendance: ['employeeId', 'date', 'status', 'checkInTime', 'checkOutTime'],
  leave: ['employeeId', 'leaveTypeId', 'startDate', 'endDate', 'totalDays', 'status'],
  payroll: ['employeeId', 'grossPay', 'netPay', 'overtimeAmount', 'cycleId'],
  performance: ['employeeId', 'overallRating', 'reviewType', 'status', 'submittedAt'],
  expenses: ['employeeId', 'category', 'amount', 'currency', 'date', 'status'],
};
const OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'] as const;

interface FilterRow { field: string; operator: typeof OPERATORS[number]; value: string; }

export default function CustomReportBuilderPage() {
  const { reports, loading, build, runSaved, schedule, remove } = useCustomReports();

  const [name, setName] = useState('');
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableFields = dataSources.flatMap((s) => SOURCE_FIELDS[s] ?? []);

  const toggleSource = (s: string) => setDataSources((prev) => {
    const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
    setFields((f) => f.filter((field) => next.some((src) => SOURCE_FIELDS[src]?.includes(field))));
    return next;
  });
  const toggleField = (f: string) => setFields((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const addFilter = () => setFilters((f) => [...f, { field: availableFields[0] || '', operator: 'eq', value: '' }]);
  const updateFilter = (i: number, patch: Partial<FilterRow>) => setFilters((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeFilter = (i: number) => setFilters((f) => f.filter((_, idx) => idx !== i));

  const buildDef = (save: boolean) => ({
    name: name.trim() || 'Untitled Report',
    dataSources,
    fields,
    filters: filters.filter((f) => f.field && f.value !== ''),
    groupBy: groupBy || undefined,
    dateRange: (dateStart || dateEnd) ? { start: dateStart || undefined, end: dateEnd || undefined } : undefined,
    format: 'json' as const,
    save,
  });

  const canRun = dataSources.length > 0 && fields.length > 0;

  const handleRun = () => {
    setRunning(true);
    build(buildDef(false), (r) => { setResult(r); setRunning(false); }, () => setRunning(false));
  };
  const handleSave = () => {
    if (!name.trim()) return;
    setSaving(true);
    build(buildDef(true), (r) => { setResult(r); setSaving(false); }, () => setSaving(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-text">Custom Report Builder</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Build any report HR needs from the fields available across the system</p>
      </div>
      <ReportsNav active="custom" />

      <ChartCard title="1. Data Sources">
        <div className="flex flex-wrap gap-2">
          {REPORT_DATA_SOURCES.map((s) => (
            <button key={s} type="button" onClick={() => toggleSource(s)}
              className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors',
                dataSources.includes(s) ? 'border-brand-primary bg-brand-primary/10 text-indigo-300' : 'border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:border-brand-border-strong')}>
              {s}
            </button>
          ))}
        </div>
      </ChartCard>

      {dataSources.length > 0 && (
        <ChartCard title="2. Fields">
          <div className="flex flex-wrap gap-2">
            {availableFields.map((f) => (
              <button key={f} type="button" onClick={() => toggleField(f)}
                className={cn('px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors',
                  fields.includes(f) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:border-brand-border-strong')}>
                {f}
              </button>
            ))}
          </div>
        </ChartCard>
      )}

      {dataSources.length > 0 && (
        <ChartCard title="3. Filters" action={
          <button onClick={addFilter} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            <Plus className="h-3.5 w-3.5" /> Add Filter
          </button>
        }>
          {filters.length === 0 ? <p className="text-xs text-brand-text-muted">No filters — report will include all rows.</p> : (
            <div className="space-y-2">
              {filters.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={f.field} onChange={(e) => updateFilter(i, { field: e.target.value })}
                    className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text">
                    {availableFields.map((field) => <option key={field} value={field}>{field}</option>)}
                  </select>
                  <select value={f.operator} onChange={(e) => updateFilter(i, { operator: e.target.value as FilterRow['operator'] })}
                    className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text">
                    {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input value={f.value} onChange={(e) => updateFilter(i, { value: e.target.value })} placeholder="value"
                    className="flex-1 h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-xs text-brand-text placeholder:text-brand-text-muted" />
                  <button onClick={() => removeFilter(i)} className="p-2 text-brand-text-muted hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      )}

      {dataSources.length > 0 && (
        <ChartCard title="4. Group By (optional) &amp; 5. Date Range">
          <div className="grid grid-cols-3 gap-3">
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
              className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text">
              <option value="">No grouping</option>
              {availableFields.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text" />
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text" />
          </div>
        </ChartCard>
      )}

      {dataSources.length > 0 && (
        <ChartCard title="6. Preview, Save &amp; Export">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Report name (required to save)"
              className="flex-1 min-w-[200px] h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted" />
            <button onClick={handleRun} disabled={!canRun || running}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold disabled:opacity-50">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run / Preview
            </button>
            <button onClick={handleSave} disabled={!canRun || !name.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text text-xs font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Report
            </button>
            {result?.rows && <ExportCSVButton rows={result.rows} filename={`${name || 'report'}.csv`} />}
          </div>

          {result && (
            result.rows.length === 0 ? <p className="text-sm text-brand-text-muted text-center py-8">No rows matched.</p> : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-brand-text-muted border-b border-brand-border">
                    {Object.keys(result.rows[0]).filter((k) => typeof result.rows[0][k] !== 'object' || result.rows[0][k] === null).map((k) => <th key={k} className="pb-2 pr-4">{k}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-brand-border/60">
                    {result.rows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {Object.keys(result!.rows[0]).filter((k) => typeof result!.rows[0][k] !== 'object' || result!.rows[0][k] === null).map((k) => (
                          <td key={k} className="py-2 pr-4 text-brand-text-secondary">{String((row as any)[k] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length > 10 && <p className="text-[11px] text-brand-text-muted mt-2">Showing first 10 of {result.rows.length} rows — export CSV for the full set.</p>}
              </div>
            )
          )}
        </ChartCard>
      )}

      <ChartCard title="Saved Reports">
        {loading ? <LoadingBlock /> : reports.length === 0 ? (
          <p className="text-sm text-brand-text-muted text-center py-6">No saved reports yet.</p>
        ) : (
          <div className="divide-y divide-brand-border/60">
            {reports.map((r) => (
              <SavedReportRow key={r._id} report={r} onRun={runSaved} onSchedule={schedule} onDelete={remove} />
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function SavedReportRow({ report, onRun, onSchedule, onDelete }: {
  report: ReturnType<typeof useCustomReports>['reports'][number];
  onRun: (id: string, cb?: (r: ReportResult) => void) => void;
  onSchedule: (id: string, frequency: 'weekly' | 'monthly', recipients: string[], cb?: () => void) => void;
  onDelete: (id: string, cb?: () => void) => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [recipients, setRecipients] = useState('');
  const [lastResult, setLastResult] = useState<ReportResult | null>(null);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-text">{report.name}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {report.dataSources.join(', ')} · Created {new Date(report.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
            {report.schedule && <span className="text-emerald-400"> · {report.schedule.frequency} to {report.schedule.recipients.length} recipient(s)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onRun(report._id, setLastResult)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"><Play className="h-3.5 w-3.5" /> Run</button>
          <button onClick={() => setShowSchedule((s) => !s)} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text font-semibold"><Calendar className="h-3.5 w-3.5" /> Schedule</button>
          <button onClick={() => onDelete(report._id)} className="text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {showSchedule && (
        <div className="mt-2 flex items-center gap-2 bg-brand-bg-soft/50 rounded-lg p-3">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly')} className="h-8 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="email1@x.com, email2@x.com"
            className="flex-1 h-8 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-xs text-brand-text placeholder:text-brand-text-muted" />
          <button
            onClick={() => onSchedule(report._id, frequency, recipients.split(',').map((s) => s.trim()).filter(Boolean), () => setShowSchedule(false))}
            className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold">
            Confirm
          </button>
        </div>
      )}

      {lastResult && (
        <div className="mt-2 flex items-center gap-2 text-xs text-brand-text-secondary">
          <span>{lastResult.rows.length} row(s)</span>
          <ExportCSVButton rows={lastResult.rows} filename={`${report.name}.csv`} />
        </div>
      )}
    </div>
  );
}
