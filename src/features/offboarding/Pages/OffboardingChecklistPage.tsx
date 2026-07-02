'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft, CheckCircle2, Circle, Plus, X, ChevronDown, ChevronUp,
  Briefcase, CalendarDays, Users, Clock, CheckSquare, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OffboardingTask } from '../Hooks/useOffboarding';

interface EmployeeInfo {
  _id: string;
  fullName: string;
  staffNumber: string;
  department: string;
  designation?: string;
  contractEndDate?: string;
}

interface SectionDef {
  key: OffboardingTask['taskSection'];
  label: string;
}

const SECTIONS: SectionDef[] = [
  { key: 'before_last_day', label: 'Before Last Day' },
  { key: 'last_day',        label: 'Last Day'         },
  { key: 'after_departure', label: 'After Departure'  },
];

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function TaskItem({ task, onComplete }: { task: OffboardingTask; onComplete: (id: string) => void }) {
  const done    = task.status === 'completed';
  const overdue = !done && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-xl border transition-all',
      done ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-100 hover:border-gray-200'
    )}>
      <button
        onClick={() => !done && onComplete(task._id)}
        disabled={done}
        className={cn('mt-0.5 shrink-0 transition-colors', done ? 'cursor-default text-emerald-500' : 'text-gray-300 hover:text-orange-500')}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', done ? 'line-through text-slate-400' : 'text-slate-800')}>
          {task.taskTitle}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-slate-400">{task.assignedDepartment}</span>
          {task.dueDate && (
            <span className={cn('text-xs font-medium', done ? 'text-slate-400' : overdue ? 'text-red-500' : 'text-slate-400')}>
              · Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
              {overdue && !done && ' (overdue)'}
            </span>
          )}
          {done && task.completedAt && (
            <span className="text-xs text-emerald-600 font-medium">
              · Completed {new Date(task.completedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
            </span>
          )}
        </div>
      </div>

      {!done && (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
          overdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600')}>
          {overdue ? 'Overdue' : 'Pending'}
        </span>
      )}
    </div>
  );
}

function TaskSectionBlock({ sectionDef, tasks, onComplete }: {
  sectionDef: SectionDef;
  tasks: OffboardingTask[];
  onComplete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const done   = tasks.filter(t => t.status === 'completed').length;
  const allDone = done === tasks.length && tasks.length > 0;

  if (tasks.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={cn('text-sm font-semibold', allDone ? 'text-emerald-600' : 'text-slate-700')}>
            {sectionDef.label}
          </span>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
            allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600')}>
            {done}/{tasks.length}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="p-3 space-y-2 bg-white">
          {tasks.map(t => <TaskItem key={t._id} task={t} onComplete={onComplete} />)}
        </div>
      )}
    </div>
  );
}

export default function OffboardingChecklistPage({ employeeId }: { employeeId: string }) {
  const locale = useLocale();
  const [tasks, setTasks]       = useState<OffboardingTask[]>([]);
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask]   = useState({ taskTitle: '', assignedDepartment: 'HR', dueDate: '', taskSection: 'before_last_day' as OffboardingTask['taskSection'] });
  const [saving, setSaving]     = useState(false);

  const loadTasks = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/offboarding/${employeeId}`,
      showToast: false,
      thenFn: r => setTasks(r.data ?? []),
    });
  }, [employeeId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(res => apiCallFunction<any>({
        url: `${API_BASE_URL}/hr/offboarding/${employeeId}`,
        showToast: false,
        thenFn: r => { setTasks(r.data ?? []); res(); },
        catchFn: () => res(),
      })),
      new Promise<void>(res => apiCallFunction<any>({
        url: `${API_BASE_URL}/employees/${employeeId}`,
        showToast: false,
        thenFn: r => { setEmployee(r.data ?? null); res(); },
        catchFn: () => res(),
      })),
    ]).finally(() => setLoading(false));
  }, [employeeId]);

  const handleComplete = (taskId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/offboarding/tasks/${taskId}`,
      method: 'PATCH',
      showToast: false,
      thenFn: () => {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t));
        toast.success('Task marked complete.');
      },
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.taskTitle.trim() || !newTask.dueDate) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/offboarding/${employeeId}/tasks`,
      method: 'POST',
      data: newTask,
      thenFn: () => {
        toast.success('Task added.');
        setNewTask({ taskTitle: '', assignedDepartment: 'HR', dueDate: '', taskSection: 'before_last_day' });
        setShowAddForm(false);
        loadTasks();
      },
    });
    setSaving(false);
  };

  const totalDone = tasks.filter(t => t.status === 'completed').length;
  const pct = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;
  const initials = employee?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const color    = employee ? avatarColor(employee.fullName) : AVATAR_COLORS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/offboarding`}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Offboarding
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700 truncate">{employee?.fullName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* ── Left: Tasks ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Progress header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Exit Checklist</h2>
              <span className={cn('text-sm font-bold', pct === 100 ? 'text-emerald-600' : 'text-orange-600')}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-orange-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{totalDone} of {tasks.length} tasks completed</p>

            {/* Section pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {SECTIONS.map(s => {
                const sectionTasks = tasks.filter(t => t.taskSection === s.key);
                if (!sectionTasks.length) return null;
                const done = sectionTasks.filter(t => t.status === 'completed').length;
                const all  = sectionTasks.length;
                const full = done === all;
                return (
                  <span key={s.key} className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                    full ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                  )}>
                    {full ? <CheckSquare className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {s.label} ({done}/{all})
                  </span>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Task
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddTask} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Task</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={newTask.taskTitle}
                  onChange={e => setNewTask(f => ({ ...f, taskTitle: e.target.value }))}
                  placeholder="Task title *"
                  required
                  className="sm:col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  value={newTask.taskSection}
                  onChange={e => setNewTask(f => ({ ...f, taskSection: e.target.value as OffboardingTask['taskSection'] }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                >
                  {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <input
                  value={newTask.assignedDepartment}
                  onChange={e => setNewTask(f => ({ ...f, assignedDepartment: e.target.value }))}
                  placeholder="Assigned to"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(f => ({ ...f, dueDate: e.target.value }))}
                  required
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-60 font-semibold transition-colors">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Task sections */}
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed rounded-2xl">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No tasks yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {SECTIONS.map(s => (
                <TaskSectionBlock
                  key={s.key}
                  sectionDef={s}
                  tasks={tasks.filter(t => t.taskSection === s.key)}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Employee card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', color)}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{employee?.fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{employee?.staffNumber}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {employee?.department && (
                <div className="flex items-start gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Department</p>
                    <p className="text-xs font-medium text-slate-700">{employee.department}</p>
                  </div>
                </div>
              )}
              {employee?.designation && (
                <div className="flex items-start gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Designation</p>
                    <p className="text-xs font-medium text-slate-700">{employee.designation}</p>
                  </div>
                </div>
              )}
              {employee?.contractEndDate && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Last Working Day</p>
                    <p className="text-xs font-medium text-red-600">
                      {new Date(employee.contractEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress by Phase</p>
            {SECTIONS.map(s => {
              const sectionTasks = tasks.filter(t => t.taskSection === s.key);
              if (!sectionTasks.length) return null;
              const done = sectionTasks.filter(t => t.status === 'completed').length;
              const all  = sectionTasks.length;
              const pct  = all ? Math.round((done / all) * 100) : 0;
              return (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{s.label}</span>
                    <span className="text-slate-400">{done}/{all}</span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-orange-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
