'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePipelines } from '../Hooks/useCrmConfig';
import { usePipelineReport, useActivityReport, exportDealsCSV } from '../Hooks/useCrmIntegrations';
import { useSourceEffectiveness, useFeedbackSummary } from '../Hooks/useFeedback';

// Fixed-order categorical palette, validated colorblind-safe (scripts/validate_palette.js,
// light mode). Assign by position, never cycle.
const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

export function ReportsTab() {
  const t = useTranslations('CRM');
  const { pipelines } = usePipelines();
  const [pipelineId, setPipelineId] = useState('');
  const activePipeline = pipelines.find((p) => p._id === pipelineId) ?? pipelines.find((p) => p.isDefault) ?? pipelines[0];
  const { report, isLoading: reportLoading } = usePipelineReport(activePipeline?._id ?? null);
  const { rows, isLoading: activityLoading } = useActivityReport();
  const { sources, isLoading: sourcesLoading } = useSourceEffectiveness();
  const { summary: feedbackSummary, isLoading: feedbackLoading } = useFeedbackSummary();

  const sourceChartData = sources.map((s) => ({ name: t(`contacts.sourceValue.${s.source === 'other' ? 'other' : s.source.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase())}`), value: s.contactCount }));
  const ratingChartData = (feedbackSummary?.distribution ?? []).filter((d) => d.count > 0).map((d) => ({ name: `${d.rating}★`, value: d.count }));

  // Pipeline value by stage is a textbook share-of-total-pipeline-value — a donut.
  const stageChartData = (report?.byStage ?? []).map((s) => ({ name: s.stageName, value: s.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={activePipeline?._id ?? ''} onChange={(e) => setPipelineId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          {pipelines.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <button onClick={() => exportDealsCSV({ pipelineId: activePipeline?._id })} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
          <Download className="h-4 w-4" /> {t('reports.export')}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.pipelineHealth')}</h3>
        {reportLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : !report ? null : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.openValue')}</p>
                <p className="text-xl font-bold text-slate-900">{report.openValue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.winRate')}</p>
                <p className="text-xl font-bold text-slate-900">{report.winRate}%</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.avgDealSize')}</p>
                <p className="text-xl font-bold text-slate-900">{report.avgDealSize.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.avgTimeToClose')}</p>
                <p className="text-xl font-bold text-slate-900">{report.avgTimeToCloseDays}{t('reports.days')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('reports.valueByStage')}</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {stageChartData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={stageChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
                          {stageChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {report.byStage.map((s) => (
                    <div key={s.stageId} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-slate-700">{s.stageName} <span className="text-xs text-slate-400">({s.dealCount})</span></span>
                      <span className="text-slate-600 font-semibold">{s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.activityByStaff')}</h3>
        {activityLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : rows.length === 0 ? (
          <p className="text-sm text-slate-400">{t('tasks.noTasks')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5">{t('reports.staff')}</th>
                  <th className="px-4 py-2.5 text-right">{t('activities.type.call')}</th>
                  <th className="px-4 py-2.5 text-right">{t('activities.type.email')}</th>
                  <th className="px-4 py-2.5 text-right">{t('activities.type.meeting')}</th>
                  <th className="px-4 py-2.5 text-right">{t('reports.tasksCompleted')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.staffId}>
                    <td className="px-4 py-2.5 text-slate-700">{r.staffName}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.calls}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.emails}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.meetings}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.tasksCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.sourceEffectiveness')}</h3>
        {sourcesLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : sources.length === 0 ? (
          <p className="text-sm text-slate-400">{t('contacts.noContacts')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
                    {sourceChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5">{t('contacts.source')}</th>
                    <th className="px-4 py-2.5 text-right">{t('reports.contacts')}</th>
                    <th className="px-4 py-2.5 text-right">{t('reports.conversionRate')}</th>
                    <th className="px-4 py-2.5 text-right">{t('reports.wonValue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sources.map((s) => (
                    <tr key={s.source}>
                      <td className="px-4 py-2.5 text-slate-700 capitalize">{t(`contacts.sourceValue.${s.source === 'other' ? 'other' : s.source.replace(/_([a-z])/g, (_m, c) => c.toUpperCase())}`)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{s.contactCount}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{s.conversionRate}%</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{s.wonValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('feedback.title')}</h3>
        {feedbackLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : !feedbackSummary || feedbackSummary.count === 0 ? (
          <p className="text-sm text-slate-400">{t('feedback.none')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center gap-1.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-5 w-5 ${n <= Math.round(feedbackSummary.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-xl font-bold text-slate-900">{feedbackSummary.avgRating}</p>
              <p className="text-xs text-slate-400">{t('feedback.basedOn', { count: feedbackSummary.count })}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={ratingChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={2}>
                    {ratingChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
