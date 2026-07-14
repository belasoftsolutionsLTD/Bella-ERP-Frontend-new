'use client';

import { useState } from 'react';
import { Plus, Loader2, Users2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOneOnOnes } from '../Hooks/useOneOnOnes';
import { ScheduleOneOnOneModal } from './ScheduleOneOnOneModal';
import { OneOnOneDetailModal } from './OneOnOneDetailModal';
import type { OneOnOne } from '../constants';

export function OneOnOnesTab() {
  const { oneOnOnes, loading, create } = useOneOnOnes();
  const [showSchedule, setShowSchedule] = useState(false);
  const [viewing, setViewing] = useState<OneOnOne | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const filtered = filter === 'all' ? oneOnOnes : oneOnOnes.filter((o) => o.status === filter);

  const handleCreate = (data: Record<string, unknown>) => {
    setSaving(true);
    create(data, () => { setSaving(false); setShowSchedule(false); }, () => setSaving(false));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">1-on-1s</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">{oneOnOnes.length} meeting{oneOnOnes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-bg-soft border border-brand-border rounded-lg p-0.5 text-xs">
            {(['all', 'scheduled', 'completed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-md font-medium capitalize transition-colors', filter === f ? 'bg-brand-bg-muted text-brand-text' : 'text-brand-text-muted hover:text-brand-text-secondary')}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Schedule 1-on-1
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-4">
          <Users2 className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-brand-text-secondary">No 1-on-1s yet</p>
            <p className="text-sm mt-1">Schedule a recurring check-in with your direct reports.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {filtered.map((o) => {
            const doneCount = o.agendaItems.filter((a) => a.isDone).length;
            return (
              <button key={o._id} onClick={() => setViewing(o)}
                className="text-left bg-brand-bg-soft border border-brand-border rounded-xl p-4 hover:border-brand-border-strong transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-text">{o.manager?.fullName ?? 'Manager'} &amp; {o.employee?.fullName ?? 'Employee'}</p>
                    <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> {new Date(o.scheduledAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0', o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-bg-muted text-brand-text-secondary')}>
                    {o.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                </div>
                {o.agendaItems.length > 0 && (
                  <p className="text-xs text-brand-text-muted mt-2">{doneCount} of {o.agendaItems.length} agenda items done</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showSchedule && (
        <ScheduleOneOnOneModal onClose={() => setShowSchedule(false)} onSave={handleCreate} saving={saving} />
      )}
      {viewing && (
        <OneOnOneDetailModal oneOnOne={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
