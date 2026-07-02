'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  ArrowLeft, Clock, DollarSign, Users, BarChart2, Info,
  Plus, X, AlertCircle, Search, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  clientName?: string;
  budget?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  status: string;
  billable: boolean;
  members: Member[];
  timeEntries: TimeEntry[];
  expenses: ProjectExpense[];
  summary: { totalHours: number; totalExpenses: number; budgetUsed: number };
}

interface Member {
  employeeId: string;
  role: string;
  totalHours: number;
  employee: { fullName: string; department: string; jobTitle: string } | null;
}

interface TimeEntry {
  _id: string;
  hours: number;
  date: string;
  description?: string;
  task?: string;
  billable: boolean;
  employee?: { fullName: string } | null;
}

interface ProjectExpense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  vendor?: string;
  billable: boolean;
}

interface BudgetData {
  budget: number;
  currency: string;
  spent: number;
  remaining: number;
  utilization: number;
  byCategory: { _id: string; total: number; count: number }[];
  totalHours: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

const TABS = [
  { key: 'overview',  label: 'Overview',      icon: Info },
  { key: 'time',      label: 'Time Tracking', icon: Clock },
  { key: 'expenses',  label: 'Expenses',      icon: DollarSign },
  { key: 'budget',    label: 'Budget',        icon: BarChart2 },
  { key: 'team',      label: 'Team',          icon: Users },
];

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Hours',    value: `${project.summary.totalHours.toFixed(1)}h` },
          { label: 'Expenses',       value: fmt(project.summary.totalExpenses, project.currency) },
          { label: 'Budget Used',    value: `${project.summary.budgetUsed}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3">
        {[
          { label: 'Client',     value: project.clientName || '—' },
          { label: 'Status',     value: project.status },
          { label: 'Billable',   value: project.billable ? 'Yes' : 'No' },
          { label: 'Budget',     value: project.budget ? fmt(project.budget, project.currency) : '—' },
          { label: 'Start Date', value: fmtDate(project.startDate) },
          { label: 'End Date',   value: fmtDate(project.endDate) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="text-white capitalize">{value}</span>
          </div>
        ))}
      </div>

      {project.description && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Description</p>
          <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
}

// ── Time Tracking Tab ─────────────────────────────────────────────────────────
function TimeTab({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ hours: '', date: new Date().toISOString().split('T')[0], description: '', task: '', billable: true });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/time-entries`,
      showToast: false,
      thenFn: r => setEntries(r?.data ?? []),
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.hours || !form.date) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${projectId}/time-entries`,
      method: 'POST',
      data: form,
      thenFn: () => { setShowAdd(false); setForm({ hours: '', date: new Date().toISOString().split('T')[0], description: '', task: '', billable: true }); load(); },
      finallyFn: () => setSaving(false),
    });
  };

  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{entries.length} entries · <span className="text-white font-semibold">{totalHours.toFixed(1)}h total</span></p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> Log Time
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hours <span className="text-red-400">*</span></label>
              <input type="number" min="0.1" step="0.1" value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="e.g. 2.5"
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            placeholder="Task / feature"
            className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <div className={`relative h-4 w-8 rounded-full transition-colors ${form.billable ? 'bg-indigo-600' : 'bg-slate-600'}`}
                onClick={() => setForm(f => ({ ...f, billable: !f.billable }))}>
                <div className={`absolute top-0.5 h-3 w-3 bg-white rounded-full shadow transition-transform ${form.billable ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              Billable
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-3 h-8 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.hours}
                className="px-4 h-8 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e._id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-14 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-300">{e.hours}h</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{e.task || e.description || 'No description'}</p>
              <p className="text-xs text-slate-400">{e.employee?.fullName ?? 'Unknown'} · {fmtDate(e.date)}</p>
            </div>
            {e.billable && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Billable</span>}
          </div>
        ))}
        {entries.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No time entries yet.</div>}
      </div>
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────
function ExpensesTab({ projectId, currency }: { projectId: string; currency: string }) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'other', vendor: '', billable: true });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/expenses`,
      showToast: false,
      thenFn: r => setExpenses(r?.data ?? []),
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${projectId}/expenses`,
      method: 'POST',
      data: form,
      thenFn: () => { setShowAdd(false); load(); },
      finallyFn: () => setSaving(false),
    });
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{expenses.length} expenses · <span className="text-white font-semibold">{fmt(total, currency)} total</span></p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description <span className="text-red-400">*</span></label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Software licence"
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Amount <span className="text-red-400">*</span></label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vendor</label>
              <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="Vendor name"
                className="w-full h-9 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <div className={`relative h-4 w-8 rounded-full transition-colors ${form.billable ? 'bg-indigo-600' : 'bg-slate-600'}`}
                onClick={() => setForm(f => ({ ...f, billable: !f.billable }))}>
                <div className={`absolute top-0.5 h-3 w-3 bg-white rounded-full shadow transition-transform ${form.billable ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              Billable to client
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-3 h-8 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.description || !form.amount}
                className="px-4 h-8 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {expenses.map(e => (
          <div key={e._id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{e.description}</p>
              <p className="text-xs text-slate-400">{e.vendor || e.category} · {fmtDate(e.date)}</p>
            </div>
            <span className="font-semibold text-white text-sm">{fmt(e.amount, currency)}</span>
            {e.billable && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Billable</span>}
          </div>
        ))}
        {expenses.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No project expenses yet.</div>}
      </div>
    </div>
  );
}

// ── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ projectId }: { projectId: string }) {
  const [data, setData]     = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/budget`,
      showToast: false,
      thenFn: r => setData(r?.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [projectId]);

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return <div className="text-center py-8 text-slate-500">No budget data.</div>;

  const pct = Math.min(data.utilization, 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: fmt(data.budget, data.currency), color: 'text-white' },
          { label: 'Spent',        value: fmt(data.spent, data.currency),  color: 'text-amber-400' },
          { label: 'Remaining',    value: fmt(data.remaining, data.currency), color: data.remaining >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Budget utilization</span>
          <span className={pct >= 90 ? 'text-red-400 font-bold' : pct >= 70 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }} />
        </div>
        {pct >= 90 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" /> Budget nearly exhausted
          </div>
        )}
      </div>

      {data.byCategory.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">By Category</p>
          <div className="space-y-2">
            {data.byCategory.map(cat => (
              <div key={cat._id} className="flex justify-between text-sm">
                <span className="text-slate-300 capitalize">{cat._id}</span>
                <span className="text-white font-medium">{fmt(cat.total, data.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
interface EmpResult { _id: string; fullName: string; staffNumber?: string; department?: string }

function TeamTab({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [allEmployees, setAllEmployees] = useState<EmpResult[]>([]);
  const [empSearch,    setEmpSearch]    = useState('');
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [role,         setRole]         = useState('member');
  const [saving,       setSaving]       = useState(false);

  const existingIds = new Set(project.members.map(m => String(m.employeeId)));

  useEffect(() => {
    if (!showAdd) { setEmpSearch(''); setSelectedIds(new Set()); }
    else {
      apiCallFunction<any>({
        url: `${API_BASE_URL}/employees?limit=300`,
        showToast: false,
        thenFn: r => setAllEmployees(r.data?.data ?? []),
      });
    }
  }, [showAdd]);

  const filtered = empSearch.trim()
    ? allEmployees.filter(e => e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.department?.toLowerCase().includes(empSearch.toLowerCase()))
    : allEmployees;

  const available = filtered.filter(e => !existingIds.has(e._id));

  const toggleEmp = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addMembers = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(empId =>
        apiCallFunction({
          url: `${API_BASE_URL}/projects/${project._id}/members`,
          method: 'POST',
          data: { employeeId: empId, role },
          showToast: false,
        })
      ));
      setShowAdd(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (employeeId: string) => {
    if (!confirm('Remove this member?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/members/${employeeId}`,
      method: 'DELETE',
      thenFn: onRefresh,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{project.members.length} team member{project.members.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> Add Members
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees…"
              className="w-full h-9 pl-8 pr-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          {/* Role + action row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full h-8 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                <option value="member">Member</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setSelectedIds(new Set(available.map(e => e._id)))}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">All</button>
              <span className="text-slate-600 text-xs">·</span>
              <button type="button" onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
            </div>
          </div>

          {/* Employee list with checkboxes */}
          <div className="border border-slate-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            {available.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-5">
                {allEmployees.length === 0 ? 'Loading…' : 'All employees already in project'}
              </p>
            )}
            {available.map(e => {
              const sel = selectedIds.has(e._id);
              return (
                <button key={e._id} type="button" onClick={() => toggleEmp(e._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 ${sel ? 'bg-indigo-500/5' : ''}`}>
                  <div className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${sel ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                    {sel && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${sel ? 'text-indigo-300' : 'text-white'}`}>{e.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{e.staffNumber && `${e.staffNumber} · `}{e.department}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedIds.size > 0 && (
            <p className="text-xs text-slate-400">{selectedIds.size} employee{selectedIds.size > 1 ? 's' : ''} selected</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 h-8 text-sm text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={addMembers} disabled={saving || selectedIds.size === 0}
              className="px-4 h-8 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : `Add ${selectedIds.size || ''} Member${selectedIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {project.members.map(m => (
          <div key={String(m.employeeId)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
              {m.employee?.fullName?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{m.employee?.fullName ?? 'Unknown'}</p>
              <p className="text-xs text-slate-400">{m.employee?.department} · {m.role}</p>
            </div>
            <span className="text-xs text-slate-400">{m.totalHours.toFixed(1)}h</span>
            <button onClick={() => removeMember(String(m.employeeId))}
              className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {project.members.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No team members assigned yet.</div>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}`,
      showToast: false,
      thenFn: r => setProject(r?.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-3 text-slate-400">
      <AlertCircle className="h-10 w-10" />
      <p>Project not found.</p>
      <button onClick={() => router.back()} className="text-indigo-400 hover:text-indigo-300 transition-colors">← Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="mt-1 h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{project.code}</span>
            <span className="text-xs text-slate-400 capitalize">{project.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.clientName && <p className="text-sm text-slate-400 mt-0.5">{project.clientName}</p>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab project={project} />}
      {tab === 'time'     && <TimeTab projectId={project._id} />}
      {tab === 'expenses' && <ExpensesTab projectId={project._id} currency={project.currency} />}
      {tab === 'budget'   && <BudgetTab projectId={project._id} />}
      {tab === 'team'     && <TeamTab project={project} onRefresh={load} />}
    </div>
  );
}
