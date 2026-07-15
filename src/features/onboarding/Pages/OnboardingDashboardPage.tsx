'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Plus, Search, X, Loader2, AlertTriangle, ClipboardList, BarChart2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useOnboardingRecords } from '../Hooks/useOnboardingRecords';
import type { OnboardingRecord } from '../types';

const DEPARTMENTS = [
  'Administration', 'Human Resources', 'Finance & Accounts', 'Information Technology',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance',
  'Procurement', 'Logistics & Supply Chain', 'Research & Development', 'Communications',
  'Health & Safety', 'Facilities Management', 'Executive',
];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  preboarding: { label: 'Preboarding', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  active:      { label: 'Active',      bg: 'bg-brand-primary/15', text: 'text-indigo-400' },
  completed:   { label: 'Completed',   bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  stalled:     { label: 'Stalled',     bg: 'bg-red-500/15', text: 'text-red-400' },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

interface EmpOption { _id: string; fullName: string; staffNumber: string; department: string }
interface TemplateOption { _id: string; name: string }

function StartOnboardingModal({ onClose, onStarted, activeIds }: { onClose: () => void; onStarted: () => void; activeIds: Set<string> }) {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/employees?limit=500`, showToast: false, thenFn: r => { setEmployees(r.data?.data ?? r.data ?? []); res(); }, catchFn: () => res() })),
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/onboarding/templates`, showToast: false, thenFn: r => { setTemplates(r.data ?? []); res(); }, catchFn: () => res() })),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) || (e.staffNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = () => {
    if (!employeeId || !templateId || !startDate) return;
    setStarting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/onboarding/records`, method: 'POST',
      data: { employeeId, templateId, startDate },
      thenFn: () => { toast.success('Onboarding started.'); onStarted(); onClose(); },
      finallyFn: () => setStarting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Start Onboarding</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Employee <span className="text-red-400">*</span></label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…"
                  className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-brand-border rounded-lg p-1.5">
                {filtered.length === 0 ? (
                  <p className="text-xs text-brand-text-muted text-center py-4">No employees found.</p>
                ) : filtered.map(e => {
                  const isActive = activeIds.has(String(e._id));
                  return (
                    <button key={e._id} type="button" disabled={isActive} onClick={() => setEmployeeId(e._id)}
                      className={cn('w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2',
                        isActive ? 'opacity-50 cursor-not-allowed bg-amber-500/10' : employeeId === e._id ? 'bg-brand-primary/15 text-indigo-300' : 'hover:bg-brand-bg-muted/50 text-brand-text-secondary')}>
                      <span className="truncate">{e.fullName} <span className="text-brand-text-muted">· {e.staffNumber}</span></span>
                      {isActive && <span className="text-[10px] text-amber-400 shrink-0">Already onboarding</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Template <span className="text-red-400">*</span></label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">Select a template…</option>
                {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {templates.length === 0 && <p className="text-[11px] text-amber-500 mt-1">No templates yet — create one first under Templates.</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Start Date <span className="text-red-400">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleStart} disabled={!employeeId || !templateId || !startDate || starting}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {starting ? 'Starting…' : 'Start Onboarding'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingDashboardPage() {
  const locale = useLocale();
  const [showStart, setShowStart] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const { records, loading, refetch } = useOnboardingRecords({ status: statusFilter, department: deptFilter });

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r => r.employee?.fullName.toLowerCase().includes(q) || r.employee?.staffNumber.toLowerCase().includes(q));
  }, [records, search]);

  const stats = useMemo(() => ({
    preboarding: records.filter(r => r.status === 'preboarding').length,
    active: records.filter(r => r.status === 'active').length,
    completedThisMonth: records.filter(r => r.status === 'completed' && r.completedAt && new Date(r.completedAt).getMonth() === new Date().getMonth() && new Date(r.completedAt).getFullYear() === new Date().getFullYear()).length,
    stalled: records.filter(r => r.status === 'stalled').length,
  }), [records]);

  const overdueRecords = useMemo(() =>
    records.filter(r => r.status !== 'completed' && r.taskLists.some(l => l.tasks.some(t => t.status === 'overdue'))),
  [records]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Onboarding</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Manage new employee onboarding journeys</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/onboarding/templates`} className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <ClipboardList className="h-4 w-4" /> Templates
          </Link>
          <Link href={`/${locale}/onboarding/analytics`} className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Link>
          <button onClick={() => setShowStart(true)} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Start Onboarding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Preboarding', value: stats.preboarding, color: 'text-blue-600' },
          { label: 'Active', value: stats.active, color: 'text-indigo-600' },
          { label: 'Completed this month', value: stats.completedThisMonth, color: 'text-emerald-600' },
          { label: 'Stalled', value: stats.stalled, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-brand-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {overdueRecords.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            {overdueRecords.length} onboarding record{overdueRecords.length !== 1 ? 's have' : ' has'} at least one overdue task —
            {' '}{overdueRecords.slice(0, 3).map(r => r.employee?.fullName).filter(Boolean).join(', ')}
            {overdueRecords.length > 3 ? ` and ${overdueRecords.length - 3} more.` : '.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or staff ID…"
            className="w-full h-9 pl-9 pr-3 border border-brand-border rounded-xl text-sm bg-brand-bg-soft text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(search || statusFilter || deptFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setDeptFilter(''); }} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text px-2 py-1 rounded-lg hover:bg-brand-bg-muted transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-text-muted gap-4 border border-dashed border-brand-border/60 rounded-2xl bg-brand-bg-soft">
          <ClipboardList className="h-12 w-12" />
          <p className="text-sm font-semibold text-brand-text-secondary">No onboarding records found</p>
          <button onClick={() => setShowStart(true)} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Start Onboarding
          </button>
        </div>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 140px 110px 1fr 100px 100px' }}>
            {['Employee', 'Department', 'Start Date', 'Progress', 'Status', ''].map(h => (
              <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {filtered.map((r: OnboardingRecord) => {
            const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.active;
            const days = Math.round((new Date(r.startDate).getTime() - Date.now()) / 86400000);
            return (
              <div key={r._id} style={{ gridTemplateColumns: '1fr 140px 110px 1fr 100px 100px' }}
                className="grid border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors items-center">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-brand-text">{r.employee?.fullName ?? 'Unknown'}</p>
                  <p className="text-xs text-brand-text-muted">{r.employee?.staffNumber}</p>
                </div>
                <div className="px-4 py-3 text-xs text-brand-text-secondary">{r.employee?.department}</div>
                <div className="px-4 py-3 text-xs text-brand-text-secondary">
                  {fmtDate(r.startDate)}
                  <p className="text-[10px] text-brand-text-muted">{days > 0 ? `in ${days}d` : days < 0 ? `${-days}d ago` : 'today'}</p>
                </div>
                <div className="px-4 py-3">
                  <div className="h-1.5 rounded-full bg-brand-bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', r.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-brand-primary')} style={{ width: `${r.progressPercentage}%` }} />
                  </div>
                  <p className="text-[10px] text-brand-text-muted mt-1">{r.progressPercentage}%</p>
                </div>
                <div className="px-4 py-3"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>{cfg.label}</span></div>
                <div className="px-4 py-3">
                  <Link href={`/${locale}/onboarding/${r._id}`} className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">
                    Start Onboarding <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showStart && (
        <StartOnboardingModal
          activeIds={new Set(records.filter(r => r.status !== 'completed').map(r => String(r.employeeId)))}
          onClose={() => setShowStart(false)}
          onStarted={refetch}
        />
      )}
    </div>
  );
}
