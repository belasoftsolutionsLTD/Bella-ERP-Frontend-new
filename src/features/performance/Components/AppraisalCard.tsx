'use client';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import type { AppraisalRecord } from '../Hooks/usePerformance';

export function AppraisalCard({ record }: { record: AppraisalRecord }) {
  const t = useTranslations('Performance');
  const ratingColor = record.rating >= 4 ? 'text-success' : record.rating >= 3 ? 'text-accent' : 'text-danger';
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm">{record.reviewPeriod}</p>
          <p className="text-xs text-foreground/50">{new Date(record.createdAt).toLocaleDateString('en-KE')}</p>
        </div>
        <div className={`flex items-center gap-1 ${ratingColor}`}>
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold">{record.rating}/5</span>
        </div>
      </div>
      {record.comments && <p className="text-sm text-foreground/70 mb-3 italic">"{record.comments}"</p>}
      {record.goalsSet?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">{t('goalsSet')}:</p>
          <ul className="list-disc list-inside text-xs text-foreground/60 space-y-0.5">
            {record.goalsSet.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
