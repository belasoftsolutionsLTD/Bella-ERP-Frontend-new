'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '../types';

// Ported from frontend/src/features/tasks/Pages/TasksPage.tsx's CalendarView — same
// month-grid structure, adapted for CRM's Activity/task shape (completed boolean
// instead of a status enum).
export function TaskCalendarView({ tasks }: { tasks: Activity[] }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const year = month.getFullYear();
  const mon = month.getMonth();
  const days = new Date(year, mon + 1, 0).getDate();
  const firstDay = new Date(year, mon, 1).getDay();
  const taskMap: Record<string, Activity[]> = {};
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const key = t.dueDate.slice(0, 10);
    if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(t);
  });
  const todayStr = new Date().toISOString().slice(0, 10);
  const cells = Array.from({ length: firstDay }).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  return (
    <div className="bg-slate-50/30 border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <button onClick={() => setMonth(new Date(year, mon - 1, 1))} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-800">{month.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => setMonth(new Date(year, mon + 1, 1))} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="bg-white min-h-[80px]" />;
          const dateKey = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = taskMap[dateKey] || [];
          const isToday = dateKey === todayStr;
          return (
            <div key={dateKey} className="bg-white min-h-[80px] p-1.5 relative">
              <span className={cn('text-xs font-semibold inline-flex h-6 w-6 items-center justify-center rounded-full', isToday ? 'bg-brand-primary text-white' : 'text-slate-400')}>
                {day as number}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div key={t._id} className={cn('text-[9px] px-1 py-0.5 rounded truncate leading-tight', t.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-primary/10 text-brand-primary')}>
                    {t.subject}
                  </div>
                ))}
                {dayTasks.length > 3 && <p className="text-[9px] text-slate-400 pl-1">+{dayTasks.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
