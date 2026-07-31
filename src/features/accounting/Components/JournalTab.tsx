'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, Undo2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { useJournalEntries } from '../Hooks/useJournalEntries';
import { ManualEntryFormModal } from './ManualEntryFormModal';
import type { AccountingAccessLevel, JournalEntry } from '../types';

export function JournalTab({ level }: { level: AccountingAccessLevel }) {
  const t = useTranslations('Accounting');
  const { entries, isLoading, reverseEntry } = useJournalEntries();
  const [showForm, setShowForm] = useState(false);
  const [reversing, setReversing] = useState<JournalEntry | null>(null);
  const canManage = level === 'admin' || level === 'bookkeeper';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{entries.length} {t('journal.entries')}</p>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold">
            <Plus className="h-4 w-4" /> {t('journal.newEntry')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">{t('journal.noEntries')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {entries.map((e) => (
            <div key={e._id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{e.entryNumber} <span className="font-normal text-slate-500">— {e.description}</span></p>
                  <p className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString()} · {e.source} {e.sourceModule ? `(${e.sourceModule})` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${e.status === 'reversed' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{e.status}</span>
                  {canManage && e.status === 'posted' && (
                    <button onClick={() => setReversing(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50" title={t('journal.reverse')}>
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {e.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-500 pl-2">
                    <span>{l.accountCode} — {l.accountName}</span>
                    <span>{l.debit > 0 ? l.debit.toLocaleString() : ''}{l.credit > 0 ? `(${l.credit.toLocaleString()})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ManualEntryFormModal onClose={() => setShowForm(false)} />}
      {reversing && (
        <ConfirmDialog
          title={t('journal.reverse')}
          message={t('journal.reverseConfirm')}
          confirmLabel={t('journal.reverse')}
          variant="danger"
          onConfirm={() => { reverseEntry(reversing._id, 'Manual reversal'); setReversing(null); }}
          onCancel={() => setReversing(null)}
        />
      )}
    </div>
  );
}
