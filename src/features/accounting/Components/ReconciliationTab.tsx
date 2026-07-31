'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2 } from 'lucide-react';
import { useBankStatementImports } from '../Hooks/useReconciliation';
import { ImportStatementModal } from './ImportStatementModal';
import { MatchingScreen } from './MatchingScreen';

export function ReconciliationTab() {
  const t = useTranslations('Accounting');
  const { imports, isLoading } = useBankStatementImports();
  const [showImport, setShowImport] = useState(false);
  const [matching, setMatching] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{imports.length} {t('reconciliation.imports')}</p>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold">
          <Plus className="h-4 w-4" /> {t('reconciliation.importStatement')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : imports.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('reconciliation.noImports')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {imports.map((imp) => (
            <button key={imp._id} onClick={() => setMatching(imp._id)} className="flex items-center justify-between w-full px-4 py-3 text-sm text-left hover:bg-slate-50">
              <div>
                <p className="text-slate-800">{imp.filename}</p>
                <p className="text-xs text-slate-400">{new Date(imp.periodStart).toLocaleDateString()} – {new Date(imp.periodEnd).toLocaleDateString()} · {imp.lines.length} {t('reconciliation.lines')}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${imp.status === 'reconciled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {t(`reconciliation.status.${imp.status}`)}
              </span>
            </button>
          ))}
        </div>
      )}

      {showImport && <ImportStatementModal onClose={() => setShowImport(false)} />}
      {matching && <MatchingScreen importId={matching} onClose={() => setMatching(null)} />}
    </div>
  );
}
