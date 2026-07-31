'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePosLocations } from '../Hooks/usePosLocations';
import { useDailySummary, useSalesByStaff, exportSalesCSV } from '../Hooks/usePosConfig';
import type { PosAccessLevel } from '../types';

// Fixed-order categorical palette, validated colorblind-safe (scripts/validate_palette.js,
// light mode) — same sequence reused across Inventory/Payroll/CRM report donuts. Assign by
// position, never cycle/reassign on filter changes.
const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];
const TOP_ITEMS_DONUT_LIMIT = 5;

type DatePreset = 'today' | 'week' | 'month' | 'custom';

function presetRange(preset: DatePreset, customStart: string, customEnd: string): { startDate?: string; endDate?: string; date?: string } {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];
  if (preset === 'today') return { date: iso(today) };
  if (preset === 'week') {
    const start = new Date(today); start.setDate(today.getDate() - 6);
    return { startDate: iso(start), endDate: iso(today) };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: iso(start), endDate: iso(today) };
  }
  return { startDate: customStart || undefined, endDate: customEnd || undefined };
}

export function ReportsTab({ level }: { level: PosAccessLevel }) {
  const t = useTranslations('POS');
  const { locations } = usePosLocations();
  const [locationId, setLocationId] = useState('');
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const range = useMemo(() => presetRange(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const { summary, isLoading: summaryLoading } = useDailySummary({ locationId, ...range });
  const { rows, isLoading: staffLoading } = useSalesByStaff({ locationId, startDate: range.startDate ?? range.date, endDate: range.endDate ?? range.date });

  const paymentChartData = summary ? Object.entries(summary.paymentBreakdown).map(([method, amount]) => ({ name: t(`checkout.${method}`), value: amount })) : [];

  // Top items by revenue is a ranking that sums to total item revenue — a donut with a
  // top-N + "Other" bucket reads that share-of-total honestly without a 10-slice pie.
  const sortedTopItems = (summary?.topItems ?? []).slice().sort((a, b) => b.revenue - a.revenue);
  const otherItemsRevenue = sortedTopItems.slice(TOP_ITEMS_DONUT_LIMIT).reduce((s, i) => s + i.revenue, 0);
  const topItemsChartData = [
    ...sortedTopItems.slice(0, TOP_ITEMS_DONUT_LIMIT).map((i) => ({ name: i.name, value: i.revenue })),
    ...(otherItemsRevenue > 0 ? [{ name: 'Other', value: otherItemsRevenue }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('sales.allLocations')}</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 gap-0.5">
          {(['today', 'week', 'month', 'custom'] as DatePreset[]).map((p) => (
            <button key={p} onClick={() => setPreset(p)}
              className={`h-8 px-2.5 rounded-md text-xs font-semibold ${preset === p ? 'bg-brand-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              {t(`reports.preset${p.charAt(0).toUpperCase()}${p.slice(1)}`)}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
          </>
        )}
        <button onClick={() => exportSalesCSV({ locationId, ...(range.startDate ? { startDate: range.startDate, endDate: range.endDate } : { startDate: range.date, endDate: range.date }) })}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
          <Download className="h-4 w-4" /> {t('reports.export')}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.dailySummary')}</h3>
        {summaryLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : !summary ? null : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.totalSales')}</p>
                <p className="text-xl font-bold text-slate-900">{summary.totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.totalTransactions')}</p>
                <p className="text-xl font-bold text-slate-900">{summary.totalTransactions}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.totalDiscounts')}</p>
                <p className="text-xl font-bold text-slate-900">{summary.totalDiscounts.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.totalVoucherAmount')}</p>
                <p className="text-xl font-bold text-slate-900">{summary.totalVoucherAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('reports.paymentBreakdown')}</p>
                {paymentChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={paymentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
                        {paymentChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="divide-y divide-slate-100 mt-2">
                  {Object.entries(summary.paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between px-1 py-2 text-sm">
                      <span className="text-slate-700 capitalize">{t(`checkout.${method}`)}</span>
                      <span className="text-slate-600 font-semibold">{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('reports.topItems')}</p>
                {topItemsChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={topItemsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
                        {topItemsChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="divide-y divide-slate-100 mt-2">
                  {summary.topItems.map((i) => (
                    <div key={i.itemId} className="flex items-center justify-between px-1 py-2 text-sm">
                      <span className="text-slate-700">{i.name} <span className="text-xs text-slate-400 font-mono">({i.sku})</span></span>
                      <span className="text-slate-600">{i.quantity} · {i.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.salesByStaff')}</h3>
        {staffLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : rows.length === 0 ? (
          <p className="text-sm text-slate-400">{t('sales.noSales')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.staffId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-700">{r.staffName}</span>
                <span className="text-slate-600">{r.transactionCount} · {r.totalSales.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
