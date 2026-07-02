'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { goalStatusCfg, GOAL_CATEGORIES, type Goal } from '../constants';

interface Props {
  goal: Goal;
  onView: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
  compact?: boolean;
}

function progressBarColor(status: string) {
  if (status === 'completed')  return 'bg-indigo-500';
  if (status === 'at_risk')    return 'bg-amber-500';
  if (status === 'behind')     return 'bg-red-500';
  if (status === 'in_progress') return 'bg-blue-500';
  return 'bg-slate-500';
}

export function GoalCard({ goal, onView, onEdit, onDelete, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cfg = goalStatusCfg(goal.status);
  const cat = GOAL_CATEGORIES[goal.category as keyof typeof GOAL_CATEGORIES];

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const dueLabel = goal.endDate ? (() => {
    const due = new Date(goal.endDate);
    const now = new Date();
    const overdue = due < now && goal.status !== 'completed';
    const str = due.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    return { str: `Due ${str}`, overdue };
  })() : null;

  const periodLabel = (() => {
    const p = goal.period ?? '';
    return p.replace('_', ' ').toUpperCase();
  })();

  return (
    <div
      onClick={() => onView(goal)}
      className={cn(
        'relative bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/40',
        `border-l-[4px] ${cfg.borderCls}`,
        compact ? 'p-3' : 'p-5 mb-3',
      )}
    >
      {/* Row 1 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn('font-bold text-slate-100 leading-snug flex-1', compact ? 'text-sm' : 'text-[15px]')}>
          {goal.title}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bgCls, cfg.textCls)}>
            {cfg.label}
          </span>
          <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 text-sm">
                <button className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => { setMenuOpen(false); onView(goal); }}>View</button>
                <button className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => { setMenuOpen(false); onEdit(goal); }}>Edit</button>
                <button className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-slate-800 hover:text-red-300" onClick={() => { setMenuOpen(false); onDelete(goal); }}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: badges */}
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          {cat && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{cat.icon} {cat.label}</span>}
          {periodLabel && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{periodLabel}</span>}
        </div>
      )}

      {/* Row 3: description */}
      {!compact && goal.description && (
        <p className="text-[13px] text-slate-400 line-clamp-2 mb-3">{goal.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        {!compact && <p className="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wide">Progress</p>}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', progressBarColor(goal.status))}
              style={{ width: `${Math.min(100, goal.progress ?? 0)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-300 w-8 text-right">{goal.progress ?? 0}%</span>
        </div>
      </div>

      {/* Key results toggle */}
      {!compact && goal.keyResults?.length > 0 && (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {goal.keyResults.length} Key Result{goal.keyResults.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2 pl-1 border-l border-slate-700">
              {goal.keyResults.map((kr, i) => {
                const pct = kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0;
                return (
                  <div key={kr._id ?? i} className="pl-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] text-slate-300 leading-snug">{kr.description}</p>
                      <span className={cn('text-[11px] shrink-0', kr.isCompleted ? 'text-indigo-400' : 'text-slate-500')}>
                        {kr.isCompleted ? '✓' : `${kr.currentValue}/${kr.targetValue}${kr.unit ? ' ' + kr.unit : ''}`}
                      </span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!compact && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            {dueLabel && (
              <span className={cn('text-[12px] font-medium', dueLabel.overdue ? 'text-red-400' : 'text-slate-500')}>
                {dueLabel.str}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-600">
            {goal.updatedAt ? `Updated ${Math.floor((Date.now() - new Date(goal.updatedAt).getTime()) / 86400000)}d ago` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
