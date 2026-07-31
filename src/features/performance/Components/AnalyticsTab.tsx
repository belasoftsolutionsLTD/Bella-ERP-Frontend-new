'use client';

import { useEffect, useState } from 'react';
import { Loader2, BarChart2, Target, Users, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid,
} from 'recharts';

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

const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

const RATING_LABELS: Record<number, string> = { 1: 'Unsatisfactory', 2: 'Needs Work', 3: 'Meets', 4: 'Exceeds', 5: 'Outstanding' };

const tooltipStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

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

  const goalsChartData = data.goalsByStatus.map(g => ({
    id: g._id,
    name: g._id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: g.count,
  }));

  const ratingChartData = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    label: RATING_LABELS[rating],
    count: data.ratingDistribution.find(r => r._id === rating)?.count ?? 0,
  }));

  const deptChartData = data.departmentPerformance.map(d => ({
    department: d._id || 'No Department',
    avgRating: d.avgRating,
    count: d.count,
  }));

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

        {/* Goals by status — donut */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Goals by Status</h3>
          {data.goalsByStatus.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No goal data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={goalsChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={46}
                  paddingAngle={2}
                >
                  {goalsChartData.map((entry, i) => (
                    <Cell key={entry.id} fill={GOAL_STATUS_COLORS[entry.id] || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, 'Goals']} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance score distribution */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Performance Score Distribution</h3>
          {data.ratingDistribution.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No appraisal data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={ratingChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [v, 'Reviews']}
                  labelFormatter={(rating: any) => `Rating ${rating} — ${RATING_LABELS[rating as number]}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#ratingGrad)"
                  dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Reviews"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department performance */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-brand-text mb-4">Performance by Department</h3>
          {data.departmentPerformance.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-6">No department data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={deptChartData} outerRadius="75%">
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="department" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any, _n: any, item: any) => [`${(v as number).toFixed(1)} / 5 (${item?.payload?.count ?? 0} reviews)`, 'Avg Rating']}
                />
                <Radar dataKey="avgRating" name="Avg Rating" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
