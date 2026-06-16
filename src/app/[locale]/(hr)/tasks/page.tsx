'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  Plus, Search, Trash2, Pencil, X, CheckCircle2, Clock,
  Circle, AlertTriangle, Users, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface EmployeeTask {
  _id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName: string;
  department?: string;
  assignedBy?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
}

interface Employee { _id: string; fullName: string; staffNumber: string; department?: string; designation?: string }

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<Priority, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
};
const STATUS_STYLE: Record<TaskStatus, string> = {
  pending:     'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed:   'bg-emerald-100 text-emerald-700',
};
const STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  pending:     Circle,
  in_progress: Clock,
  completed:   CheckCircle2,
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' });
const isOverdue = (task: EmployeeTask) => task.status !== 'completed' && new Date(task.dueDate) < new Date();

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks]       = useState<EmployeeTask[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<EmployeeTask | null>(null);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDept,     setFilterDept]     = useState('');
  const [search,         setSearch]         = useState('');

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterStatus)   params.set('status',     filterStatus);
    if (filterPriority) params.set('priority',   filterPriority);
    if (filterDept)     params.set('department', filterDept);
    if (search)         params.set('search',     search);
    apiCallFunction<{ data: { data: EmployeeTask[]; total: number } }>({
      url: `${API_BASE_URL}/tasks?${params}`,
      showToast: false,
      thenFn: r => { setTasks(r.data?.data ?? []); setTotal(r.data?.total ?? 0); },
      catchFn: () => {},
      finallyFn: () => setLoading(false),
    });
  }, [page, filterStatus, filterPriority, filterDept, search]);

  useEffect(() => { load(); }, [load]);

  const deleteTask = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/tasks/${id}`, method: 'DELETE', thenFn: load });
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    apiCallFunction({ url: `${API_BASE_URL}/tasks/${id}`, method: 'PUT', data: { status }, thenFn: load, showToast: false });
  };

  // Stats
  const pending   = tasks.filter(t => t.status === 'pending').length;
  const inProg    = tasks.filter(t => t.status === 'in_progress').length;
  const done      = tasks.filter(t => t.status === 'completed').length;
  const overdue   = tasks.filter(isOverdue).length;

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Task Management</h1>
          <p className="text-sm text-foreground/50 mt-1">Assign and track tasks across your workforce</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Assign Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',     value: pending, color: 'text-blue-600 bg-blue-50' },
          { label: 'In Progress', value: inProg,  color: 'text-violet-600 bg-violet-50' },
          { label: 'Completed',   value: done,    color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Overdue',     value: overdue, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-4', s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by employee name…"
            className="w-full pl-9 pr-3 h-9 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-foreground/30 shrink-0" />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-9 text-sm border rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
            className="h-9 text-sm border rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-foreground/30 text-sm">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-foreground/30 text-sm">No tasks found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b">
              <tr>
                {['Employee', 'Task', 'Due Date', 'Priority', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const overdue = isOverdue(t);
                const StatusIcon = STATUS_ICON[t.status];
                return (
                  <tr key={t._id} className={cn('border-b last:border-0 hover:bg-gray-50 transition-colors', overdue && 'bg-red-50/40')}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-xs">{t.assignedToName}</p>
                      {t.department && <p className="text-[10px] text-foreground/40">{t.department}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-foreground leading-tight">{t.title}</p>
                      {t.description && <p className="text-xs text-foreground/40 mt-0.5 truncate">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={cn(overdue ? 'text-red-600 font-semibold' : 'text-foreground/60')}>
                        {overdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        {fmtDate(t.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize', PRIORITY_STYLE[t.priority])}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={t.status}
                        onChange={e => updateStatus(t._id, e.target.value as TaskStatus)}
                        className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30', STATUS_STYLE[t.status])}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(t); setShowForm(true); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-primary hover:bg-primary/10">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteTask(t._id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-foreground/50">
          <span>{total} tasks · page {page} of {pages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Assign / Edit modal */}
      {showForm && (
        <TaskFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Task form modal ───────────────────────────────────────────────────────────
function TaskFormModal({ editing, onClose, onSaved }: {
  editing: EmployeeTask | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]           = useState(editing?.title || '');
  const [description, setDesc]      = useState(editing?.description || '');
  const [dueDate, setDueDate]       = useState(editing?.dueDate || '');
  const [priority, setPriority]     = useState<Priority>(editing?.priority || 'medium');
  const [mode, setMode]             = useState<'single' | 'department'>('single');
  const [bulkDept, setBulkDept]     = useState('');
  const [empSearch, setEmpSearch]   = useState(editing?.assignedToName || '');
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving]         = useState(false);
  const searchRef                   = useRef<NodeJS.Timeout>();

  // Employee search
  useEffect(() => {
    if (mode !== 'single' || empSearch.length < 2) { setEmployees([]); return; }
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      apiCallFunction<{ data: Employee[] }>({
        url: `${API_BASE_URL}/tasks/employees/search?q=${encodeURIComponent(empSearch)}`,
        showToast: false,
        thenFn: r => { setEmployees(r.data ?? []); setShowDropdown(true); },
        catchFn: () => {},
      });
    }, 300);
  }, [empSearch, mode]);

  const save = () => {
    if (!title || !dueDate) return;
    if (mode === 'single' && !editing && !selectedEmp) return;
    setSaving(true);

    if (editing) {
      apiCallFunction({
        url: `${API_BASE_URL}/tasks/${editing._id}`, method: 'PUT',
        data: { title, description, dueDate, priority },
        thenFn: onSaved, finallyFn: () => setSaving(false),
      });
      return;
    }

    const data: Record<string, string> = { title, description, dueDate, priority };
    if (mode === 'department') data.bulkDepartment = bulkDept;
    else data.assignedTo = selectedEmp!._id;

    apiCallFunction({
      url: `${API_BASE_URL}/tasks`, method: 'POST', data,
      thenFn: onSaved, finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg space-y-5 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{editing ? 'Edit Task' : 'Assign Task'}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-foreground/40 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle (only for new tasks) */}
        {!editing && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {(['single', 'department'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn('flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors capitalize flex items-center justify-center gap-1.5',
                  mode === m ? 'bg-white text-primary shadow-sm' : 'text-foreground/50 hover:text-foreground')}>
                {m === 'single' ? <><Circle className="h-3 w-3" /> Single Employee</> : <><Users className="h-3 w-3" /> Whole Department</>}
              </button>
            ))}
          </div>
        )}

        {/* Employee / Department selector */}
        {!editing && (
          mode === 'single' ? (
            <div className="relative">
              <label className="text-xs text-foreground/60 font-medium block mb-1">Employee *</label>
              <input value={empSearch} onChange={e => { setEmpSearch(e.target.value); setSelectedEmp(null); }}
                placeholder="Search by name or staff number…"
                className="w-full h-9 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              {showDropdown && employees.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border shadow-lg z-10 max-h-48 overflow-y-auto">
                  {employees.map(e => (
                    <button key={e._id} onClick={() => { setSelectedEmp(e); setEmpSearch(e.fullName); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary/5 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{e.fullName}</span>
                      <span className="text-xs text-foreground/40">{e.department}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedEmp && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {selectedEmp.fullName} · {selectedEmp.department}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60 font-medium">Department *</label>
              <input value={bulkDept} onChange={e => setBulkDept(e.target.value)}
                placeholder="e.g. Technology, Finance, HR…"
                className="h-9 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <p className="text-xs text-foreground/40">Task will be assigned to every active employee in this department.</p>
            </div>
          )
        )}

        {/* Task details */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60 font-medium">Task Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Submit monthly report, Complete safety training…"
            className="h-9 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60 font-medium">Description</label>
          <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
            placeholder="Additional details or instructions…"
            className="border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60 font-medium">Due Date *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="h-9 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60 font-medium">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
              className="h-9 border rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button onClick={onClose} className="text-xs text-foreground/40 hover:text-foreground px-4 py-2 rounded-xl">Cancel</button>
          <button onClick={save} disabled={saving || !title || !dueDate || (!editing && mode === 'single' && !selectedEmp) || (!editing && mode === 'department' && !bulkDept)}
            className="text-sm font-semibold bg-primary text-white px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90">
            {saving ? 'Saving…' : editing ? 'Save Changes' : mode === 'department' ? 'Assign to Department' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
