'use client';

import { cn } from '@/lib/utils';
import { goalStatusCfg, type Goal } from '../constants';
import { GoalCard } from './GoalCard';

const COLUMNS = [
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'at_risk',     label: 'At Risk'     },
  { key: 'completed',   label: 'Completed'   },
] as const;

interface Props {
  goals: Goal[];
  onView:   (g: Goal) => void;
  onEdit:   (g: Goal) => void;
  onDelete: (g: Goal) => void;
  onMove:   (id: string, status: string) => void;
}

export function GoalKanbanBoard({ goals, onView, onEdit, onDelete, onMove }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const cfg = goalStatusCfg(col.key);
        const colGoals = goals.filter(g => g.status === col.key);
        return (
          <div key={col.key} className="w-[260px] min-w-[260px] flex flex-col bg-slate-800/50 rounded-xl border border-slate-700 border-t-[3px] overflow-hidden"
            style={{ borderTopColor: col.key === 'not_started' ? '#64748b' : col.key === 'in_progress' ? '#3b82f6' : col.key === 'at_risk' ? '#f59e0b' : '#6366f1' }}>
            {/* Column header */}
            <div className="px-3 py-3 border-b border-slate-700 flex items-center gap-2">
              <span className={cn('text-xs font-bold', cfg.textCls)}>{col.label}</span>
              <span className={cn('ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full', cfg.bgCls, cfg.textCls)}>
                {colGoals.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-340px)]">
              {colGoals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                  <p className="text-xs">No goals here</p>
                </div>
              )}
              {colGoals.map(g => (
                <div key={g._id} className="relative group">
                  <GoalCard goal={g} onView={onView} onEdit={onEdit} onDelete={onDelete} compact />
                  {/* Move menu */}
                  <div className="absolute top-2 left-2 hidden group-hover:flex flex-col gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-lg z-10 text-[11px]">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button key={c.key}
                        onClick={(e) => { e.stopPropagation(); onMove(g._id, c.key); }}
                        className={cn('px-2 py-1 rounded text-left font-medium hover:bg-slate-800 transition-colors', goalStatusCfg(c.key).textCls)}>
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
