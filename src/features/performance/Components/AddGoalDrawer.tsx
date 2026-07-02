'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOAL_CATEGORIES, GOAL_PERIODS } from '../constants';

interface KRDraft {
  description: string;
  type: 'number' | 'percentage' | 'currency' | 'milestone';
  targetValue: string;
  startValue: string;
  unit: string;
}

interface Props {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

const emptyKR = (): KRDraft => ({ description: '', type: 'number', targetValue: '', startValue: '0', unit: '' });

export function AddGoalDrawer({ onClose, onSave, saving }: Props) {
  const [title, setTitle]           = useState('');
  const [category, setCategory]     = useState('');
  const [description, setDesc]      = useState('');
  const [period, setPeriod]         = useState('q2_2026');
  const [startDate, setStart]       = useState('');
  const [endDate, setEnd]           = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [krs, setKRs]               = useState<KRDraft[]>([]);

  const addKR    = () => setKRs(prev => [...prev, emptyKR()]);
  const removeKR = (i: number) => setKRs(prev => prev.filter((_, idx) => idx !== i));
  const setKR    = (i: number, field: keyof KRDraft, val: string) =>
    setKRs(prev => prev.map((kr, idx) => idx === i ? { ...kr, [field]: val } : kr));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;
    onSave({
      title: title.trim(),
      category,
      description: description.trim(),
      period,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
      visibility,
      keyResults: krs.filter(kr => kr.description.trim()).map(kr => ({
        description:  kr.description.trim(),
        type:         kr.type,
        targetValue:  Number(kr.targetValue) || 0,
        startValue:   Number(kr.startValue)  || 0,
        unit:         kr.unit,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100">Add New Goal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Define what you want to achieve</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form id="add-goal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Goal Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(GOAL_CATEGORIES) as [string, { label: string; icon: string }][]).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all',
                    category === key
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600',
                  )}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Provide more context…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Period + Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Period <span className="text-red-400">*</span>
              </label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {GOAL_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Visibility</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as 'private' | 'public')}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* Start / Due dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Due Date</label>
              <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {/* Key Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Key Results</label>
              <button type="button" onClick={addKR}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Key Result
              </button>
            </div>
            {krs.length === 0 && (
              <p className="text-xs text-slate-600 italic">Optional — add measurable targets for this goal.</p>
            )}
            <div className="space-y-3">
              {krs.map((kr, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={kr.description}
                      onChange={e => setKR(i, 'description', e.target.value)}
                      placeholder="Key result description…"
                      className="flex-1 h-8 bg-slate-900 border border-slate-700 rounded px-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button type="button" onClick={() => removeKR(i)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={kr.type} onChange={e => setKR(i, 'type', e.target.value)}
                      className="h-7 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                      <option value="currency">Currency</option>
                      <option value="milestone">Milestone</option>
                    </select>
                    <input value={kr.targetValue} onChange={e => setKR(i, 'targetValue', e.target.value)}
                      placeholder="Target" type="number"
                      className="h-7 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                    <input value={kr.unit} onChange={e => setKR(i, 'unit', e.target.value)}
                      placeholder="Unit (e.g. %)"
                      className="h-7 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-goal-form" disabled={saving || !title.trim() || !category}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creating…' : 'Create Goal'}
          </button>
        </div>

      </div>
    </div>
  );
}
