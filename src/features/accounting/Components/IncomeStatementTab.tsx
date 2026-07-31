'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIncomeStatement } from '../Hooks/useReports';

// Same fixed sequence used elsewhere in the app for generic categorical breakdowns
// (frontend/src/features/reports/Components/shared.tsx CHART_COLORS) — expense
// accounts don't have an established per-account color convention, so red/amber
// tones are avoided here to keep individual account slices distinguishable.
const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16'];

export function IncomeStatementTab() {
  const t = useTranslations('Accounting');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { incomeStatement, isLoading } = useIncomeStatement({ startDate: startDate || undefined, endDate: endDate || undefined });

  const expenseBreakdown = (incomeStatement?.expenses ?? [])
    .filter((l) => l.amount !== 0)
    .map((l) => ({ name: l.name, value: l.amount }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
        <span className="text-slate-400 text-sm">–</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : !incomeStatement ? null : (
        <div className="space-y-3">
          {expenseBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('reports.expenseBreakdown')}</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} innerRadius={46} paddingAngle={2}>
                    {expenseBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                  <Legend formatter={(v) => <span style={{ color: '#475569', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('reports.revenue')}</p>
            <div className="space-y-1">
              {incomeStatement.revenue.map((l) => (
                <div key={l.accountId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{l.name}</span><span className="text-slate-600">{l.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 mt-2 border-t border-slate-100">
              <span>{t('reports.totalRevenue')}</span><span>{incomeStatement.totalRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('reports.expenses')}</p>
            <div className="space-y-1">
              {incomeStatement.expenses.map((l) => (
                <div key={l.accountId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{l.name}</span><span className="text-slate-600">{l.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 mt-2 border-t border-slate-100">
              <span>{t('reports.totalExpenses')}</span><span>{incomeStatement.totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className={`rounded-xl p-4 flex items-center justify-between text-sm font-bold ${incomeStatement.netIncome >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            <span>{t('reports.netIncome')}</span><span>{incomeStatement.netIncome.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
