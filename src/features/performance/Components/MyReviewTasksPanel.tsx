'use client';

import { useState } from 'react';
import { Loader2, ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyReviewTasks } from '../Hooks/useMyReviewTasks';
import { ReviewForm } from './ReviewForm';
import type { MyReviewTask } from '../constants';

export function MyReviewTasksPanel() {
  const { tasks, loading, refetch } = useMyReviewTasks();
  const [active, setActive] = useState<MyReviewTask | null>(null);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-brand-primary" /></div>;
  }
  if (tasks.length === 0) return null;

  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardCheck className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-brand-text">My Reviews</h3>
        <span className="text-xs text-brand-text-muted">{tasks.filter(t => t.status !== 'submitted').length} pending</span>
      </div>
      <div className="divide-y divide-brand-border">
        {tasks.map((t) => {
          const done = t.status === 'submitted';
          return (
            <button
              key={`${t.cycleId}-${t.employeeId}-${t.reviewType}`}
              onClick={() => setActive(t)}
              className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-brand-bg-soft/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 text-brand-text-muted shrink-0" />}
                <div>
                  <p className="text-sm font-medium text-brand-text">
                    {t.reviewType === 'self' ? 'Your self-review'
                      : t.reviewType === 'peer' ? `Peer review — ${t.employee?.fullName ?? 'Employee'}`
                      : `Manager review — ${t.employee?.fullName ?? 'Employee'}`}
                  </p>
                  <p className="text-xs text-brand-text-muted">{t.cycleName}</p>
                </div>
              </div>
              <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-bg-muted text-brand-text-secondary')}>
                {done ? 'Submitted' : 'Pending'}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <ReviewForm
          task={active}
          onClose={() => setActive(null)}
          onSubmitted={() => { setActive(null); refetch(); }}
        />
      )}
    </div>
  );
}
