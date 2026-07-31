'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useBankStatementImport } from '../Hooks/useReconciliation';

export function MatchingScreen({ importId, onClose }: { importId: string; onClose: () => void }) {
  const t = useTranslations('Accounting');
  const { statementImport, autoMatch, unmatchLine, reconcile } = useBankStatementImport(importId);

  if (!statementImport) return null;
  const matchedTotal = statementImport.lines.filter((l) => l.matched).reduce((s, l) => s + l.amount, 0);
  const expectedClosing = statementImport.openingBalance + matchedTotal;
  const balancesAgree = Math.abs(expectedClosing - statementImport.closingBalance) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-800">{statementImport.filename}</p>
            <p className="text-xs text-slate-400">{t('reconciliation.opening')}: {statementImport.openingBalance.toLocaleString()} · {t('reconciliation.closing')}: {statementImport.closingBalance.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 shrink-0">
          <button onClick={() => autoMatch()} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> {t('reconciliation.autoMatch')}
          </button>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${balancesAgree ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {t('reconciliation.expectedClosing')}: {expectedClosing.toLocaleString()} {balancesAgree ? '✓' : ''}
          </span>
          {statementImport.status === 'in_progress' && (
            <button onClick={() => reconcile()} disabled={!balancesAgree} className="ml-auto h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-40">
              {t('reconciliation.reconcile')}
            </button>
          )}
          {statementImport.status === 'reconciled' && <span className="ml-auto text-xs font-bold text-emerald-600">{t('reconciliation.reconciled')}</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          {statementImport.lines.map((line, idx) => (
            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${line.matched ? 'bg-emerald-50' : line.flagged ? 'bg-red-50' : 'bg-slate-50'}`}>
              <div>
                <p className="text-slate-700">{line.description}</p>
                <p className="text-xs text-slate-400">{new Date(line.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={line.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>{line.amount.toLocaleString()}</span>
                {line.matched ? (
                  <button onClick={() => unmatchLine(idx)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {t('reconciliation.matched')}
                  </button>
                ) : (
                  <span className="text-xs text-red-500">{t('reconciliation.unmatched')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
