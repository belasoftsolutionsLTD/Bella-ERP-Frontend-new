'use client';

import { Star, AlertTriangle, TrendingUp, Target, MessageSquare } from 'lucide-react';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { usePerformance } from '../../performance/Hooks/usePerformance';
import { usePerformanceSnapshot } from '../../performance/Hooks/usePerformanceSnapshot';
import { useGoals } from '../../performance/Hooks/useGoals';
import { useFeedback } from '../../performance/Hooks/useFeedback';
import { AppraisalCard } from '../../performance/Components/AppraisalCard';
import { NINE_BOX_LABELS } from '../../performance/constants';
import type { Employee } from '../Hooks/useEmployees';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', submitted: 'Submitted',
};

function StatusBadge({ label, status }: { label: string; status: string | null }) {
  const s = status || 'pending';
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s === 'submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
      {label}: {STATUS_LABEL[s] ?? s}
    </span>
  );
}

export function PerformanceTab({ employee }: { employee: Employee }) {
  const employeeId = employee._id;
  const { records, loading: appraisalsLoading, error, refetch } = usePerformance(employeeId);
  const { snapshot, loading: snapshotLoading } = usePerformanceSnapshot(employeeId);
  const { goals, loading: goalsLoading } = useGoals({ employeeId });
  const { feedback, loading: feedbackLoading } = useFeedback(undefined, employeeId);

  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const flag = employee.pendingPerformanceFlag;

  return (
    <Wrapper loading={appraisalsLoading} error={error} onRetry={refetch}>
      <div className="space-y-6">
        {flag && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {flag.type === 'promote' ? 'Promotion recommended' : 'Performance Improvement Plan recommended'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Flagged {new Date(flag.flaggedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })} from a manager review. Visit the Performance module to act on this.
              </p>
            </div>
          </div>
        )}

        {/* ── Current cycle status ── */}
        {!snapshotLoading && snapshot && snapshot.activeCycles.length > 0 && (
          <div>
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2">Current Review Cycles</p>
            <div className="space-y-2">
              {snapshot.activeCycles.map((c) => (
                <div key={c.cycleId} className="rounded-xl border bg-white p-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{c.cycleName}</span>
                  <div className="flex gap-2">
                    <StatusBadge label="Self" status={c.selfReviewStatus} />
                    <StatusBadge label="Manager" status={c.managerReviewStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Last calibrated rating ── */}
        {!snapshotLoading && snapshot?.lastRating && (
          <div className="rounded-xl border bg-gray-50 p-4 flex items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Last Manager Rating
              </p>
              <div className="flex items-center gap-2">
                {snapshot.lastRating.overallRating != null && (
                  <>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-lg font-bold text-foreground">{snapshot.lastRating.overallRating}/5</span>
                  </>
                )}
                {snapshot.lastRating.calibrationBox && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {NINE_BOX_LABELS[snapshot.lastRating.calibrationBox]?.label ?? snapshot.lastRating.calibrationBox}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/40 mt-1">
                {snapshot.lastRating.cycleName}
                {snapshot.lastRating.submittedAt ? ` · ${new Date(snapshot.lastRating.submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* ── Active goals ── */}
        {!goalsLoading && activeGoals.length > 0 && (
          <div>
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Active Goals ({activeGoals.length})
            </p>
            <div className="space-y-2">
              {activeGoals.map((g) => (
                <div key={g._id} className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium text-foreground">{g.title}</span>
                    <span className="text-xs text-foreground/40">{g.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(g.progress, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent feedback ── */}
        {!feedbackLoading && feedback.length > 0 && (
          <div>
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Recent Feedback
            </p>
            <div className="space-y-2">
              {feedback.slice(0, 5).map((f) => (
                <div key={f._id} className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground/70">{f.giverName ?? 'Anonymous'}</span>
                    <span className="text-[11px] text-foreground/40">{new Date(f.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">{f.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Legacy appraisal history ── */}
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2">Appraisal History</p>
          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-sm text-foreground/50">No appraisal records.</p>
            ) : records.map((r) => <AppraisalCard key={r._id} record={r} />)}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
