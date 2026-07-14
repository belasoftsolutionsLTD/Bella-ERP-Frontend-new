'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  Building2, History, TrendingUp,
  Users, DollarSign, ChevronDown, ChevronRight,
  TrendingDown, UserPlus, UserMinus,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CompGroup {
  name: string;
  headcount: number;
  earnings: number;
  benefits: number;
  employer: number;
  total: number;
}

interface CostCenter {
  name: string;
  headcount: number;
  totalCost: number;
  avgCost: number;
  departments: string[];
  employees: { _id: string; fullName: string; department: string; jobTitle: string }[];
}

interface HistoryEvent {
  type: 'hire' | 'termination' | 'resignation';
  date: string;
  employee: { _id: string; fullName: string; staffNumber: string };
  department: string;
  jobTitle: string;
}

interface TrendPoint {
  name: string;
  grossPay: number;
  netPay: number;
  deductions: number;
  employerCost: number;
  headcount: number;
}

interface TrendData {
  trend: TrendPoint[];
  avgGross: number;
  avgNet: number;
  totalAnnual: number;
}

interface WorkspaceSummary {
  totalHeadcount: number;
  newHiresThisMonth: number;
  exitsThisMonth: number;
  lastCycleName: string | null;
  currentGross: number;
  previousGross: number;
  momChangePct: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const fmtK = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(Math.round(n));

const EVENT_COLORS: Record<string, string> = {
  hire:        'bg-status-success-bg text-status-success-text border-transparent',
  termination: 'bg-status-danger-bg text-status-danger-text border-transparent',
  resignation: 'bg-status-warning-bg text-status-warning-text border-transparent',
};
const EVENT_LABELS: Record<string, string> = { hire: 'Hired', termination: 'Terminated', resignation: 'Resigned' };

const BAR_COLORS = ['bg-brand-primary', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'compensation', label: 'Compensation',    icon: DollarSign },
  { key: 'cost-centers', label: 'Cost Centers',    icon: Building2 },
  { key: 'history',      label: 'Workforce History', icon: History },
  { key: 'trends',       label: 'Payroll Trends',  icon: TrendingUp },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function CompensationTab() {
  const [groupBy, setGroupBy]   = useState<'department' | 'location' | 'costCenter'>('department');
  const [data, setData]         = useState<CompGroup[]>([]);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/finance/workspace/compensation?groupBy=${groupBy}`,
      showToast: false,
      thenFn: r => setData(r?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [groupBy]);

  useEffect(() => { load(); }, [load]);

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['department', 'location', 'costCenter'] as const).map(g => (
          <button key={g} onClick={() => setGroupBy(g)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              groupBy === g ? 'bg-brand-primary text-white' : 'bg-brand-bg-soft text-brand-text-secondary hover:bg-brand-bg-muted'
            }`}>
            {g === 'department' ? 'Department' : g === 'location' ? 'Location' : 'Cost Center'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((group, i) => (
            <div key={group.name} className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-text">{group.name}</span>
                  <span className="text-xs bg-brand-bg-muted text-brand-text-secondary px-2 py-0.5 rounded-full">{group.headcount} staff</span>
                </div>
                <span className="font-bold text-brand-text">{fmt(group.total)}</span>
              </div>
              <div className="w-full h-2 bg-brand-bg-muted rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${(group.total / maxTotal) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Earnings',     value: group.earnings },
                  { label: 'Benefits',     value: group.benefits },
                  { label: 'Employer',     value: group.employer },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/50 rounded-lg p-2">
                    <p className="text-brand-text-muted mb-0.5">{label}</p>
                    <p className="font-semibold text-brand-text">{fmt(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-12 text-brand-text-muted">No compensation data found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function CostCentersTab() {
  const [data, setData]       = useState<CostCenter[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/finance/workspace/cost-centers`,
      showToast: false,
      thenFn: r => setData(r?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map(cc => (
        <div key={cc.name} className="bg-brand-bg-soft rounded-xl border border-brand-border overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-brand-bg-soft transition-colors"
            onClick={() => setExpanded(expanded === cc.name ? null : cc.name)}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-brand-text">{cc.name}</p>
                <p className="text-xs text-brand-text-secondary">{cc.departments.join(', ') || 'No departments'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-brand-text">{fmt(cc.totalCost)}</p>
                <p className="text-xs text-brand-text-secondary">{cc.headcount} staff · avg {fmt(cc.avgCost)}</p>
              </div>
              {expanded === cc.name ? <ChevronDown className="h-4 w-4 text-brand-text-secondary" /> : <ChevronRight className="h-4 w-4 text-brand-text-secondary" />}
            </div>
          </button>
          {expanded === cc.name && (
            <div className="border-t border-brand-border px-4 pb-4 pt-3">
              <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide mb-2">Employees</p>
              <div className="space-y-2">
                {cc.employees.map(emp => (
                  <div key={String(emp._id)} className="flex items-center justify-between text-sm">
                    <span className="text-brand-text-secondary">{emp.fullName}</span>
                    <span className="text-brand-text-muted text-xs">{emp.department} · {emp.jobTitle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {data.length === 0 && <div className="text-center py-12 text-brand-text-muted">No cost centers configured.</div>}
    </div>
  );
}

function HistoryTab() {
  const [events, setEvents]   = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (typeFilter) params.set('type', typeFilter);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/finance/workspace/history?${params}`,
      showToast: false,
      thenFn: r => setEvents(r?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    hire:        events.filter(e => e.type === 'hire').length,
    termination: events.filter(e => e.type === 'termination').length,
    resignation: events.filter(e => e.type === 'resignation').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {([
          { value: '',            label: 'All Events' },
          { value: 'hire',        label: `Hires (${counts.hire})` },
          { value: 'termination', label: `Terminations (${counts.termination})` },
          { value: 'resignation', label: `Resignations (${counts.resignation})` },
        ]).map(opt => (
          <button key={opt.value} onClick={() => setTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === opt.value
                ? 'bg-brand-primary text-white'
                : 'bg-brand-bg-soft text-brand-text-secondary hover:bg-brand-bg-muted border border-brand-border'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-1">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3 bg-brand-bg-soft rounded-xl px-4 py-3 border border-brand-border">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${EVENT_COLORS[ev.type]}`}>
              {EVENT_LABELS[ev.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text">{ev.employee?.fullName}</p>
              <p className="text-xs text-brand-text-secondary">{ev.department} · {ev.jobTitle}</p>
            </div>
            <span className="text-xs text-brand-text-muted shrink-0">
              {ev.date ? new Date(ev.date).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'}
            </span>
          </div>
        ))}
        {events.length === 0 && <div className="text-center py-12 text-brand-text-muted">No workforce events found.</div>}
      </div>
    </div>
  );
}

function TrendsTab() {
  const [data, setData]     = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/finance/workspace/trends?months=12`,
      showToast: false,
      thenFn: r => setData(r?.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!data || data.trend.length === 0) return <div className="text-center py-12 text-brand-text-muted">No closed payroll cycles yet.</div>;

  const maxGross = Math.max(...data.trend.map(t => t.grossPay), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Monthly Gross', value: fmt(data.avgGross) },
          { label: 'Avg Monthly Net',   value: fmt(data.avgNet) },
          { label: 'Annual Total',       value: fmt(data.totalAnnual) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
            <p className="text-xs text-brand-text-secondary mb-1">{label}</p>
            <p className="text-lg font-bold text-brand-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-brand-bg-soft rounded-xl border border-brand-border p-4">
        <p className="text-sm font-semibold text-brand-text-secondary mb-4">Monthly Gross Pay</p>
        <div className="flex items-end gap-2 h-36">
          {data.trend.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-brand-text-muted">{fmtK(t.grossPay)}</span>
              <div className="w-full bg-brand-primary/80 rounded-t-sm transition-all"
                style={{ height: `${(t.grossPay / maxGross) * 100}%`, minHeight: 4 }} />
              <span className="text-xs text-brand-text-muted truncate w-full text-center">{t.name?.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-bg-soft rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-xs text-brand-text-muted uppercase">
              <th className="text-left px-4 py-3">Cycle</th>
              <th className="text-right px-4 py-3">Headcount</th>
              <th className="text-right px-4 py-3">Gross Pay</th>
              <th className="text-right px-4 py-3">Deductions</th>
              <th className="text-right px-4 py-3">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {data.trend.map((t, i) => (
              <tr key={i} className="hover:bg-brand-bg-soft transition-colors">
                <td className="px-4 py-3 text-brand-text-secondary">{t.name}</td>
                <td className="px-4 py-3 text-right text-brand-text-secondary">{t.headcount}</td>
                <td className="px-4 py-3 text-right text-brand-text font-medium">{fmt(t.grossPay)}</td>
                <td className="px-4 py-3 text-right text-red-400">{fmt(t.deductions)}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{fmt(t.netPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Summary Header ────────────────────────────────────────────────────────────
function SummaryHeader() {
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/finance/workspace/summary`,
      showToast: false,
      thenFn: r => setSummary(r?.data ?? null),
      catchFn: () => {},
    });
  }, []);

  if (!summary) return null;

  const momUp = summary.momChangePct >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand-primary/20 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-xs text-brand-text-secondary">Total Headcount</p>
          <p className="text-xl font-bold text-brand-text">{summary.totalHeadcount}</p>
        </div>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <UserPlus className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-brand-text-secondary">New Hires This Month</p>
          <p className="text-xl font-bold text-brand-text">{summary.newHiresThisMonth}</p>
        </div>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
          <UserMinus className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <p className="text-xs text-brand-text-secondary">Exits This Month</p>
          <p className="text-xl font-bold text-brand-text">{summary.exitsThisMonth}</p>
        </div>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${momUp ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
          {momUp
            ? <TrendingUp className="h-5 w-5 text-amber-400" />
            : <TrendingDown className="h-5 w-5 text-emerald-400" />
          }
        </div>
        <div>
          <p className="text-xs text-brand-text-secondary">
            Monthly Payroll {summary.lastCycleName ? `(${summary.lastCycleName})` : ''}
          </p>
          <p className="text-xl font-bold text-brand-text">{fmtK(summary.currentGross)}</p>
          {summary.previousGross > 0 && (
            <p className={`text-xs font-medium ${momUp ? 'text-amber-400' : 'text-emerald-400'}`}>
              {momUp ? '+' : ''}{summary.momChangePct}% vs last cycle
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FinancialWorkspacePage() {
  const [tab, setTab] = useState('compensation');

  return (
    <div className="min-h-screen bg-white text-brand-text p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Financial Workspace</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Compensation analytics, cost centers, and payroll trends</p>
      </div>

      {/* Summary cards */}
      <SummaryHeader />

      {/* Tab bar */}
      <div className="flex gap-1 bg-brand-bg-soft/50 p-1 rounded-xl w-fit border border-brand-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted'
              }`}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'compensation' && <CompensationTab />}
      {tab === 'cost-centers' && <CostCentersTab />}
      {tab === 'history'      && <HistoryTab />}
      {tab === 'trends'       && <TrendsTab />}
    </div>
  );
}
