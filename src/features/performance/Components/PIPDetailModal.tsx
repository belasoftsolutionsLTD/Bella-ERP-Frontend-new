'use client';

import { useState } from 'react';
import { X, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePIPs } from '../Hooks/usePIPs';
import type { PIP } from '../constants';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';

const GOAL_STATUS_MAP: Record<string, Status> = {
  pending: 'pending', met: 'completed', not_met: 'failed',
};

interface Props {
  pip: PIP;
  onClose: () => void;
}

export function PIPDetailModal({ pip, onClose }: Props) {
  const { isHR, userData } = useAuth();
  const { update, addCheckIn, close, refetch } = usePIPs();
  const [note, setNote] = useState('');

  const isEmployeeView = !isHR && !!userData?.employeeId && String(userData.employeeId) === String(pip.employeeId);

  const setGoalStatus = (goalId: string, status: 'pending' | 'met' | 'not_met') => {
    const goals = pip.goals.map((g) => (g.id === goalId ? { ...g, status } : g));
    update(pip._id, { goals });
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addCheckIn(pip._id, note.trim(), () => setNote(''));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">{pip.employee?.fullName ?? 'Employee'}</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              {new Date(pip.startDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })} → {new Date(pip.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Reason</p>
            <p className="text-sm text-brand-text-secondary">{pip.reason}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Improvement Goals</p>
            <div className="space-y-2">
              {pip.goals.map((g) => (
                <div key={g.id} className="bg-brand-bg-soft border border-brand-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-brand-text">{g.description}</p>
                    <StatusBadge status={GOAL_STATUS_MAP[g.status] ?? 'pending'}
                      label={g.status === 'not_met' ? 'Not Met' : g.status === 'met' ? 'Met' : 'Pending'}
                      className="text-[11px] shrink-0" />
                  </div>
                  {g.targetDate && <p className="text-[11px] text-brand-text-muted mt-1">Target: {new Date(g.targetDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>}
                  {!isEmployeeView && pip.status === 'active' && (
                    <div className="flex gap-1.5 mt-2">
                      {(['pending', 'met', 'not_met'] as const).map((s) => (
                        <button key={s} onClick={() => setGoalStatus(g.id, s)}
                          className={cn('text-[11px] px-2 py-1 rounded-md border', g.status === s ? 'border-brand-primary text-indigo-300' : 'border-brand-border text-brand-text-muted hover:border-brand-border-strong')}>
                          {s === 'not_met' ? 'Not Met' : s === 'met' ? 'Met' : 'Pending'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Check-in Notes</p>
            <div className="space-y-2 mb-2">
              {pip.checkIns.map((c) => (
                <div key={c.id} className="bg-brand-bg-soft border border-brand-border rounded-lg p-3">
                  <p className="text-sm text-brand-text-secondary">{c.note}</p>
                  <p className="text-[11px] text-brand-text-muted mt-1">{new Date(c.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              ))}
              {pip.checkIns.length === 0 && <p className="text-xs text-brand-text-muted">No check-ins yet.</p>}
            </div>
            {pip.status === 'active' && (
              <div className="flex items-center gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a check-in note…"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                  className="flex-1 h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                <button onClick={handleAddNote} className="px-3 py-2 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary text-xs font-semibold">Add</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          {pip.status === 'completed' ? (
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', pip.outcome === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300')}>
              Closed — {pip.outcome === 'passed' ? 'Passed' : 'Not Met'}
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Active</span>
          )}
          {!isEmployeeView && pip.status === 'active' && (
            <div className="flex gap-2">
              <button onClick={() => close(pip._id, 'failed', () => { refetch(); onClose(); })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold transition-colors">
                <XCircle className="h-3.5 w-3.5" /> Close — Not Met
              </button>
              <button onClick={() => close(pip._id, 'passed', () => { refetch(); onClose(); })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition-colors">
                <CheckCircle2 className="h-3.5 w-3.5" /> Close — Passed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
