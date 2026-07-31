'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Download, X } from 'lucide-react';
import { useTrialBalance } from '../Hooks/useReports';
import { generateTrialBalanceReport } from '../reportGenerator';

export function TrialBalanceTab() {
  const t = useTranslations('Accounting');
  const { trialBalance, isLoading } = useTrialBalance();
  const [reportUri, setReportUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!trialBalance) return;
    setGenerating(true);
    try { setReportUri(await generateTrialBalanceReport(trialBalance)); } finally { setGenerating(false); }
  };

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!trialBalance) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trialBalance.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {trialBalance.balanced ? t('trialBalance.balanced') : t('trialBalance.unbalanced')}
        </span>
        <button onClick={generate} disabled={generating} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50">
          <Download className="h-4 w-4" /> {generating ? t('common.saving') : t('trialBalance.generatePdf')}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            <tr><th className="px-4 py-2.5">{t('journal.account')}</th><th className="px-4 py-2.5 text-right">{t('journal.debit')}</th><th className="px-4 py-2.5 text-right">{t('journal.credit')}</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trialBalance.rows.filter((r) => r.debit !== 0 || r.credit !== 0).map((r) => (
              <tr key={r.accountId}>
                <td className="px-4 py-2 text-slate-700"><span className="font-mono text-xs text-slate-400 mr-1.5">{r.code}</span>{r.name}</td>
                <td className="px-4 py-2 text-right text-slate-600">{r.debit ? r.debit.toLocaleString() : ''}</td>
                <td className="px-4 py-2 text-right text-slate-600">{r.credit ? r.credit.toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-slate-900">
            <tr><td className="px-4 py-2.5">{t('trialBalance.total')}</td><td className="px-4 py-2.5 text-right">{trialBalance.totalDebit.toLocaleString()}</td><td className="px-4 py-2.5 text-right">{trialBalance.totalCredit.toLocaleString()}</td></tr>
          </tfoot>
        </table>
      </div>

      {reportUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportUri(null)} />
          <div className="relative z-10 w-full max-w-2xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-800">{t('nav.trialBalance')}</p>
              <button onClick={() => setReportUri(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <iframe src={reportUri} title="Trial Balance" className="flex-1 w-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
