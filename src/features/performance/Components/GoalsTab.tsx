'use client';

import { useState } from 'react';
import { Plus, LayoutList, LayoutGrid, Loader2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoals } from '../Hooks/useGoals';
import { GOAL_PERIODS, type Goal } from '../constants';
import { GoalCard } from './GoalCard';
import { GoalKanbanBoard } from './GoalKanbanBoard';
import { AddGoalDrawer } from './AddGoalDrawer';
import { GoalDetailDrawer } from './GoalDetailDrawer';

export function GoalsTab() {
  const [view, setView]           = useState<'list' | 'board'>('list');
  const [period, setPeriod]       = useState('q2_2026');
  const [showAdd, setShowAdd]     = useState(false);
  const [viewing, setViewing]     = useState<Goal | null>(null);
  const [editing, setEditing]     = useState<Goal | null>(null);
  const [saving, setSaving]       = useState(false);

  const { goals, loading, refetch, createGoal, updateGoal, deleteGoal, addCheckin, addComment } = useGoals({ period });

  const onTrack  = goals.filter(g => g.status === 'in_progress' && g.progress >= 50).length;
  const atRisk   = goals.filter(g => g.status === 'at_risk').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const total     = goals.length;
  const overallPct = total > 0 ? Math.round((goals.reduce((s, g) => s + (g.progress ?? 0), 0) / (total * 100)) * 100) : 0;

  const handleCreate = (data: Record<string, unknown>) => {
    setSaving(true);
    createGoal(data, () => { setSaving(false); setShowAdd(false); });
  };

  const handleDelete = (g: Goal) => {
    if (!confirm(`Delete goal "${g.title}"?`)) return;
    deleteGoal(g._id);
    if (viewing?._id === g._id) setViewing(null);
  };

  const handleMove = (id: string, status: string) => {
    updateGoal(id, { status } as Partial<Goal>);
  };

  const handleCheckin = (id: string, progress: number, note: string) => {
    addCheckin(id, progress, note, () => {
      setViewing(prev => prev ? { ...prev, progress, checkIns: [...(prev.checkIns ?? []), { progress, note, updatedBy: '', updatedAt: new Date().toISOString() }] } : null);
    });
  };

  const handleComment = (id: string, text: string) => {
    addComment(id, text, () => refetch());
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100">My Goals</h2>
          <p className="text-xs text-slate-400 mt-0.5">{total} goal{total !== 1 ? 's' : ''} this period</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
            {GOAL_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {/* View toggle */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button onClick={() => setView('list')}
              className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300')}>
              <LayoutList className="h-4 w-4" />
            </button>
            <button onClick={() => setView('board')}
              className={cn('p-1.5 rounded-md transition-colors', view === 'board' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300')}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Add Goal
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'On Track',  count: onTrack,  bgCls: 'bg-emerald-950', borderCls: 'border-emerald-800', textCls: 'text-emerald-400' },
            { label: 'At Risk',   count: atRisk,   bgCls: 'bg-amber-950',   borderCls: 'border-amber-800',   textCls: 'text-amber-400'   },
            { label: 'Completed', count: completed, bgCls: 'bg-indigo-950',  borderCls: 'border-indigo-800',  textCls: 'text-indigo-400'  },
            { label: 'Overall',   count: `${overallPct}%`, bgCls: 'bg-slate-800', borderCls: 'border-slate-700', textCls: 'text-slate-200' },
          ].map(({ label, count, bgCls, borderCls, textCls }) => (
            <div key={label} className={cn('rounded-xl border p-4', bgCls, borderCls)}>
              <p className={cn('text-2xl font-black', textCls)}>{count}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label === 'Overall' ? 'Completion rate' : `${label} goal${Number(count) !== 1 ? 's' : ''}`}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
          <Target className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-slate-400">No goals for this period</p>
            <p className="text-sm mt-1">Set your first goal to start tracking progress</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Add Goal
          </button>
        </div>
      ) : view === 'list' ? (
        <div>
          {goals.map(g => (
            <GoalCard key={g._id} goal={g} onView={setViewing} onEdit={setEditing} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <GoalKanbanBoard goals={goals} onView={setViewing} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} />
      )}

      {/* Drawers / modals */}
      {showAdd && (
        <AddGoalDrawer onClose={() => setShowAdd(false)} onSave={handleCreate} saving={saving} />
      )}

      {viewing && (
        <GoalDetailDrawer
          goal={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onCheckin={(progress, note) => handleCheckin(viewing._id, progress, note)}
          onComment={(text) => handleComment(viewing._id, text)}
        />
      )}

      {editing && (
        <AddGoalDrawer
          onClose={() => setEditing(null)}
          onSave={(data) => {
            updateGoal(editing._id, data as Partial<Goal>, () => setEditing(null));
          }}
        />
      )}
    </div>
  );
}
