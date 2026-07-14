'use client';

import { useState } from 'react';
import { Plus, Loader2, ClipboardList, CheckCircle2, Clock, Circle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCycles } from '../Hooks/useCycles';
import { CYCLE_STATUS_MAP, type ReviewCycle } from '../constants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StartCycleDrawer } from './StartCycleDrawer';
import { MyReviewTasksPanel } from './MyReviewTasksPanel';
import { PeerAssignmentModal } from './PeerAssignmentModal';

const PEER_CYCLE_TYPES = ['360', 'peer'];

const PHASE_LABELS = ['Self Review', 'Manager Review', 'Calibration', 'Results Shared'];

function CyclePhaseBar({ cycle }: { cycle: ReviewCycle }) {
  const phaseIndex =
    cycle.status === 'completed' ? 4 :
    cycle.status === 'calibration' ? 2 :
    cycle.status === 'active' ? 1 : 0;

  return (
    <div className="flex items-center gap-0 mt-3">
      {PHASE_LABELS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px]',
              i < phaseIndex ? 'bg-brand-primary border-brand-primary text-white' :
              i === phaseIndex ? 'border-indigo-400 bg-transparent animate-pulse' :
              'border-brand-border bg-transparent',
            )}>
              {i < phaseIndex ? '✓' : ''}
            </div>
            <span className={cn('text-[10px] font-medium whitespace-nowrap', i <= phaseIndex ? 'text-brand-text-secondary' : 'text-brand-text-muted')}>{label}</span>
          </div>
          {i < PHASE_LABELS.length - 1 && (
            <div className={cn('h-0.5 w-12 mx-1 mb-4', i < phaseIndex ? 'bg-brand-primary' : 'bg-brand-bg-muted')} />
          )}
        </div>
      ))}
    </div>
  );
}

function CycleCard({ cycle, isHR, onLaunch, onClose, onManagePeers }: { cycle: ReviewCycle; isHR: boolean; onLaunch: () => void; onClose: () => void; onManagePeers: () => void }) {
  const statusCfg = CYCLE_STATUS_MAP[cycle.status] ?? CYCLE_STATUS_MAP.draft;
  const total     = cycle.total ?? cycle.participants.length;
  const completed = cycle.completed ?? cycle.participants.filter(p => p.selfReviewStatus === 'submitted').length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-brand-text">{cycle.name}</h3>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {cycle.phases.selfReview?.startDate
              ? `${new Date(cycle.phases.selfReview.startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} — `
              : ''}
            {cycle.phases.managerReview?.endDate
              ? new Date(cycle.phases.managerReview.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })
              : 'Dates TBD'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={statusCfg.status} label={statusCfg.label} className="text-[11px]" />
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-brand-text-muted">{completed} of {total} completed</span>
            <span className="text-xs font-bold text-brand-text-secondary">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-brand-bg-muted overflow-hidden">
            <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Phase indicator */}
      <CyclePhaseBar cycle={cycle} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
        <span className="text-[11px] text-brand-text-muted">
          Created {new Date(cycle.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
        </span>
        <div className="flex gap-2">
          {isHR && PEER_CYCLE_TYPES.includes(cycle.type) && cycle.status !== 'draft' && (
            <button onClick={onManagePeers}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary text-xs font-semibold transition-colors">
              <Users className="h-3.5 w-3.5" /> Manage Peers
            </button>
          )}
          {cycle.status === 'draft' && (
            <button onClick={onLaunch}
              className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold transition-colors">
              Launch
            </button>
          )}
          {cycle.status === 'active' && (
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary text-xs font-semibold transition-colors">
              Close Cycle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  isHR: boolean;
}

export function ReviewsTab({ isHR }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter]         = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [saving, setSaving]         = useState(false);
  const [managingPeersFor, setManagingPeersFor] = useState<ReviewCycle | null>(null);

  const { cycles, loading, refetch, createCycle, launchCycle, closeCycle } = useCycles();

  const filtered = filter === 'all' ? cycles : cycles.filter(c => c.status === filter);

  const handleCreate = (data: Record<string, unknown>) => {
    setSaving(true);
    createCycle(data, () => { setSaving(false); setShowCreate(false); }, () => setSaving(false));
  };

  return (
    <div className="space-y-5">
      <MyReviewTasksPanel />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Review Cycles</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">{cycles.length} cycle{cycles.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-brand-bg-soft border border-brand-border rounded-lg p-0.5 text-xs">
            {(['all', 'active', 'completed', 'draft'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium capitalize transition-colors',
                  filter === f ? 'bg-brand-bg-muted text-brand-text' : 'text-brand-text-muted hover:text-brand-text-secondary',
                )}>
                {f}
              </button>
            ))}
          </div>
          {isHR && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" /> Start Review Cycle
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-4">
          <ClipboardList className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-brand-text-secondary">No review cycles yet</p>
            <p className="text-sm mt-1">Start a review cycle to begin evaluating your team.</p>
          </div>
          {isHR && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" /> Start Review Cycle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
          {filtered.map(c => (
            <CycleCard
              key={c._id}
              cycle={c}
              isHR={isHR}
              onLaunch={() => launchCycle(c._id)}
              onClose={() => { if (confirm('Close this review cycle?')) closeCycle(c._id); }}
              onManagePeers={() => setManagingPeersFor(c)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <StartCycleDrawer
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}

      {managingPeersFor && (
        <PeerAssignmentModal
          cycle={managingPeersFor}
          onClose={() => { setManagingPeersFor(null); refetch(); }}
        />
      )}
    </div>
  );
}
