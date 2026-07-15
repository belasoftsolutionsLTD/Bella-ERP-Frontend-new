'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, X, Briefcase, CheckCircle2, Clock,
  Users, Calendar, Check, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  _id: string;
  name: string;
  description?: string | null;
  status: 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string | null;
  endDate?: string | null;
  departments: string[];
  supervisorName: string;
  teamLeaderName?: string | null;
  memberCount: number;
  subtaskCount: number;
  completedSubtasks: number;
  createdAt: string;
}

interface Employee {
  _id: string;
  fullName: string;
  staffNumber?: string;
  department?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { status: Status; label: string }> = {
  in_progress: { status: 'inProgress', label: 'In Progress' },
  completed:   { status: 'completed',  label: 'Completed' },
  on_hold:     { status: 'pending',    label: 'On Hold' },
  cancelled:   { status: 'cancelled',  label: 'Cancelled' },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : null;

// ── MultiSelect component ─────────────────────────────────────────────────────

function MultiSelectList({
  items, selected, onToggle, getLabel, getId, placeholder,
}: {
  items: any[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  getLabel: (item: any) => string;
  getId: (item: any) => string;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? items.filter(i => getLabel(i).toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand-border bg-brand-bg-soft/40">
        <Search className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13px] text-brand-text placeholder-slate-500 outline-none"
        />
      </div>
      <div className="max-h-44 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-[12px] text-brand-text-muted text-center py-4">No results</p>
        )}
        {filtered.map(item => {
          const id  = getId(item);
          const sel = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-brand-border/50 last:border-0 hover:bg-brand-bg-muted/40 transition-colors ${sel ? 'bg-brand-primary/10' : ''}`}
            >
              <div className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${sel ? 'bg-brand-primary border-brand-primary' : 'border-slate-500'}`}>
                {sel && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={`text-[13px] truncate ${sel ? 'text-indigo-300 font-medium' : 'text-brand-text'}`}>
                {getLabel(item)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Create Project Modal ──────────────────────────────────────────────────────

function CreateProjectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [departments, setDepartments]       = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts]   = useState<Set<string>>(new Set());
  const [teamLeaderId, setTeamLeaderId]     = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showDepts, setShowDepts]           = useState(true);
  const [showMembers, setShowMembers]       = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      returnResponse: true,
      thenFn: r => {
        const emps = r?.data?.data ?? [];
        setEmployees(emps);
        const depts = [...new Set(emps.map(e => e.department).filter(Boolean))] as string[];
        setDepartments(depts.sort());
      },
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleDept = (d: string) =>
    setSelectedDepts(prev => { const s = new Set(prev); s.has(d) ? s.delete(d) : s.add(d); return s; });

  const toggleMember = (id: string) =>
    setSelectedMembers(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const save = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name:         form.name.trim(),
      description:  form.description || null,
      startDate:    form.startDate || null,
      endDate:      form.endDate   || null,
      departments:  [...selectedDepts],
      teamLeaderId: teamLeaderId || null,
      memberIds:    [...selectedMembers],
    };
    apiCallFunction({
      url: `${API_BASE_URL}/projects`,
      method: 'POST',
      data: payload,
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,12,30,0.88)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col bg-brand-bg-soft border border-brand-border" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-[16px] font-bold text-brand-text">New Project</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Annual Report 2026"
              className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Brief description of the project…"
              className="w-full px-3 py-2 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>

          {/* Departments */}
          <div>
            <button
              type="button"
              onClick={() => setShowDepts(!showDepts)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-2"
            >
              <span>Departments Involved {selectedDepts.size > 0 && <span className="text-indigo-400 ml-1">({selectedDepts.size})</span>}</span>
              {showDepts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showDepts && (
              <MultiSelectList
                items={departments}
                selected={selectedDepts}
                onToggle={toggleDept}
                getId={d => d}
                getLabel={d => d}
                placeholder="Filter departments…"
              />
            )}
          </div>

          {/* Team Leader */}
          <div>
            <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Team Leader (optional)</label>
            <select
              value={teamLeaderId}
              onChange={e => setTeamLeaderId(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text focus:outline-none focus:border-brand-primary"
            >
              <option value="">— No team leader —</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>
                  {e.fullName}{e.department ? ` (${e.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Members */}
          <div>
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-2"
            >
              <span>Project Members {selectedMembers.size > 0 && <span className="text-indigo-400 ml-1">({selectedMembers.size})</span>}</span>
              {showMembers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showMembers && (
              <MultiSelectList
                items={employees}
                selected={selectedMembers}
                onToggle={toggleMember}
                getId={e => e._id}
                getLabel={e => `${e.fullName}${e.department ? ` · ${e.department}` : ''}`}
                placeholder="Search employees…"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-brand-border shrink-0">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-brand-border-strong text-[13px] text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.name.trim()}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-[13px] font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = STATUS_MAP[project.status] ?? STATUS_MAP.in_progress;
  const pct = project.subtaskCount > 0
    ? Math.round((project.completedSubtasks / project.subtaskCount) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-brand-bg-soft border border-brand-border rounded-2xl p-5 cursor-pointer hover:border-brand-primary/50 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="h-9 w-9 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
          <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
        </div>
        <StatusBadge status={cfg.status} label={cfg.label} className="text-[11px]" />
      </div>

      <h3 className="font-bold text-brand-text text-[15px] mb-0.5 group-hover:text-indigo-300 transition-colors leading-tight">
        {project.name}
      </h3>
      <p className="text-[11px] text-brand-text-muted mb-3">Supervisor: {project.supervisorName}</p>

      {/* Departments */}
      {(project.departments?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.departments.slice(0, 3).map(d => (
            <span key={d} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">{d}</span>
          ))}
          {project.departments.length > 3 && (
            <span className="text-[10px] text-brand-text-muted">+{project.departments.length - 3}</span>
          )}
        </div>
      )}

      {/* Subtask progress */}
      {project.subtaskCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-brand-text-secondary">Subtask progress</span>
            <span className="text-brand-text-secondary font-semibold">{project.completedSubtasks}/{project.subtaskCount}</span>
          </div>
          <div className="h-1.5 bg-brand-bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? '#22c55e' : '#6366f1',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-[11px] text-brand-text-muted">
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {project.memberCount} members</span>
        {project.teamLeaderName && (
          <span className="flex items-center gap-1.5 truncate">Lead: {project.teamLeaderName}</span>
        )}
      </div>

      {(project.startDate || project.endDate) && (
        <div className="mt-3 pt-3 border-t border-brand-border flex items-center gap-1.5 text-[11px] text-brand-text-muted">
          <Calendar className="h-3 w-3" />
          <span>{fmtDate(project.startDate) ?? '—'} → {fmtDate(project.endDate) ?? '—'}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { userData } = useAuth() as any;
  const role = userData?.role ?? '';
  const canCreate = ['super_admin', 'hr_manager', 'department_head'].includes(role);

  const [projects, setProjects]         = useState<Project[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
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

  const inProgress = projects.filter(p => p.status === 'in_progress');
  const completed  = projects.filter(p => p.status === 'completed');
  const other      = projects.filter(p => p.status !== 'in_progress' && p.status !== 'completed');

  return (
    <div className="min-h-screen bg-white text-brand-text p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-brand-text">Projects</h1>
          <p className="text-[13px] text-brand-text-secondary mt-0.5">Cross-department project coordination</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-primary text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-3 h-9 text-[13px] bg-brand-bg-soft border border-brand-border rounded-xl text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border rounded-xl text-brand-text focus:outline-none focus:border-brand-primary"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-brand-text-muted gap-2">
          <Briefcase className="h-10 w-10 opacity-30" />
          <p className="text-[13px]">No projects found.</p>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="text-indigo-400 text-[13px] hover:text-indigo-300">
              Create your first project →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {inProgress.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-indigo-400" /> In Progress ({inProgress.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inProgress.map(p => (
                  <ProjectCard key={p._id} project={p} onClick={() => router.push(`/${locale}/projects/${p._id}`)} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Completed ({completed.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completed.map(p => (
                  <ProjectCard key={p._id} project={p} onClick={() => router.push(`/${locale}/projects/${p._id}`)} />
                ))}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" /> Other ({other.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {other.map(p => (
                  <ProjectCard key={p._id} project={p} onClick={() => router.push(`/${locale}/projects/${p._id}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}
