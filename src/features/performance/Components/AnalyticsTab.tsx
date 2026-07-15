'use client';

import { useEffect, useState } from 'react';
import { Loader2, BarChart2, Target, Users, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Analytics {
  goalsCompletionRate: number;
  averagePerformanceScore: number;
  reviewParticipationRate: number;
  activeCycles: number;
  goalsByStatus: { _id: string; count: number }[];
  ratingDistribution: { _id: number; count: number }[];
  departmentPerformance: { _id: string; avgRating: number; count: number }[];
}

const GOAL_STATUS_COLORS: Record<string, string> = {
  completed:   '#6366f1',
  in_progress: '#3b82f6',
  at_risk:     '#f59e0b',
  not_started: '#64748b',
  behind:      '#ef4444',
};

const RATING_LABELS: Record<number, string> = { 1: 'Unsatisfactory', 2: 'Needs Work', 3: 'Meets', 4: 'Exceeds', 5: 'Outstanding' };

export function AnalyticsTab() {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/analytics`,
      showToast: false,
      thenFn: r => setData(r.data ?? null),
      catchFn: (e: any) => setError(e?.response?.data?.message || e?.message || 'Failed to load analytics.'),
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <AlertTriangle className="h-6 w-6 text-brand-danger" />
      <p className="text-brand-text-secondary text-sm">{error || 'Failed to load analytics.'}</p>
      <button onClick={load} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors">
        Retry
      </button>
    </div>
  );

  const statCards = [
    { icon: Target,  label: 'Goals Completion',      value: `${data.goalsCompletionRate}%`,         sub: 'of goals completed'     },
    { icon: Star,    label: 'Avg Performance Score',  value: `${data.averagePerformanceScore}/5`,    sub: 'average appraisal rating'},
    { icon: Users,   label: 'Review Participation',   value: `${data.reviewParticipationRate}%`,     sub: 'reviews submitted'       },
    { icon: BarChart2,label: 'Active Cycles',         value: String(data.activeCycles),              sub: 'review cycles running'   },
  ];

  const maxDeptRating = Math.max(...(data.departmentPerformance.map(d => d.avgRating) || [1]));
  const maxRatingCount = Math.max(...(data.ratingDistribution.map(r => r.count) || [1]));
  const totalGoals = data.goalsByStatus.reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-brand-text">{value}</p>
            <p className="text-xs text-brand-text-muted mt-0.5">{sub}</p>
            <p className="text-[11px] text-brand-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Goals by status — donut-style */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Goals by Status</h3>
          {data.goalsByStatus.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No goal data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.goalsByStatus.map(g => {
                const pct = totalGoals > 0 ? Math.round((g.count / totalGoals) * 100) : 0;
                const color = GOAL_STATUS_COLORS[g._id] || '#64748b';
                const label = g._id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div key={g._id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-brand-text-secondary">{label}</span>
                      <span className="text-xs text-brand-text-muted">{g.count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-brand-bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance score distribution */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Performance Score Distribution</h3>
          {data.ratingDistribution.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No appraisal data yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {[1, 2, 3, 4, 5].map(rating => {
                const entry = data.ratingDistribution.find(r => r._id === rating);
                const count = entry?.count ?? 0;
                const pct   = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
                const color = rating >= 4 ? '#6366f1' : rating === 3 ? '#3b82f6' : '#f59e0b';
                return (
                  <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[11px] text-brand-text-muted">{count}</span>
                    <div className="w-full rounded-t flex items-end justify-center transition-all" style={{ height: `${Math.max(4, pct)}%`, backgroundColor: color }} />
                    <span className="text-[10px] text-brand-text-muted">{rating}</span>
                    <span className="text-[9px] text-slate-700 text-center leading-none">{RATING_LABELS[rating]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department performance */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-brand-text mb-4">Performance by Department</h3>
          {data.departmentPerformance.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No department data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.departmentPerformance.map(d => {
                const pct = maxDeptRating > 0 ? (d.avgRating / 5) * 100 : 0;
                const color = d.avgRating >= 4 ? '#6366f1' : d.avgRating >= 3 ? '#3b82f6' : '#f59e0b';
                return (
                  <div key={d._id} className="flex items-center gap-3">
                    <span className="text-xs text-brand-text-secondary w-36 shrink-0 truncate">{d._id || 'No Department'}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-brand-bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-bold text-brand-text-secondary w-10 text-right">{d.avgRating.toFixed(1)}</span>
                    <span className="text-[11px] text-brand-text-muted w-12 text-right">{d.count} review{d.count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
