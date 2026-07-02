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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm text-white font-bold shrink-0">
            {item.giverName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {item.isAnonymous ? 'Anonymous' : item.giverName}
              <span className="text-slate-500 font-normal"> → {item.recipientName}</span>
            </p>
            <p className="text-[11px] text-slate-500">{timeAgo(item.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.category && item.category !== 'general' && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize">{item.category}</span>
          )}
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', typeCfg.cls)}>
            {typeCfg.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
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
          <h2 className="text-base font-bold text-slate-100">Feedback</h2>
          <p className="text-xs text-slate-400 mt-0.5">{feedback.length} feedback item{feedback.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
            {(['all', 'received', 'given'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium capitalize transition-colors',
                  filter === f ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
                )}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowGive(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Give Feedback
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
          <MessageSquare className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-slate-400">No feedback yet</p>
            <p className="text-sm mt-1">Give feedback to a colleague to get started.</p>
          </div>
          <button onClick={() => setShowGive(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
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
