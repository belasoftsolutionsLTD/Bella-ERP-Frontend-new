'use client';

import { useState } from 'react';
import { X, MessageSquare, TrendingUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { goalStatusCfg, GOAL_CATEGORIES, type Goal } from '../constants';

type Tab = 'overview' | 'checkins' | 'comments';

interface Props {
  goal: Goal;
  onClose: () => void;
  onCheckin: (progress: number, note: string) => void;
  onComment: (text: string) => void;
  onEdit: () => void;
}

function progressColor(s: string) {
  if (s === 'completed')   return 'bg-indigo-500';
  if (s === 'at_risk')     return 'bg-amber-500';
  if (s === 'behind')      return 'bg-red-500';
  if (s === 'in_progress') return 'bg-blue-500';
  return 'bg-slate-500';
}

export function GoalDetailDrawer({ goal, onClose, onCheckin, onComment, onEdit }: Props) {
  const [tab, setTab]             = useState<Tab>('overview');
  const [checkinPct, setCheckin]  = useState(goal.progress ?? 0);
  const [checkinNote, setNote]    = useState('');
  const [commentText, setComment] = useState('');

  const cfg = goalStatusCfg(goal.status);
  const cat = GOAL_CATEGORIES[goal.category as keyof typeof GOAL_CATEGORIES];

  const handleCheckin = () => {
    onCheckin(checkinPct, checkinNote);
    setNote('');
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(commentText.trim());
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className={cn('px-6 py-4 border-b border-slate-700 border-l-[4px] shrink-0 rounded-tl-2xl rounded-tr-2xl', cfg.borderCls)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {cat && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{cat.icon} {cat.label}</span>}
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.bgCls, cfg.textCls)}>{cfg.label}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 leading-snug">{goal.title}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onEdit}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">
                Edit
              </button>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-slate-200">{goal.progress ?? 0}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', progressColor(goal.status))}
                style={{ width: `${Math.min(100, goal.progress ?? 0)}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 shrink-0 px-6">
          {(['overview', 'checkins', 'comments'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'py-3 mr-6 text-sm font-medium border-b-2 transition-colors capitalize',
                tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300',
              )}>
              {t === 'checkins' ? 'Progress' : t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {tab === 'overview' && (
            <div className="p-6 space-y-5">
              {goal.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{goal.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Period',     value: goal.period?.replace('_', ' ').toUpperCase() },
                  { label: 'Visibility', value: goal.visibility || 'private' },
                  { label: 'Start Date', value: goal.startDate ? new Date(goal.startDate).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—' },
                  { label: 'Due Date',   value: goal.endDate   ? new Date(goal.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })   : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-slate-200 font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {goal.keyResults?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Key Results</p>
                  <div className="space-y-3">
                    {goal.keyResults.map((kr, i) => {
                      const pct = kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0;
                      return (
                        <div key={kr._id ?? i} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm text-slate-200">{kr.description}</p>
                            {kr.isCompleted
                              ? <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                              : <span className="text-xs text-slate-500 shrink-0">{kr.currentValue}/{kr.targetValue}{kr.unit ? ' ' + kr.unit : ''}</span>
                            }
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'checkins' && (
            <div className="p-6 space-y-5">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add Progress Update</p>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">New Progress</span>
                    <span className="text-sm font-bold text-slate-200">{checkinPct}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={checkinPct}
                    onChange={e => setCheckin(Number(e.target.value))}
                    className="w-full h-2 rounded-full accent-indigo-500" />
                </div>
                <textarea value={checkinNote} onChange={e => setNote(e.target.value)}
                  placeholder="What did you accomplish? Any blockers?" rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
                <button onClick={handleCheckin}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Save Update
                </button>
              </div>
              {goal.checkIns?.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">History</p>
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-700" />
                    <div className="space-y-4">
                      {[...goal.checkIns].reverse().map((ci, i) => (
                        <div key={i} className="flex gap-4 relative pl-9">
                          <div className="absolute left-2 top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900" />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{ci.progress}% complete</p>
                            {ci.note && <p className="text-xs text-slate-400 mt-0.5">{ci.note}</p>}
                            <p className="text-[11px] text-slate-600 mt-1">{new Date(ci.updatedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">No progress updates yet.</p>
              )}
            </div>
          )}

          {tab === 'comments' && (
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <textarea value={commentText} onChange={e => setComment(e.target.value)}
                  placeholder="Leave a comment…" rows={2}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
                <button onClick={handleComment}
                  className="self-end px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Post
                </button>
              </div>
              {goal.comments?.length > 0 ? (
                <div className="space-y-3">
                  {[...goal.comments].reverse().map((c) => (
                    <div key={c._id} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold">
                          {c.authorName?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <span className="text-xs font-semibold text-slate-300">{c.authorName}</span>
                        <span className="text-[11px] text-slate-600">· {new Date(c.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">No comments yet.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
