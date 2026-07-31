'use client';

import {
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useTimeToFill, useTimeInStage, useSourceEffectiveness, useOfferAcceptance } from '../Hooks/useAnalytics';

const COLORS = ['#f97316', '#0ea5e9', '#8b5cf6', '#22c55e', '#eab308', '#ef4444'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export function AnalyticsPage() {
  const { data: timeToFill } = useTimeToFill();
  const { data: timeInStage } = useTimeInStage();
  const { data: sourceEffectiveness } = useSourceEffectiveness();
  const { data: offerAcceptance } = useOfferAcceptance();

  const maxStageDays = Math.max(1, ...timeInStage.map((s) => s.avgDays));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">Recruitment Analytics</h1>
        <p className="text-sm text-slate-400">Funnel health, time-to-fill, and source performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Time to Fill by Department (days)">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={timeToFill}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="department" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Radar name="Avg Days to Fill" dataKey="avgDaysToFill" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Source Effectiveness">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={sourceEffectiveness}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="source" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Radar name="Applications" dataKey="applications" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.35} />
              <Radar name="Hires" dataKey="hires" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Offer Acceptance Rate">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={offerAcceptance.length ? [
                  { name: 'Accepted', value: offerAcceptance.reduce((s, m) => s + m.accepted, 0) },
                  { name: 'Declined', value: offerAcceptance.reduce((s, m) => s + m.declined, 0) },
                  { name: 'Pending', value: offerAcceptance.reduce((s, m) => s + (m.offered - m.accepted - m.declined), 0) },
                ] : []}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stage Bottlenecks (avg days in stage)">
          <div className="space-y-2">
            {timeInStage.map((s) => (
              <div key={s.stageName}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{s.stageName}</span>
                  <span>{s.avgDays}d</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.avgDays / maxStageDays) * 100}%`,
                      backgroundColor: s.avgDays / maxStageDays > 0.66 ? '#ef4444' : s.avgDays / maxStageDays > 0.33 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            ))}
            {timeInStage.length === 0 && <p className="text-sm text-slate-400">Not enough data yet.</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
