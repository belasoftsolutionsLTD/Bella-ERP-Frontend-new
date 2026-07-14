'use client';
import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface AnalyticsData {
  completionTrend: { date: string; completed: number; created: number }[];
  statusBreakdown: { status: string; count: number }[];
  moduleBreakdown: { module: string; count: number; overdue: number }[];
  deptOverdue: { department: string; overdue: number }[];
  summary: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    avgDaysToComplete?: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#64748b',
  in_progress: '#6366f1',
  completed:   '#10b981',
  overdue:     '#ef4444',
  blocked:     '#475569',
};
const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  overdue:     'Overdue',
  blocked:     'Blocked',
};
const MODULE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function TaskAnalytics() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/analytics`,
      method: 'GET',
      showToast: false,
      thenFn: (r: any) => setData(r.data as AnalyticsData),
      finallyFn: () => setLoading(false),
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-brand-text-muted text-sm">
      Unable to load analytics.
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp} label="Completion Rate" value={`${data.summary.completionRate}%`} sub={`${data.summary.completed} of ${data.summary.total}`} color="indigo" />
        <SummaryCard icon={CheckCircle2} label="Completed" value={data.summary.completed} sub="All time" color="emerald" />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={data.summary.overdue} sub="Action needed" color="red" />
        <SummaryCard icon={Clock} label="Avg to Complete" value={data.summary.avgDaysToComplete ? `${data.summary.avgDaysToComplete}d` : '—'} sub="Days" color="amber" />
      </div>

      {/* Row 1: Trend line + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Completion trend */}
        <div className="lg:col-span-3 bg-brand-bg-soft rounded-2xl p-5 border border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-4">30-Day Task Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => {
                const parts = d.split('-');
                return `${parts[1]}/${parts[2]}`;
              }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
              <Line type="monotone" dataKey="created"   stroke="#6366f1" strokeWidth={2} dot={false} name="Created" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="lg:col-span-2 bg-brand-bg-soft rounded-2xl p-5 border border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                {data.statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, STATUS_LABELS[n as string] ?? n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {data.statusBreakdown.map(s => (
              <div key={s.status} className="flex items-center gap-1.5 text-[10px] text-brand-text-secondary">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] ?? '#64748b' }} />
                {STATUS_LABELS[s.status] ?? s.status}: <span className="text-brand-text-secondary font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Module bar + Dept overdue bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module breakdown */}
        <div className="bg-brand-bg-soft rounded-2xl p-5 border border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-4">Tasks by Module</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.moduleBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="module" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80}
                tickFormatter={m => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Total" radius={[0, 4, 4, 0]}>
                {data.moduleBreakdown.map((_, i) => (
                  <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department overdue */}
        <div className="bg-brand-bg-soft rounded-2xl p-5 border border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-4">Overdue by Department</h3>
          {data.deptOverdue.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-brand-text-secondary">No overdue tasks by department</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.deptOverdue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="department" tick={{ fill: '#94a3b8', fontSize: 9 }}
                  tickFormatter={d => d.length > 10 ? d.slice(0, 10) + '…' : d} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string | number; sub: string;
  color: 'indigo' | 'emerald' | 'red' | 'amber';
}) {
  const cfg = {
    indigo:  { bg: 'bg-brand-primary/10',  icon: 'bg-brand-primary/10 text-brand-primary',  value: 'text-brand-primary' },
    emerald: { bg: 'bg-status-success-bg', icon: 'bg-status-success-bg text-status-success-text',value: 'text-status-success-text' },
    red:     { bg: 'bg-status-danger-bg',     icon: 'bg-status-danger-bg text-status-danger-text',        value: 'text-status-danger-text' },
    amber:   { bg: 'bg-status-warning-bg',   icon: 'bg-status-warning-bg text-status-warning-text',    value: 'text-status-warning-text' },
  }[color];

  return (
    <div className={`${cfg.bg} rounded-2xl p-4 border border-brand-border`}>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${cfg.icon}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className={`text-2xl font-bold ${cfg.value}`}>{value}</p>
      <p className="text-xs font-semibold text-brand-text-secondary mt-0.5">{label}</p>
      <p className="text-[10px] text-brand-text-muted mt-0.5">{sub}</p>
    </div>
  );
}
