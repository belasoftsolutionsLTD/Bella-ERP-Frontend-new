'use client';

import { useTranslations } from 'next-intl';
import { Phone, Mail, Users, StickyNote, CheckSquare, ArrowRightLeft, Trophy, XOctagon, PlusCircle, ShoppingBag, Star } from 'lucide-react';
import type { TimelineEntry } from '../types';

const ICONS: Record<string, any> = {
  call: Phone, email: Mail, meeting: Users, note: StickyNote, task: CheckSquare,
  stage_change: ArrowRightLeft, deal_created: PlusCircle, deal_won: Trophy, deal_lost: XOctagon,
  feedback_logged: Star,
};

export function TimelineFeed({ entries }: { entries: TimelineEntry[] }) {
  const t = useTranslations('CRM');

  if (entries.length === 0) return <p className="text-sm text-slate-400 text-center py-8">{t('timeline.empty')}</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        if (entry.kind === 'pos_sale') {
          return (
            <div key={entry._id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShoppingBag className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0 pb-3 border-b border-slate-100">
                <p className="text-sm text-slate-800">{t('timeline.purchase', { saleNumber: entry.saleNumber })}</p>
                <p className="text-xs text-slate-400">{entry.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">{entry.total.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{new Date(entry.at).toLocaleString()}</p>
              </div>
            </div>
          );
        }
        const Icon = ICONS[entry.type] || StickyNote;
        const isFeedback = entry.type === 'feedback_logged';
        return (
          <div key={entry._id} className="flex gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isFeedback ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0 pb-3 border-b border-slate-100">
              <p className="text-sm text-slate-800">{entry.subject}</p>
              {entry.notes && <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>}
              {entry.type === 'task' && (
                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${entry.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {entry.completed ? t('activities.completed') : t('activities.pending')}
                </span>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{entry.performedByName} · {new Date(entry.at).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
