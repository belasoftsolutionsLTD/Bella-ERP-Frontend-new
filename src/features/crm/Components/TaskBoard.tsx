'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Activity, TaskPriority } from '../types';

const PRIORITY_CLS: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-500',
};

type Column = 'overdue' | 'dueToday' | 'upcoming' | 'completed';

function columnFor(task: Activity): Column {
  if (task.completed) return 'completed';
  if (!task.dueDate) return 'upcoming';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'dueToday';
  return 'upcoming';
}

// Deliberately keeps CRM tasks on their existing boolean `completed` field rather than
// importing the HR Tasks engine's 5-state status enum — columns are computed from
// dueDate+completed, not a stored status.
export function TaskBoard({ tasks, onComplete }: { tasks: Activity[]; onComplete: (id: string) => void }) {
  const t = useTranslations('CRM');
  const columns: Column[] = ['overdue', 'dueToday', 'upcoming', 'completed'];
  const grouped: Record<Column, Activity[]> = { overdue: [], dueToday: [], upcoming: [], completed: [] };
  tasks.forEach((task) => grouped[columnFor(task)].push(task));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {columns.map((col) => (
        <div key={col} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 min-h-[120px]">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`tasks.column${col.charAt(0).toUpperCase()}${col.slice(1)}`)} · {grouped[col].length}</p>
          <div className="space-y-2">
            {grouped[col].map((task) => (
              <div key={task._id} className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-1">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-xs font-medium text-slate-800 leading-tight">{task.subject}</p>
                  {task.priority && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', PRIORITY_CLS[task.priority])}>{t(`tasks.priority.${task.priority}`)}</span>}
                </div>
                <p className="text-[10px] text-slate-400">
                  {task.contact ? `${task.contact.firstName} ${task.contact.lastName}` : ''} {task.dueDate ? `· ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                </p>
                {task.subtasks && task.subtasks.length > 0 && (
                  <p className="text-[10px] text-slate-400">{task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} {t('tasks.subtasksLabel')}</p>
                )}
                {col !== 'completed' && (
                  <button onClick={() => onComplete(task._id)} className="text-[10px] font-semibold text-emerald-600 hover:underline">{t('tasks.complete')}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
