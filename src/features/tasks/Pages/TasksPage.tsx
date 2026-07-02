'use client';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  Plus, Search, Trash2, Pencil, X, CheckCircle2, Circle, Clock, Ban,
  AlertTriangle, ChevronRight, ChevronLeft,
  LayoutGrid, LayoutList, Calendar, CalendarCheck, BarChart2,
  Users, User, FileText, Wrench, ClipboardCheck, Shield,
  ListChecks, RefreshCcw, Loader2, BookOpen,
  Play,
} from 'lucide-react';
import type {
  Task, TaskStatus, TaskPriority, TaskType, TaskModule,
  TaskTemplate, Employee, TaskStats,
} from '../types';
import TaskDetailDrawer from '../Components/TaskDetailDrawer';
import TaskBoard from '../Components/TaskBoard';
import TaskAnalytics from '../Components/TaskAnalytics';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TaskStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  not_started: { label: 'Not Started', color: 'text-slate-400 bg-slate-800',  dot: 'bg-slate-500',   icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-indigo-300 bg-indigo-900/40', dot: 'bg-indigo-500',icon: Clock },
  completed:   { label: 'Completed',   color: 'text-emerald-400 bg-emerald-900/40',dot:'bg-emerald-500',icon: CheckCircle2 },
  overdue:     { label: 'Overdue',     color: 'text-red-400 bg-red-900/30',   dot: 'bg-red-500',     icon: AlertTriangle },
  blocked:     { label: 'Blocked',     color: 'text-slate-500 bg-slate-800',  dot: 'bg-slate-600',   icon: Ban },
};
const PRIORITY_DOT: Record<TaskPriority, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-slate-500' };
const TYPE_CFG: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  action:    { label: 'Action',    icon: ClipboardCheck, color: 'text-blue-400' },
  document:  { label: 'Document',  icon: FileText,       color: 'text-purple-400' },
  form:      { label: 'Form',      icon: ListChecks,     color: 'text-pink-400' },
  meeting:   { label: 'Meeting',   icon: CalendarCheck,  color: 'text-green-400' },
  equipment: { label: 'Equipment', icon: Wrench,         color: 'text-orange-400' },
  approval:  { label: 'Approval',  icon: Shield,         color: 'text-amber-400' },
};
const MODULE_LABELS: Record<string, string> = {
  onboarding:'Onboarding', offboarding:'Offboarding', hr:'HR',
  it:'IT', performance:'Performance', general:'General',
  new_hire:'New Hire', probation_end:'Probation', role_change:'Role Change',
};
const MODULES = Object.entries(MODULE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const fmtDateShort = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : '';

type ViewMode = 'list' | 'board' | 'calendar';
type TabId    = 'my' | 'team' | 'all' | 'templates' | 'analytics';

// ── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({
  task, onOpen, onComplete, onDelete,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const scfg = STATUS_CFG[task.status] ?? STATUS_CFG.not_started;
  const tcfg = TYPE_CFG[task.type];
  const TIcon = tcfg?.icon ?? ClipboardCheck;
  const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={cn('group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer',
      isOverdue ? 'bg-[#2d1515] hover:bg-[#3a1818]' : 'hover:bg-slate-800/50')}
      onClick={() => onOpen(task)}>
      {/* Complete toggle */}
      <button
        onClick={e => { e.stopPropagation(); if (task.status !== 'completed') onComplete(task); }}
        className={cn('h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-indigo-500')}>
        {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
      </button>

      {/* Priority dot */}
      <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-500')} />

      {/* Title */}
      <p className={cn('flex-1 text-sm font-medium min-w-0 truncate',
        task.status === 'completed' ? 'line-through text-slate-600' : 'text-slate-200')}>
        {task.title}
      </p>

      {/* Type badge */}
      {tcfg && (
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg shrink-0">
          <TIcon className={cn('h-3 w-3', tcfg.color)} /> {tcfg.label}
        </span>
      )}

      {/* Context badge */}
      {task.linkedEmployeeName && (
        <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg shrink-0 max-w-[100px] truncate">
          <User className="h-3 w-3 shrink-0" /> {task.linkedEmployeeName}
        </span>
      )}

      {/* Assignee */}
      {task.assignedToName && (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <div className="h-6 w-6 rounded-full bg-indigo-900/60 flex items-center justify-center text-[9px] font-bold text-indigo-400 shrink-0">
            {task.assignedToName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 max-w-[80px] truncate">{task.assignedToName.split(' ')[0]}</span>
        </div>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className={cn('text-xs shrink-0', isOverdue ? 'text-red-400' : 'text-slate-500')}>
          {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
          {fmtDateShort(task.dueDate)}
        </span>
      )}

      {/* Status badge */}
      <span className={cn('hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', scfg.color)}>
        {task.status.replace('_', ' ')}
      </span>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
        <button onClick={() => onOpen(task)} title="Edit"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/30 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {task.status !== 'completed' && (
          <button onClick={() => onComplete(task)} title="Mark complete"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => onDelete(task._id)} title="Delete"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Grouped list ──────────────────────────────────────────────────────────────
function GroupedTaskList({
  tasks, onOpen, onComplete, onDelete,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['completed']));
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eow   = new Date(today); eow.setDate(today.getDate() + (6 - today.getDay()));

  const groups: { id: string; label: string; color: string; tasks: Task[] }[] = [
    {
      id: 'overdue', label: 'Overdue', color: 'text-red-400',
      tasks: tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < today)),
    },
    {
      id: 'today', label: 'Due Today', color: 'text-amber-400',
      tasks: tasks.filter(t => t.status !== 'overdue' && t.status !== 'completed' && t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= today),
    },
    {
      id: 'week', label: 'Due This Week', color: 'text-indigo-400',
      tasks: tasks.filter(t => t.status !== 'overdue' && t.status !== 'completed' && t.dueDate && new Date(t.dueDate) > today && new Date(t.dueDate) <= eow),
    },
    {
      id: 'upcoming', label: 'Upcoming', color: 'text-slate-300',
      tasks: tasks.filter(t => t.status !== 'overdue' && t.status !== 'completed' && (!t.dueDate || new Date(t.dueDate) > eow)),
    },
    {
      id: 'completed', label: 'Completed', color: 'text-emerald-400',
      tasks: tasks.filter(t => t.status === 'completed'),
    },
  ].filter(g => g.tasks.length > 0);

  if (tasks.length === 0) {
    return (
      <div className="py-20 text-center">
        <ListChecks className="h-12 w-12 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(g => {
        const open = !collapsed.has(g.id);
        return (
          <div key={g.id}>
            <button
              onClick={() => setCollapsed(p => { const n = new Set(p); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
              className="flex items-center gap-2 mb-2 w-full text-left">
              <ChevronRight className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-90')} />
              <span className={cn('text-sm font-semibold', g.color)}>{g.label}</span>
              <span className="text-xs text-slate-600 bg-slate-800 rounded-full px-2 py-0.5">{g.tasks.length}</span>
            </button>
            {open && (
              <div className="space-y-0.5 ml-1">
                {g.tasks.map(t => (
                  <TaskRow key={t._id} task={t} onOpen={onOpen} onComplete={onComplete} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Employee-grouped list ─────────────────────────────────────────────────────
function EmployeeGroupedList({
  tasks, onOpen, onComplete, onDelete,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.assignedToName || 'Unassigned';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) =>
    a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b));

  if (tasks.length === 0) return (
    <div className="py-20 text-center">
      <ListChecks className="h-12 w-12 text-slate-700 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">No tasks match your filters.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {sortedKeys.map(emp => {
        const empTasks = grouped[emp];
        const isOpen   = !collapsed.has(emp);
        const initials = emp === 'Unassigned' ? '?' : emp.slice(0, 2).toUpperCase();
        const open     = empTasks.filter(t => t.status !== 'completed').length;
        const overdue  = empTasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length;
        return (
          <div key={emp} className="rounded-2xl border border-slate-700/60 bg-[#1e293b] overflow-hidden">
            <button
              onClick={() => setCollapsed(p => { const n = new Set(p); n.has(emp) ? n.delete(emp) : n.add(emp); return n; })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-900/50 border border-indigo-700/40 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                {initials}
              </div>
              <span className="font-semibold text-slate-200 flex-1 text-sm">{emp}</span>
              {overdue > 0 && (
                <span className="text-[10px] text-red-400 bg-red-900/30 border border-red-700/30 rounded-full px-2 py-0.5 font-semibold shrink-0 flex items-center gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" /> {overdue} overdue
                </span>
              )}
              {open > 0 && (
                <span className="text-[10px] text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-full px-2 py-0.5 font-semibold shrink-0">
                  {open} open
                </span>
              )}
              <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5 shrink-0">{empTasks.length} total</span>
              <ChevronRight className={cn('h-4 w-4 text-slate-500 transition-transform shrink-0', isOpen && 'rotate-90')} />
            </button>
            {isOpen && (
              <div className="border-t border-slate-700/40 space-y-0.5 p-1">
                {empTasks.map(t => (
                  <TaskRow key={t._id} task={t} onOpen={onOpen} onComplete={onComplete} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar view ──────────────────────────────────────────────────────────────
function CalendarView({ tasks }: { tasks: Task[] }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const year  = month.getFullYear();
  const mon   = month.getMonth();
  const days  = new Date(year, mon + 1, 0).getDate();
  const firstDay = new Date(year, mon, 1).getDay(); // 0=Sun
  const taskMap: Record<string, Task[]> = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    const key = t.dueDate.slice(0, 10);
    if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(t);
  });
  const todayStr = new Date().toISOString().slice(0, 10);
  const cells = Array.from({ length: firstDay }).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  return (
    <div className="bg-slate-800/30 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <button onClick={() => setMonth(new Date(year, mon - 1, 1))} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-200">
          {month.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => setMonth(new Date(year, mon + 1, 1))} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-800">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-px bg-slate-800">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="bg-[#0f172a] min-h-[80px]" />;
          const dateKey = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = taskMap[dateKey] || [];
          const isToday  = dateKey === todayStr;
          return (
            <div key={dateKey} className="bg-[#0f172a] min-h-[80px] p-1.5 relative">
              <span className={cn('text-xs font-semibold inline-flex h-6 w-6 items-center justify-center rounded-full',
                isToday ? 'bg-indigo-600 text-white' : 'text-slate-500')}>
                {day as number}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t._id} className={cn('text-[9px] px-1 py-0.5 rounded truncate leading-tight',
                    t.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
                    t.status === 'overdue'   ? 'bg-[#2d1515] text-red-400' :
                    'bg-indigo-900/40 text-indigo-300')}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[9px] text-slate-600 pl-1">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Create Task Modal ──────────────────────────────────────────────────────────
function CreateTaskModal({
  onClose, onCreated, defaultEmployeeId, defaultEmployeeName,
}: {
  onClose: () => void;
  onCreated: () => void;
  defaultEmployeeId?: string;
  defaultEmployeeName?: string;
}) {
  const [form, setForm] = useState({
    title: '', type: 'action' as TaskType, priority: 'medium' as TaskPriority,
    module: 'general' as TaskModule, dueDate: '', description: '',
    linkedEmployeeName: defaultEmployeeName || '', linkedEmployeeId: defaultEmployeeId || '',
  });
  const [assignees, setAssignees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [empOpen, setEmpOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [linkSearch, setLinkSearch] = useState(defaultEmployeeName || '');
  const [linkResults, setLinkResults] = useState<Employee[]>([]);
  const [showLinkDrop, setShowLinkDrop] = useState(false);

  const searchEmps = useCallback((q: string, setter: (e: Employee[]) => void) => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/employees/search?q=${encodeURIComponent(q)}&limit=8`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setter((r.data || []) as Employee[]),
    });
  }, []);

  useEffect(() => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/employees/search?q=&limit=100`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setAllEmployees((r.data || []) as Employee[]),
    });
    searchEmps('', setLinkResults);
  }, [searchEmps]);

  const filteredEmployees = empSearch.trim().length > 0
    ? allEmployees.filter(e =>
        e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
        (e.department ?? '').toLowerCase().includes(empSearch.toLowerCase()))
    : [];

  const toggleAssignee = (emp: Employee) => {
    setAssignees(prev =>
      prev.find(a => a._id === emp._id)
        ? prev.filter(a => a._id !== emp._id)
        : [...prev, emp]);
  };

  const save = () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const isMulti = assignees.length > 1;
    apiCallFunction({
      url: `${API_BASE_URL}/tasks`,
      method: 'POST',
      data: {
        title: form.title, type: form.type, priority: form.priority,
        module: form.module, dueDate: form.dueDate || undefined,
        description: form.description || undefined,
        ...(isMulti
          ? { assignedToIds: assignees.map(a => a._id) }
          : { assignedTo: assignees[0]?._id, assignedToName: assignees[0]?.fullName }),
        linkedEmployeeId: form.linkedEmployeeId || undefined,
        linkedEmployeeName: form.linkedEmployeeName || undefined,
      },
      thenFn: () => { onCreated(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100">Create Task</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Task title…" autoFocus
              className="w-full h-10 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as TaskType }))}
                className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Module + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Module</label>
              <select value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value as TaskModule }))}
                className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Assign to employee(s) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">
              Assign To
              {assignees.length >= 2 && (
                <span className="ml-2 text-indigo-400 font-semibold normal-case">· Team Task ({assignees.length} people)</span>
              )}
            </label>
            {/* Selected chips + add button */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {assignees.map(a => (
                <div key={a._id} className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-900/30 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  <User className="h-3 w-3" /> {a.fullName}
                  <button type="button" onClick={() => toggleAssignee(a)} className="text-slate-500 hover:text-red-400 ml-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {!empOpen && (
                <button type="button" onClick={() => setEmpOpen(true)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 border border-dashed border-slate-700 hover:border-indigo-500 px-2.5 py-1 rounded-full transition-colors">
                  <Plus className="h-3 w-3" /> {assignees.length === 0 ? 'Add people' : 'Add more'}
                </button>
              )}
            </div>
            {/* Search + list — only shown when open */}
            {empOpen && (
              <div className="mt-2">
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                  placeholder="Search employees…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { setEmpOpen(false); setEmpSearch(''); } }}
                  className="w-full h-9 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 mb-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
                <div className="max-h-44 overflow-y-auto bg-slate-800/60 border border-slate-700 rounded-xl divide-y divide-slate-700/50">
                  {filteredEmployees.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-600 text-center">
                      {empSearch.trim().length === 0 ? 'Type a name to search employees' : 'No employees found'}
                    </p>
                  )}
                  {filteredEmployees.map(e => {
                    const checked = !!assignees.find(a => a._id === e._id);
                    return (
                      <label key={e._id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={() => toggleAssignee(e)}
                          className="h-4 w-4 rounded accent-indigo-500 shrink-0" />
                        <div className="h-6 w-6 rounded-full bg-indigo-900/60 flex items-center justify-center text-[9px] font-bold text-indigo-400 shrink-0">
                          {e.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-200 font-medium truncate">{e.fullName}</p>
                          {e.department && <p className="text-[10px] text-slate-500 truncate">{e.department}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <button type="button" onClick={() => { setEmpOpen(false); setEmpSearch(''); }}
                  className="mt-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-1">
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Linked employee (context) */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Context Employee (optional)</label>
            <input value={linkSearch} onChange={e => { setLinkSearch(e.target.value); searchEmps(e.target.value, setLinkResults); setShowLinkDrop(true); }}
              onFocus={() => setShowLinkDrop(true)}
              placeholder="e.g. new hire being onboarded…"
              className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
            {form.linkedEmployeeName && (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg">
                <User className="h-3.5 w-3.5 text-slate-500" /> {form.linkedEmployeeName}
                <button onClick={() => setForm(p => ({ ...p, linkedEmployeeId: '', linkedEmployeeName: '' }))} className="ml-auto text-slate-500 hover:text-red-400"><X className="h-3 w-3" /></button>
              </div>
            )}
            {showLinkDrop && linkResults.length > 0 && !form.linkedEmployeeName && (
              <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {linkResults.map(e => (
                  <button key={e._id} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 text-left"
                    onMouseDown={() => { setForm(p => ({ ...p, linkedEmployeeId: e._id, linkedEmployeeName: e.fullName })); setLinkSearch(''); setShowLinkDrop(false); }}>
                    <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">
                      {e.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-200 font-medium">{e.fullName}</p>
                      <p className="text-[10px] text-slate-500">{e.department}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Optional details…"
              className="w-full text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({
  search, status, priority, module: mod, onSearch, onStatus, onPriority, onModule, onClear,
}: {
  search: string; status: string; priority: string; module: string;
  onSearch: (v: string) => void; onStatus: (v: string) => void;
  onPriority: (v: string) => void; onModule: (v: string) => void; onClear: () => void;
}) {
  const hasFilter = status || priority || mod || search;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
        <input value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search tasks…"
          className="w-full h-9 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
      </div>
      <select value={status} onChange={e => onStatus(e.target.value)}
        className="h-9 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">All Status</option>
        {(Object.keys(STATUS_CFG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
      </select>
      <select value={priority} onChange={e => onPriority(e.target.value)}
        className="h-9 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select value={mod} onChange={e => onModule(e.target.value)}
        className="h-9 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">All Modules</option>
        {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      {hasFilter && (
        <button onClick={onClear} className="h-9 px-3 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 hover:border-slate-500 transition-colors">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}

// ── Templates Tab ─────────────────────────────────────────────────────────────
function TemplatesTab({ onApply }: { onApply?: () => void }) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [applyModal, setApplyModal] = useState<TaskTemplate | null>(null);
  const [empSearch, setEmpSearch]   = useState('');
  const [empResults, setEmpResults] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [refDate, setRefDate]       = useState('');
  const [applying, setApplying]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: '', description: '', triggerEvent: 'manual' });
  const [newTasks, setNewTasks] = useState([{ title: '', type: 'action', priority: 'medium', dueOffset: 0 }]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/templates`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setTemplates((r.data || []) as TaskTemplate[]),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const searchEmps = (q: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/employees/search?q=${encodeURIComponent(q)}&limit=8`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setEmpResults((r.data || []) as Employee[]),
    });
  };

  const doApply = () => {
    if (!applyModal || !selectedEmp || !refDate) return;
    setApplying(true);
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/templates/${applyModal._id}/apply`,
      method: 'POST',
      data: { employeeId: selectedEmp._id, referenceDate: refDate },
      thenFn: () => { setApplyModal(null); setSelectedEmp(null); setRefDate(''); setEmpSearch(''); onApply?.(); },
      finallyFn: () => setApplying(false),
    });
  };

  const triggerLabels: Record<string, string> = {
    hire_date: 'On Hire Date', termination_date: 'On Termination Date',
    probation_end_date: 'On Probation End', manual: 'Manual Trigger',
  };

  const doCreate = () => {
    if (!newTpl.name.trim()) return;
    setCreating(true);
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/templates`,
      method: 'POST',
      data: {
        name: newTpl.name.trim(),
        description: newTpl.description,
        triggerEvent: newTpl.triggerEvent,
        tasks: newTasks.filter(t => t.title.trim()).map(t => ({
          title: t.title.trim(),
          type: t.type,
          priority: t.priority,
          dueOffset: { direction: 'after', days: Number(t.dueOffset) || 0 },
        })),
      },
      thenFn: (r: any) => {
        setTemplates(prev => [r.data, ...prev]);
        setShowCreate(false);
        setNewTpl({ name: '', description: '', triggerEvent: 'manual' });
        setNewTasks([{ title: '', type: 'action', priority: 'medium', dueOffset: 0 }]);
      },
      finallyFn: () => setCreating(false),
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Create Template
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(tpl => (
          <div key={tpl._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-900/50 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-200 leading-snug">{tpl.name}</h3>
                {tpl.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.description}</p>}
              </div>
              {tpl.isDefault && (
                <span className="text-[10px] text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-full font-semibold shrink-0">Default</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                {triggerLabels[tpl.triggerEvent] ?? tpl.triggerEvent}
              </span>
              <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                {tpl.tasks.length} tasks
              </span>
              {tpl.sections.length > 0 && (
                <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                  {tpl.sections.length} sections
                </span>
              )}
              <span className={cn('px-2 py-0.5 rounded', tpl.isActive ? 'text-emerald-400 bg-emerald-900/30' : 'text-slate-600 bg-slate-900')}>
                {tpl.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button onClick={() => { setApplyModal(tpl); searchEmps(''); }}
              className="mt-auto flex items-center justify-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors">
              <Play className="h-3.5 w-3.5" /> Apply to Employee
            </button>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <BookOpen className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No templates found.</p>
          </div>
        )}
      </div>

      {/* Apply template modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setApplyModal(null)} />
          <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-100">Apply: {applyModal.name}</h2>
              <button onClick={() => setApplyModal(null)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Employee search */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Employee *</label>
                {selectedEmp ? (
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 px-3 py-2 rounded-xl">
                    <User className="h-4 w-4 text-slate-500" /> {selectedEmp.fullName}
                    <button onClick={() => setSelectedEmp(null)} className="ml-auto"><X className="h-3 w-3 text-slate-500 hover:text-red-400" /></button>
                  </div>
                ) : (
                  <>
                    <input value={empSearch} onChange={e => { setEmpSearch(e.target.value); searchEmps(e.target.value); }}
                      placeholder="Search employee…" autoFocus
                      className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
                    {empResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        {empResults.map(e => (
                          <button key={e._id} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700"
                            onMouseDown={() => { setSelectedEmp(e); setEmpSearch(''); }}>
                            <div className="h-6 w-6 rounded-full bg-indigo-900/60 text-[9px] font-bold text-indigo-400 flex items-center justify-center">
                              {e.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-slate-200 font-medium">{e.fullName}</p>
                              <p className="text-[10px] text-slate-500">{e.department}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Reference Date *</label>
                <input type="date" value={refDate} onChange={e => setRefDate(e.target.value)}
                  className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <p className="text-[10px] text-slate-600 mt-1">e.g. hire date, termination date, or probation end date</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">{applyModal.tasks.length} tasks will be created:</p>
                {applyModal.tasks.slice(0, 4).map(t => (
                  <p key={t._id ?? t.title} className="text-slate-500">• {t.title}</p>
                ))}
                {applyModal.tasks.length > 4 && <p className="text-slate-600">…and {applyModal.tasks.length - 4} more</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button onClick={() => setApplyModal(null)} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2">Cancel</button>
              <button onClick={doApply} disabled={applying || !selectedEmp || !refDate}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-bold text-slate-100">Create Task Template</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Template Name *</label>
                <input value={newTpl.name} onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Onboarding Checklist"
                  className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Description</label>
                <textarea value={newTpl.description} onChange={e => setNewTpl(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Optional description…"
                  className="w-full text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">Trigger Event</label>
                <select value={newTpl.triggerEvent} onChange={e => setNewTpl(p => ({ ...p, triggerEvent: e.target.value }))}
                  className="w-full h-10 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="manual">Manual Trigger</option>
                  <option value="hire_date">On Hire Date</option>
                  <option value="termination_date">On Termination Date</option>
                  <option value="probation_end_date">On Probation End</option>
                </select>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tasks</label>
                  <button onClick={() => setNewTasks(p => [...p, { title: '', type: 'action', priority: 'medium', dueOffset: 0 }])}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>
                <div className="space-y-3">
                  {newTasks.map((t, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={t.title} onChange={e => setNewTasks(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                          placeholder={`Task ${i + 1} title…`}
                          className="flex-1 h-8 text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
                        {newTasks.length > 1 && (
                          <button onClick={() => setNewTasks(p => p.filter((_, j) => j !== i))}><X className="h-4 w-4 text-slate-600 hover:text-red-400" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select value={t.type} onChange={e => setNewTasks(p => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                          className="h-7 text-[11px] text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-1 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                          <option value="action">Action</option>
                          <option value="document">Document</option>
                          <option value="training">Training</option>
                          <option value="review">Review</option>
                          <option value="meeting">Meeting</option>
                        </select>
                        <select value={t.priority} onChange={e => setNewTasks(p => p.map((x, j) => j === i ? { ...x, priority: e.target.value } : x))}
                          className="h-7 text-[11px] text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-1 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <div className="relative">
                          <input type="number" min={0} value={t.dueOffset}
                            onChange={e => setNewTasks(p => p.map((x, j) => j === i ? { ...x, dueOffset: Number(e.target.value) } : x))}
                            placeholder="Days"
                            className="w-full h-7 text-[11px] text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none">days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
              <button onClick={() => setShowCreate(false)} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2">Cancel</button>
              <button onClick={doCreate} disabled={creating || !newTpl.name.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Generic task list tab (My/Team/All) ────────────────────────────────────────
function TaskListTab({
  endpoint, grouped = false, viewMode, setViewMode, onTaskUpdate, defaultGroupByEmp = false, teamMode = false,
}: {
  endpoint: string;
  grouped?: boolean;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onTaskUpdate: () => void;
  defaultGroupByEmp?: boolean;
  teamMode?: boolean;
}) {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [priority, setPriority]     = useState('');
  const [mod, setMod]               = useState('');
  const [selectedTask, setSelected] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupByEmp, setGroupByEmp] = useState(defaultGroupByEmp);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search)   params.set('search', search);
    if (status)   params.set('status', status);
    if (priority) params.set('priority', priority);
    if (mod)      params.set('module', mod);
    setLoading(true);
    apiCallFunction({
      url: `${API_BASE_URL}${endpoint}${params.toString() ? '?' + params.toString() : ''}`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => {
        const payload = r.data;
        setTasks(Array.isArray(payload) ? payload : (payload?.data ?? payload?.tasks ?? []));
      },
      finallyFn: () => setLoading(false),
    });
  }, [endpoint, search, status, priority, mod]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = (task: Task) => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/${task._id}/complete`,
      method: 'PUT',
      showToast: true,
      thenFn: () => {
        const updated = { ...task, status: 'completed' as TaskStatus, completedAt: new Date().toISOString() };
        setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
        onTaskUpdate();
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this task?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/${id}`,
      method: 'DELETE',
      thenFn: () => setTasks(prev => prev.filter(t => t._id !== id)),
    });
  };

  const handleOpen = (task: Task) => setSelected(task);

  const handleDrawerUpdate = (updated: Task) => {
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
    setSelected(updated);
    onTaskUpdate();
  };

  const handleBoardStatusChange = (taskId: string, newStatus: TaskStatus) => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/${taskId}/status`,
      method: 'PATCH',
      data: { status: newStatus },
      showToast: true,
      thenFn: () => setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)),
    });
  };

  return (
    <div>
      {/* Team-mode hint */}
      {teamMode && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-900/20 border border-indigo-700/30">
          <Users className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-indigo-400">Team Tasks</span> — tasks assigned to 2 or more people at once.
            Click <span className="font-semibold text-white">+ Assign Task</span> and check multiple employees in the <span className="font-semibold text-white">Assign To</span> list.
          </p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-0">
          <FilterBar
            search={search} status={status} priority={priority} module={mod}
            onSearch={setSearch} onStatus={setStatus} onPriority={setPriority} onModule={setMod}
            onClear={() => { setSearch(''); setStatus(''); setPriority(''); setMod(''); }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Group by employee toggle (list mode only) */}
          {viewMode === 'list' && !grouped && (
            <button
              onClick={() => setGroupByEmp(p => !p)}
              title="Group by employee"
              className={cn(
                'h-9 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-xl border transition-colors',
                groupByEmp
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              )}>
              <Users className="h-3.5 w-3.5" /> By Employee
            </button>
          )}
          {/* View toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
            {([
              { mode: 'list', icon: LayoutList },
              { mode: 'board', icon: LayoutGrid },
              { mode: 'calendar', icon: Calendar },
            ] as { mode: ViewMode; icon: React.ElementType }[]).map(({ mode, icon: Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn('h-8 w-8 flex items-center justify-center rounded-lg transition-colors',
                  viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300')}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors">
            <Plus className="h-4 w-4" /> {teamMode ? 'Assign Task' : 'New Task'}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : viewMode === 'board' ? (
        <TaskBoard tasks={tasks} onOpen={handleOpen} onStatusChange={handleBoardStatusChange} />
      ) : viewMode === 'calendar' ? (
        <CalendarView tasks={tasks} />
      ) : grouped ? (
        <GroupedTaskList tasks={tasks} onOpen={handleOpen} onComplete={handleComplete} onDelete={handleDelete} />
      ) : groupByEmp ? (
        <EmployeeGroupedList tasks={tasks} onOpen={handleOpen} onComplete={handleComplete} onDelete={handleDelete} />
      ) : (
        <div className="space-y-0.5">
          {tasks.length === 0 && (
            <div className="py-20 text-center">
              <ListChecks className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No tasks found.</p>
            </div>
          )}
          {tasks.map(t => (
            <TaskRow key={t._id} task={t} onOpen={handleOpen} onComplete={handleComplete} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelected(null)} onUpdate={handleDrawerUpdate} />
      )}
      {showCreate && (
        <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={() => { load(); onTaskUpdate(); }} />
      )}
    </div>
  );
}

// ── Main TasksPage ─────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>('my');
  const [stats, setStats]         = useState<TaskStats | null>(null);
  const [viewMode, setViewMode]   = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/stats`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setStats(r.data as TaskStats),
    });
  }, [refreshKey]);

  const handleTaskUpdate = () => setRefreshKey(k => k + 1);

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'my',        label: 'My Tasks',   icon: User },
    { id: 'team',      label: 'Team Tasks', icon: Users },
    { id: 'all',       label: 'All Tasks',  icon: ListChecks },
    { id: 'templates', label: 'Templates',  icon: BookOpen },
    { id: 'analytics', label: 'Analytics',  icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
          {stats && (
            <p className="text-sm text-slate-500 mt-1">
              {stats.dueToday > 0 && <span className="text-amber-400 font-semibold">{stats.dueToday} due today</span>}
              {stats.dueToday > 0 && stats.overdue > 0 && <span className="mx-2 text-slate-700">·</span>}
              {stats.overdue > 0 && <span className="text-red-400 font-semibold">{stats.overdue} overdue</span>}
              {stats.dueToday === 0 && stats.overdue === 0 && <span className="text-emerald-400">All caught up</span>}
            </p>
          )}
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-700 text-slate-500 hover:text-slate-200 hover:border-slate-500 transition-colors">
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Stats row ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',      value: stats.total,              color: 'text-slate-300', bg: 'bg-slate-800/60' },
            { label: 'Due Today',  value: stats.dueToday,           color: 'text-amber-400', bg: 'bg-amber-900/20' },
            { label: 'Overdue',    value: stats.overdue,            color: 'text-red-400',   bg: 'bg-red-900/20' },
            { label: 'Done This Week', value: stats.completedThisWeek, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl p-4 border border-slate-800', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-800 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300',
              )}>
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === 'my' && (
          <TaskListTab
            key={`my-${refreshKey}`}
            endpoint="/me/tasks"
            grouped
            viewMode={viewMode}
            setViewMode={setViewMode}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
        {activeTab === 'team' && (
          <TaskListTab
            key={`team-${refreshKey}`}
            endpoint="/tasks/team"
            viewMode={viewMode}
            setViewMode={setViewMode}
            onTaskUpdate={handleTaskUpdate}
            defaultGroupByEmp
            teamMode
          />
        )}
        {activeTab === 'all' && (
          <TaskListTab
            key={`all-${refreshKey}`}
            endpoint="/tasks"
            viewMode={viewMode}
            setViewMode={setViewMode}
            onTaskUpdate={handleTaskUpdate}
            defaultGroupByEmp
          />
        )}
        {activeTab === 'templates' && (
          <TemplatesTab onApply={handleTaskUpdate} />
        )}
        {activeTab === 'analytics' && (
          <TaskAnalytics key={refreshKey} />
        )}
      </div>
    </div>
  );
}
