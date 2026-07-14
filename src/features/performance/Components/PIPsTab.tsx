'use client';

import { useState } from 'react';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePIPs } from '../Hooks/usePIPs';
import { CreatePIPModal } from './CreatePIPModal';
import { PIPDetailModal } from './PIPDetailModal';
import type { PIP } from '../constants';

export function PIPsTab() {
  const { pips, loading, create } = usePIPs();
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<PIP | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = filter === 'all' ? pips : pips.filter((p) => p.status === filter);

  const handleCreate = (data: Record<string, unknown>) => {
    setSaving(true);
    create(data, () => { setSaving(false); setShowCreate(false); }, () => setSaving(false));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Performance Improvement Plans</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">{pips.length} plan{pips.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-bg-soft border border-brand-border rounded-lg p-0.5 text-xs">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-md font-medium capitalize transition-colors', filter === f ? 'bg-brand-bg-muted text-brand-text' : 'text-brand-text-muted hover:text-brand-text-secondary')}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Start Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-4">
          <AlertTriangle className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-brand-text-secondary">No performance improvement plans</p>
            <p className="text-sm mt-1">Start one when a direct report needs a structured improvement path.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {filtered.map((p) => {
            const goalsMet = p.goals.filter((g) => g.status === 'met').length;
            return (
              <button key={p._id} onClick={() => setViewing(p)}
                className="text-left bg-brand-bg-soft border border-brand-border rounded-xl p-4 hover:border-brand-border-strong transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-text">{p.employee?.fullName ?? 'Employee'}</p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      {new Date(p.startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} → {new Date(p.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                    p.status === 'completed'
                      ? (p.outcome === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300')
                      : 'bg-amber-500/20 text-amber-300',
                  )}>
                    {p.status === 'completed' ? (p.outcome === 'passed' ? 'Passed' : 'Not Met') : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-brand-text-secondary mt-2 line-clamp-2">{p.reason}</p>
                {p.goals.length > 0 && <p className="text-xs text-brand-text-muted mt-2">{goalsMet} of {p.goals.length} goals met</p>}
              </button>
            );
          })}
        </div>
      )}

      {showCreate && <CreatePIPModal onClose={() => setShowCreate(false)} onSave={handleCreate} saving={saving} />}
      {viewing && <PIPDetailModal pip={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
