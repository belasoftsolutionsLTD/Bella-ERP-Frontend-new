'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock, Pencil, Trash2, X, Save, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { OnboardingTask } from '../Hooks/useOnboarding';

interface Props {
  task: OnboardingTask;
  onComplete?: (id: string) => void;
  onUpdated?: () => void;
  onDeleted?: (id: string) => void;
}

const STATUS_ICONS = {
  completed:   { icon: CheckCircle2, color: 'text-emerald-500' },
  in_progress: { icon: Clock,        color: 'text-amber-500'   },
  pending:     { icon: Circle,       color: 'text-gray-400'    },
} as const;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed',
};

export function TaskItem({ task, onComplete, onUpdated, onDeleted }: Props) {
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [form, setForm] = useState({
    taskTitle:          task.taskTitle,
    assignedDepartment: task.assignedDepartment,
    dueDate:            task.dueDate?.slice(0, 10) ?? '',
    description:        task.notes ?? '',
  });

  const { icon: Icon, color } = STATUS_ICONS[task.status] ?? STATUS_ICONS.pending;

  const handleSave = async () => {
    if (!form.taskTitle.trim()) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/tasks/${task._id}`,
      method: 'PUT',
      data: form,
      thenFn: () => { setEditing(false); onUpdated?.(); },
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/tasks/${task._id}`,
      method: 'DELETE',
      thenFn: () => onDeleted?.(task._id),
    });
    setDeleting(false);
  };

  const handleStatusChange = async (status: string) => {
    setShowStatus(false);
    if (status === task.status) return;
    if (status === 'completed') { onComplete?.(task._id); return; }
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/tasks/${task._id}`,
      method: 'PUT',
      data: { status },
      thenFn: () => onUpdated?.(),
      showToast: false,
    });
  };

  const inputCls = 'w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30';

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
        <p className="text-xs font-bold text-primary uppercase tracking-wide">Editing task</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.taskTitle} onChange={e => setForm(f => ({ ...f, taskTitle: e.target.value }))}
            placeholder="Task title *" className={`${inputCls} sm:col-span-2`} />
          <input value={form.assignedDepartment} onChange={e => setForm(f => ({ ...f, assignedDepartment: e.target.value }))}
            placeholder="Assigned to" className={inputCls} />
          <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            className={inputCls} />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Notes (optional)" className={`${inputCls} sm:col-span-2`} />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-white">
            <X className="h-3 w-3" /> Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.taskTitle.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-xl border group transition-colors',
      task.status === 'completed' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-white hover:bg-gray-50')}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', color)} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-foreground/40')}>
          {task.taskTitle}
        </p>
        <p className="text-xs text-foreground/40 mt-0.5">
          {task.assignedDepartment} · Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
          {task.notes && ` · ${task.notes}`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Status picker */}
        <div className="relative">
          <button onClick={() => setShowStatus(v => !v)}
            className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium transition-colors',
              task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : task.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-gray-100 text-gray-600 border-gray-200')}>
            {STATUS_LABELS[task.status]}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showStatus && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-10 overflow-hidden min-w-[130px]">
              {(['pending', 'in_progress', 'completed'] as const).map(s => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={cn('w-full text-left text-xs px-3 py-2 hover:bg-gray-50 transition-colors',
                    s === task.status && 'font-semibold text-primary bg-primary/5')}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
          {showStatus && <div className="fixed inset-0 z-0" onClick={() => setShowStatus(false)} />}
        </div>

        {/* Edit */}
        <button onClick={() => { setEditing(true); setConfirmDel(false); setShowStatus(false); }}
          className="p-1.5 text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        {confirmDel ? (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
            <span className="text-xs text-red-600">Delete?</span>
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50">
              {deleting ? '…' : 'Yes'}
            </button>
            <button onClick={() => setConfirmDel(false)} className="text-xs text-foreground/40">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
