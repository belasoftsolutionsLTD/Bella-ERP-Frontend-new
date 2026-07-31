'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBalanceSheet } from '../Hooks/useReports';
import type { BalanceSheetLine } from '../Hooks/useReports';

// Conventional financial-statement semantics, matching the balanced/unbalanced
// emerald/red badge already used lower in this file.
const COMPOSITION_COLORS = { assets: '#10b981', liabilities: '#ef4444', equity: '#6366f1' };

function Section({ title, lines, total }: { title: string; lines: BalanceSheetLine[]; total: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">
        {lines.map((l) => (
          <div key={l.accountId ?? l.code} className="flex items-center justify-between text-sm">
            <span className="text-slate-700"><span className="font-mono text-xs text-slate-400 mr-1.5">{l.code}</span>{l.name}</span>
            <span className="text-slate-600">{l.balance.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 mt-2 border-t border-slate-100">
        <span>{title}</span><span>{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function BalanceSheetTab() {
  const t = useTranslations('Accounting');
  const { balanceSheet, isLoading } = useBalanceSheet();

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!balanceSheet) return null;

  const compositionData = [
    { name: t('reports.assets'), value: balanceSheet.totalAssets, color: COMPOSITION_COLORS.assets },
    { name: t('reports.liabilities'), value: balanceSheet.totalLiabilities, color: COMPOSITION_COLORS.liabilities },
    { name: t('reports.equity'), value: balanceSheet.totalEquity, color: COMPOSITION_COLORS.equity },
  ].filter((d) => d.value !== 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{t('reports.asOf')} {new Date(balanceSheet.asOf).toLocaleDateString()}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${balanceSheet.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {balanceSheet.balanced ? t('trialBalance.balanced') : t('trialBalance.unbalanced')}
        </span>
      </div>

      {compositionData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('reports.composition')}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={compositionData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={80} innerRadius={46} paddingAngle={2}>
                {compositionData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Legend formatter={(v) => <span style={{ color: '#475569', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <Section title={t('reports.assets')} lines={balanceSheet.assets} total={balanceSheet.totalAssets} />
      <Section title={t('reports.liabilities')} lines={balanceSheet.liabilities} total={balanceSheet.totalLiabilities} />
      <Section title={t('reports.equity')} lines={balanceSheet.equity} total={balanceSheet.totalEquity} />
      <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between text-sm font-bold text-slate-900">
        <span>{t('reports.liabilitiesPlusEquity')}</span>
        <span>{(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString()}</span>
      </div>
    </div>
  );
}
