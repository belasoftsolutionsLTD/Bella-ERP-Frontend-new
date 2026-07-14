'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedback } from '../Hooks/useFeedback';
import { FEEDBACK_TYPE_CONFIG, type FeedbackItem } from '../constants';
import { GiveFeedbackDrawer } from './GiveFeedbackDrawer';

type Filter = 'all' | 'received' | 'given';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = FEEDBACK_TYPE_CONFIG[item.type as keyof typeof FEEDBACK_TYPE_CONFIG] ?? FEEDBACK_TYPE_CONFIG.positive;
  const isLong = item.message.length > 200;

  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-sm text-white font-bold shrink-0">
            {item.giverName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text">
              {item.isAnonymous ? 'Anonymous' : item.giverName}
              <span className="text-brand-text-muted font-normal"> → {item.recipientName}</span>
            </p>
            <p className="text-[11px] text-brand-text-muted">{timeAgo(item.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.category && item.category !== 'general' && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary capitalize">{item.category}</span>
          )}
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', typeCfg.cls)}>
            {typeCfg.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-brand-text-secondary leading-relaxed">
        {isLong && !expanded ? item.message.slice(0, 200) + '…' : item.message}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 font-medium transition-colors">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export function FeedbackTab() {
  const [filter, setFilter]     = useState<Filter>('all');
  const [showGive, setShowGive] = useState(false);
  const [saving, setSaving]     = useState(false);

  const { feedback, loading, giveFeedback } = useFeedback(filter !== 'all' ? filter : undefined);

  const handleSend = (data: Record<string, unknown>) => {
    setSaving(true);
    giveFeedback(data, () => { setSaving(false); setShowGive(false); });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Feedback</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">{feedback.length} feedback item{feedback.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-brand-bg-soft border border-brand-border rounded-lg p-0.5 text-xs">
            {(['all', 'received', 'given'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium capitalize transition-colors',
                  filter === f ? 'bg-brand-bg-muted text-brand-text' : 'text-brand-text-muted hover:text-brand-text-secondary',
                )}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowGive(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Give Feedback
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-4">
          <MessageSquare className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-brand-text-secondary">No feedback yet</p>
            <p className="text-sm mt-1">Give feedback to a colleague to get started.</p>
          </div>
          <button onClick={() => setShowGive(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Give Feedback
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map(item => <FeedbackCard key={item._id} item={item} />)}
        </div>
      )}

      {showGive && (
        <GiveFeedbackDrawer onClose={() => setShowGive(false)} onSave={handleSend} saving={saving} />
      )}
    </div>
  );
}
