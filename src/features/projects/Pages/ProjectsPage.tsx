'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  Plus, Search, X, FolderOpen, Clock, DollarSign,
  Users, Calendar, CheckCircle2, AlertCircle, Circle,
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
  totalHours: number;
  totalExpenses: number;
  memberCount: number;
  budgetUsed: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  active:    { label: 'Active',    icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/20' },
  paused:    { label: 'Paused',    icon: AlertCircle,  color: 'text-amber-400 bg-amber-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/20' },
  cancelled: { label: 'Cancelled', icon: X,            color: 'text-slate-400 bg-slate-600/40' },
};

// ── Create Project Drawer ─────────────────────────────────────────────────────
interface CreateDrawerProps { onClose: () => void; onSaved: () => void }
function CreateProjectDrawer({ onClose, onSaved }: CreateDrawerProps) {
  const [form, setForm] = useState({
    name: '', code: '', description: '', clientName: '',
    budget: '', currency: 'KES', startDate: '', endDate: '',
    status: 'active', billable: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects`,
      method: 'POST',
      data: { ...form, budget: form.budget ? Number(form.budget) : undefined },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white text-lg">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Project Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => { set('name', e.target.value); if (!form.code) set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 10)); }}
                placeholder="e.g. Website Redesign"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Project Code <span className="text-red-400">*</span></label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="WEB-001"
                className="w-full h-9 px-3 text-sm font-mono bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Client</label>
              <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                placeholder="Client name"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Optional project description"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Budget</label>
              <input type="number" min="0" value={form.budget} onChange={e => set('budget', e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Currency</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                {['KES', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {/* Status + Billable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-1">
                <div className={`relative h-5 w-9 rounded-full transition-colors ${form.billable ? 'bg-indigo-600' : 'bg-slate-600'}`}
                  onClick={() => set('billable', !form.billable)}>
                  <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${form.billable ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-slate-300">Billable</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-700">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.name.trim() || !form.code.trim()}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;
  const StatusIcon = cfg.icon;
  const budgetPct = Math.min(project.budgetUsed, 100);

  return (
    <div onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{project.code}</span>
          {project.billable && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Billable</span>
          )}
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      <h3 className="font-bold text-white text-base mb-0.5 group-hover:text-indigo-300 transition-colors">{project.name}</h3>
      {project.clientName && <p className="text-xs text-slate-400 mb-3">{project.clientName}</p>}

      {project.budget ? (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Budget used</span>
            <span className={budgetPct >= 90 ? 'text-red-400' : budgetPct >= 70 ? 'text-amber-400' : 'text-slate-400'}>
              {Math.round(budgetPct)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${budgetPct}%` }} />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>{project.totalHours.toFixed(1)}h</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <DollarSign className="h-3.5 w-3.5" />
          <span>{fmt(project.totalExpenses, project.currency)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="h-3.5 w-3.5" />
          <span>{project.memberCount} members</span>
        </div>
      </div>

      {(project.startDate || project.endDate) && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          <span>{fmtDate(project.startDate)} – {fmtDate(project.endDate)}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects?${params}`,
      showToast: false,
      thenFn: r => setProjects(r?.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track projects, time, budgets, and team</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-3 h-9 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500">
          <option value="">All Statuses</option>
          {['active', 'paused', 'completed', 'cancelled'].map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
          <FolderOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm">No projects found.</p>
          <button onClick={() => setShowCreate(true)} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            Create your first project →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onClick={() => router.push(`/en/projects/${p._id}`)} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectDrawer onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}
