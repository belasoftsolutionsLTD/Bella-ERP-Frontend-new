'use client';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Circle, Clock, CheckCircle2, Ban, AlertTriangle, GripVertical } from 'lucide-react';
import type { Task, TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; label: string; icon: React.ElementType; color: string; headerBg: string }[] = [
  { status: 'not_started', label: 'Not Started', icon: Circle,        color: 'text-slate-400',   headerBg: 'border-slate-600' },
  { status: 'in_progress', label: 'In Progress', icon: Clock,         color: 'text-indigo-400',  headerBg: 'border-indigo-500' },
  { status: 'completed',   label: 'Completed',   icon: CheckCircle2,  color: 'text-emerald-400', headerBg: 'border-emerald-500' },
  { status: 'blocked',     label: 'Blocked',     icon: Ban,           color: 'text-slate-500',   headerBg: 'border-slate-700' },
];

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-slate-500',
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : '';

function TaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();
  const subtasksDone  = (task.subtasks || []).filter(s => s.isCompleted).length;
  const subtasksTotal = (task.subtasks || []).length;

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task._id); e.dataTransfer.setData('status', task.status); }}
      onClick={() => onOpen(task)}
      className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 cursor-pointer hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-900/20 transition-all select-none group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-slate-700 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2 mb-2">{task.title}</p>

          {task.linkedEmployeeName && (
            <p className="text-[10px] text-slate-500 mb-1.5 truncate">For: {task.linkedEmployeeName}</p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-500')} />
            <span className="text-[10px] text-slate-500 capitalize">{task.priority}</span>

            {task.type && task.type !== 'action' && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded capitalize">{task.type}</span>
            )}

            {task.assignedToName && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[80px]">{task.assignedToName}</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            {subtasksTotal > 0 && (
              <span className="text-[10px] text-slate-500">{subtasksDone}/{subtasksTotal} subtasks</span>
            )}
            {task.dueDate && (
              <span className={cn('text-[10px] ml-auto', isOverdue ? 'text-red-400' : 'text-slate-500')}>
                {isOverdue && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5" />}
                {fmtDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard({
  tasks,
  onOpen,
  onStatusChange,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const [draggingOver, setDraggingOver] = useState<TaskStatus | null>(null);

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDraggingOver(col);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDraggingOver(null);
    const taskId    = e.dataTransfer.getData('taskId');
    const oldStatus = e.dataTransfer.getData('status') as TaskStatus;
    if (taskId && oldStatus !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-240px)] min-w-0 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const Icon      = col.icon;
        const colTasks  = tasks.filter(t => t.status === col.status);
        const isTarget  = draggingOver === col.status;

        return (
          <div
            key={col.status}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={e => handleDrop(e, col.status)}
            className={cn(
              'flex flex-col w-72 shrink-0 rounded-2xl border-2 transition-all',
              isTarget ? 'border-indigo-500/60 bg-indigo-900/10' : 'border-slate-800 bg-slate-900/30',
            )}
          >
            {/* Column header */}
            <div className={cn('flex items-center gap-2 px-4 py-3 border-b-2', col.headerBg)}>
              <Icon className={cn('h-4 w-4', col.color)} />
              <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
              <span className="ml-auto h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-slate-800 text-slate-400 rounded-full">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {colTasks.map(task => (
                <TaskCard key={task._id} task={task} onOpen={onOpen} />
              ))}
              {colTasks.length === 0 && (
                <div className="h-20 flex items-center justify-center">
                  <p className="text-xs text-slate-700">No tasks</p>
                </div>
              )}
              {isTarget && (
                <div className="h-16 border-2 border-dashed border-indigo-500/40 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-indigo-500">Drop here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
