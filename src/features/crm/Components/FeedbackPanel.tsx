'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContactFeedback } from '../Hooks/useFeedback';

function StarRow({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(onChange && 'cursor-pointer')}
        >
          <Star className={cn('h-4 w-4', n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
        </button>
      ))}
    </div>
  );
}

export function FeedbackPanel({ contactId }: { contactId: string }) {
  const t = useTranslations('CRM');
  const { feedback, avgRating, count, createFeedback } = useContactFeedback(contactId);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    createFeedback({ rating, comment: comment.trim() || undefined })
      ?.then(() => { setSaving(false); setShowForm(false); setComment(''); setRating(5); })
      .catch(() => setSaving(false));
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('feedback.title')}</p>
        <button onClick={() => setShowForm((v) => !v)} className="text-brand-primary hover:text-brand-primary/80">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {avgRating !== null && (
        <div className="flex items-center gap-2 mb-2">
          <StarRow value={Math.round(avgRating)} />
          <span className="text-xs text-slate-500">{avgRating} ({count})</span>
        </div>
      )}

      {showForm && (
        <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
          <StarRow value={rating} onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('feedback.commentPlaceholder')}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" rows={2} />
          <button onClick={save} disabled={saving} className="w-full h-8 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('feedback.logFeedback')}
          </button>
        </div>
      )}

      {feedback.length === 0 ? (
        <p className="text-xs text-slate-400">{t('feedback.none')}</p>
      ) : (
        <div className="space-y-2">
          {feedback.slice(0, 5).map((f) => (
            <div key={f._id} className="text-xs">
              <StarRow value={f.rating} />
              {f.comment && <p className="text-slate-600 mt-0.5">{f.comment}</p>}
              <p className="text-slate-400 mt-0.5">{f.loggedByName} · {new Date(f.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
