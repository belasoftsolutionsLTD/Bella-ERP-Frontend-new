'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Package, ShieldOff, Clock, Star, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOffboardingAnalytics } from '../Hooks/useOffboardingAnalytics';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-brand-text mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function StatTile({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon?: any }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
      <p className={cn('text-2xl font-bold flex items-center justify-center gap-1.5', color)}>
        {Icon && <Icon className="h-4 w-4" />} {value}
      </p>
      <p className="text-xs text-brand-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

export default function OffboardingAnalyticsPage() {
  const locale = useLocale();
  const { data, loading } = useOffboardingAnalytics();

  const exitTypeData = (data?.exitTypeBreakdown ?? []).map(e => ({ exitType: e.exitType.replace('_', ' '), Count: e.count }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/offboarding`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Offboarding
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Offboarding Analytics</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Exit trends, clearance status & exit interview sentiment</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : !data ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No analytics data available yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Avg completion (days)" value={data.avgCompletionDays ?? '—'} color="text-indigo-400" icon={Clock} />
            <StatTile label="Assets outstanding" value={data.assetsOutstanding} color="text-amber-400" icon={Package} />
            <StatTile label="Accesses not revoked" value={data.accessesOutstanding} color="text-red-400" icon={ShieldOff} />
            <StatTile label="Would recommend" value={data.exitInterviewSentiment.wouldRecommendPct != null ? `${data.exitInterviewSentiment.wouldRecommendPct}%` : '—'} color="text-emerald-400" icon={ThumbsUp} />
          </div>

          <ChartCard title="Exit Type Breakdown">
            {exitTypeData.length === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-16">No offboarding records yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={exitTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="exitType" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} className="capitalize" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Exit Interview Sentiment">
            {data.exitInterviewSentiment.responseCount === 0 ? (
              <p className="text-sm text-brand-text-muted text-center py-8">No exit interviews submitted yet.</p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-brand-text-muted mb-1.5">Avg Job Satisfaction</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn('h-4 w-4', i <= Math.round(data.exitInterviewSentiment.avgJobSatisfaction ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700')} />
                    ))}
                    <span className="text-sm text-brand-text-secondary ml-1">{data.exitInterviewSentiment.avgJobSatisfaction}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-1.5">Avg Management Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn('h-4 w-4', i <= Math.round(data.exitInterviewSentiment.avgManagementRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700')} />
                    ))}
                    <span className="text-sm text-brand-text-secondary ml-1">{data.exitInterviewSentiment.avgManagementRating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-1.5">Responses Collected</p>
                  <p className="text-sm text-brand-text-secondary">{data.exitInterviewSentiment.responseCount}</p>
                </div>
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
