'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, Download, X, TrendingDown, Clock, PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useValuationReport, useStockByCategoryReport, useInventoryInsights } from '../Hooks/useInventoryReports';
import { useLowStockAlerts, useInventoryLocations } from '../Hooks/useInventoryLocations';
import { useInventoryCategories } from '../Hooks/useInventoryConfig';
import { generateInventoryReport } from '../reportGenerator';
import type { InventoryAccessLevel } from '../types';

// Fixed-order categorical palette, validated colorblind-safe (scripts/validate_palette.js,
// light mode) against this module's white card surface. Assign by position, never cycle.
const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];
const TOP_ITEMS_LIMIT = 10;
const TOP_ITEMS_DONUT_LIMIT = 5;

function ChartBlock({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">{children}</div>;
}

export function ReportsTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const canSeeValuation = level === 'admin';
  const { locations } = useInventoryLocations();
  const { categories } = useInventoryCategories();
  const [locationId, setLocationId] = useState('');
  const [category, setCategory] = useState('');
  const filters = { locationId: locationId || undefined, category: category || undefined };

  const { valuation, isLoading: valLoading } = useValuationReport(filters);
  const { rows: categoryRows, isLoading: catLoading } = useStockByCategoryReport(filters);
  const { alerts, isLoading: lowLoading } = useLowStockAlerts(filters);
  const { insights, isLoading: insightsLoading } = useInventoryInsights();
  const [reportUri, setReportUri] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const filterLabel = [
    locationId ? locations.find((l) => l._id === locationId)?.name : t('reports.allLocations'),
    category || t('reports.allCategories'),
  ].join(' · ');

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      setReportUri(await generateInventoryReport({ filterLabel, lowStock: alerts, stockByCategory: categoryRows, valuation: canSeeValuation ? valuation : null }));
    } finally {
      setGeneratingReport(false);
    }
  };

  // Quantity vs reorder point is a 2-value-per-item comparison, not a proportion of a
  // whole and not a time trend — a radar with two overlaid series reads that shape.
  const lowStockChartData = alerts.map((a) => ({
    name: a.item?.name ?? a.item?.sku ?? '—',
    [t('reports.chartQuantity')]: a.quantity,
    [t('reports.chartReorderPoint')]: a.reorderPoint,
  }));
  const categoryChartData = categoryRows.map((r) => ({ name: r.category, value: r.quantity }));
  const byLocationChartData = (valuation?.byLocation ?? []).map((r) => ({ name: r.location?.name ?? '—', value: r.value }));

  // Value by item is a ranking that sums to total valuation — top-N + "Other" keeps the
  // donut honest about share-of-total instead of forcing every item into its own slice.
  const sortedByItem = (valuation?.byItem ?? []).slice().sort((a, b) => b.value - a.value);
  const otherItemsValue = sortedByItem.slice(TOP_ITEMS_DONUT_LIMIT).reduce((s, r) => s + r.value, 0);
  const byItemChartData = [
    ...sortedByItem.slice(0, TOP_ITEMS_DONUT_LIMIT).map((r) => ({ name: r.item?.name ?? r.item?.sku ?? '—', value: r.value })),
    ...(otherItemsValue > 0 ? [{ name: 'Other', value: otherItemsValue }] : []),
  ];
  const concentrationChartData = (insights?.valuationConcentration ?? []).map((c) => ({ name: c.category, value: c.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('reports.allLocations')}</option>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          <option value="">{t('reports.allCategories')}</option>
          {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <button onClick={generateReport} disabled={generatingReport} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50">
          <Download className="h-4 w-4" /> {generatingReport ? t('common.saving') : t('reports.generatePdf')}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" /> {t('reports.lowStock')}</h3>
        {lowLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : alerts.length === 0 ? (
          <p className="text-sm text-slate-400">{t('dashboard.noLowStock')}</p>
        ) : (
          <>
            <ChartBlock>
              <ResponsiveContainer width="100%" height={Math.max(280, lowStockChartData.length * 18)}>
                <RadarChart data={lowStockChartData} outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name={t('reports.chartQuantity')} dataKey={t('reports.chartQuantity')} stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.4} />
                  <Radar name={t('reports.chartReorderPoint')} dataKey={t('reports.chartReorderPoint')} stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]} fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartBlock>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {alerts.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-700">{a.item?.name} <span className="text-xs text-slate-400 font-mono">({a.item?.sku})</span> · {a.location?.name}</span>
                  <span className="text-red-600 font-semibold">{a.quantity} / {a.reorderPoint}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.stockByCategory')}</h3>
        {catLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : categoryRows.length === 0 ? (
          <p className="text-sm text-slate-400">{t('items.noItems')}</p>
        ) : (
          <>
            <ChartBlock>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} paddingAngle={2}>
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartBlock>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {categoryRows.map((r) => (
                <div key={r.category} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-700">{r.category}</span>
                  <span className="text-slate-500">{r.itemCount} items · {r.quantity.toLocaleString()} units</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {canSeeValuation && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.valuation')}</h3>
          {valLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : !valuation ? null : (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{t('reports.valuationTotal')}</p>
                <p className="text-2xl font-bold text-slate-900">{valuation.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('reports.byLocation')}</p>
                <ChartBlock>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byLocationChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} paddingAngle={2}>
                        {byLocationChartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartBlock>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {valuation.byLocation.map((r) => (
                    <div key={r.locationId} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-slate-700">{r.location?.name}</span>
                      <span className="text-slate-600 font-semibold">{r.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('reports.byItem')}</p>
                {byItemChartData.length > 0 && (
                  <ChartBlock>
                    <p className="text-[11px] text-slate-400 mb-2">{t('reports.topItemsByValue', { count: TOP_ITEMS_DONUT_LIMIT })}</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={byItemChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} paddingAngle={2}>
                          {byItemChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartBlock>
                )}
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {valuation.byItem.map((r) => (
                    <div key={r.itemId} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-slate-700">{r.item?.name} <span className="text-xs text-slate-400 font-mono">({r.item?.sku})</span></span>
                      <span className="text-slate-600 font-semibold">{r.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canSeeValuation && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{t('reports.insights')}</h3>
          {insightsLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /> : !insights ? null : (
            <div className="space-y-3">
              {insights.nearExpiry.length === 0 && insights.decliningVelocity.length === 0 && insights.valuationConcentration.length === 0 ? (
                <p className="text-sm text-slate-400">{t('reports.noInsights')}</p>
              ) : (
                <>
                  {insights.nearExpiry.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> {t('reports.insightNearExpiry')}</p>
                      <div className="space-y-1.5">
                        {insights.nearExpiry.map((n) => (
                          <div key={`${n.itemId}-${n.lotNumber}`} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{n.item?.name ?? n.item?.sku} · {t('purchaseOrders.lotNumber')} {n.lotNumber}</span>
                            <span className="text-amber-600 font-semibold">{n.quantityRemaining} · {n.daysUntilExpiry}d</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {insights.decliningVelocity.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5 text-red-500" /> {t('reports.insightDecliningVelocity')}</p>
                      <div className="space-y-1.5">
                        {insights.decliningVelocity.map((d) => (
                          <div key={d.itemId} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{d.item.name}</span>
                            <span className="text-red-600 font-semibold">-{d.percentDrop}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {insights.valuationConcentration.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><PieChartIcon className="h-3.5 w-3.5 text-indigo-500" /> {t('reports.insightConcentration')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="space-y-1.5">
                          {insights.valuationConcentration.map((c) => (
                            <div key={c.category} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{c.category}</span>
                              <span className="text-indigo-600 font-semibold">{c.percentOfTotal}%</span>
                            </div>
                          ))}
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={concentrationChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={36} paddingAngle={2}>
                              {concentrationChartData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {reportUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportUri(null)} />
          <div className="relative z-10 w-full max-w-2xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-800">{t('reports.title')}</p>
              <button onClick={() => setReportUri(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <iframe src={reportUri} title={t('reports.title')} className="flex-1 w-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
