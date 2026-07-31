'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, LayoutList, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '../Hooks/useActivities';
import { TaskBoard } from './TaskBoard';
import { TaskCalendarView } from './TaskCalendarView';
import type { TaskPriority } from '../types';

const PRIORITY_CLS: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-500',
};

type ViewMode = 'list' | 'board' | 'calendar';

export function TasksTab() {
  const t = useTranslations('CRM');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<'overdue' | 'upcoming'>('upcoming');
  // list mode uses the overdue/upcoming dashboard filter (incomplete tasks only, same as
  // before); board/calendar need every task (including completed) to have data for all
  // columns/days, so they fetch unfiltered.
  const { tasks, isLoading, completeTask, addSubtask, toggleSubtask } = useTasks(viewMode === 'list' ? filter : undefined);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {viewMode === 'list' ? (
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {(['overdue', 'upcoming'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>
                {t(`tasks.${f}`)}
              </button>
            ))}
          </div>
        ) : <div />}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {([{ mode: 'list', icon: LayoutList }, { mode: 'board', icon: LayoutGrid }, { mode: 'calendar', icon: CalendarIcon }] as const).map(({ mode, icon: Icon }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={cn('h-8 w-8 flex items-center justify-center rounded-md', viewMode === mode ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-slate-600')}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('tasks.noTasks')}</div>
      ) : viewMode === 'board' ? (
        <TaskBoard tasks={tasks} onComplete={completeTask} />
      ) : viewMode === 'calendar' ? (
        <TaskCalendarView tasks={tasks} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task._id} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-slate-800 truncate">{task.subject}</p>
                    {task.priority && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', PRIORITY_CLS[task.priority])}>{t(`tasks.priority.${task.priority}`)}</span>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {task.contact ? `${task.contact.firstName} ${task.contact.lastName}` : ''} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                  </p>
                </div>
                <button onClick={() => completeTask(task._id)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t('tasks.complete')}
                </button>
              </div>

              {task.subtasks && task.subtasks.length > 0 && (
                <div className="pl-1 space-y-1">
                  {task.subtasks.map((s) => (
                    <label key={s._id} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={s.isCompleted} onChange={() => toggleSubtask(task._id, s._id)} />
                      <span className={s.isCompleted ? 'line-through text-slate-400' : ''}>{s.title}</span>
                    </label>
                  ))}
                </div>
              )}

              {addingSubtaskFor === task._id ? (
                <div className="flex items-center gap-1.5 pl-1">
                  <input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} placeholder={t('tasks.subtaskTitle')}
                    className="h-7 flex-1 border border-slate-200 rounded px-2 text-xs" autoFocus />
                  <button onClick={() => { if (subtaskTitle.trim()) { addSubtask(task._id, subtaskTitle.trim()); setSubtaskTitle(''); } setAddingSubtaskFor(null); }}
                    className="text-xs font-semibold text-brand-primary">{t('common.add')}</button>
                </div>
              ) : (
                <button onClick={() => setAddingSubtaskFor(task._id)} className="text-[11px] font-semibold text-brand-primary hover:underline pl-1">
                  + {t('tasks.addSubtask')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
