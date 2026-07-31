'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { usePostingFailures } from '../Hooks/useAccountingConfig';

export function PostingFailuresTab() {
  const t = useTranslations('Accounting');
  const { failures, retry, dismiss } = usePostingFailures();
  const unresolved = failures.filter((f: any) => !f.resolved);

  if (!unresolved.length) return <p className="text-sm text-slate-400 text-center py-16">{t('postingFailures.none')}</p>;

  return (
    <div className="space-y-2">
      {unresolved.map((f: any) => (
        <div key={f._id} className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">{f.source} ({f.sourceModule})</p>
                <p className="text-xs text-red-600 mt-0.5">{f.error}</p>
                <p className="text-[10px] text-red-400 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => retry(f._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-100" title={t('postingFailures.retry')}><RotateCcw className="h-3.5 w-3.5" /></button>
              <button onClick={() => dismiss(f._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-100" title={t('postingFailures.dismiss')}><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
