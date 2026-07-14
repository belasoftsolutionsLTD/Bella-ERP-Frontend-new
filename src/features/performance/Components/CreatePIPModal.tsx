'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useEmployees } from '@/features/employees/Hooks/useEmployees';

interface Props {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

let tmpId = 0;
const nextTmpId = () => `tmp-${Date.now()}-${tmpId++}`;

export function CreatePIPModal({ onClose, onSave, saving }: Props) {
  const { employees } = useEmployees({ limit: 1000 });
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goals, setGoals] = useState<{ tmpId: string; description: string; targetDate: string }[]>([
    { tmpId: nextTmpId(), description: '', targetDate: '' },
  ]);

  const addGoal = () => setGoals((g) => [...g, { tmpId: nextTmpId(), description: '', targetDate: '' }]);
  const removeGoal = (id: string) => setGoals((g) => g.filter((x) => x.tmpId !== id));
  const updateGoal = (id: string, patch: Partial<{ description: string; targetDate: string }>) =>
    setGoals((g) => g.map((x) => (x.tmpId === id ? { ...x, ...patch } : x)));

  const canSave = employeeId && reason.trim() && startDate && endDate && goals.some((g) => g.description.trim());

  const handleSubmit = () => {
    onSave({
      employeeId,
      reason: reason.trim(),
      startDate,
      endDate,
      goals: goals.filter((g) => g.description.trim()).map((g) => ({ description: g.description.trim(), targetDate: g.targetDate || undefined })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">Start Performance Improvement Plan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Employee <span className="text-red-400">*</span></label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Reason <span className="text-red-400">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Why is this plan being started?"
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Start Date <span className="text-red-400">*</span></label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">End Date <span className="text-red-400">*</span></label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Improvement Goals</label>
              <button type="button" onClick={addGoal} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                <Plus className="h-3.5 w-3.5" /> Add Goal
              </button>
            </div>
            <div className="space-y-2">
              {goals.map((g) => (
                <div key={g.tmpId} className="flex items-start gap-2">
                  <input value={g.description} onChange={(e) => updateGoal(g.tmpId, { description: e.target.value })}
                    placeholder="What needs to improve?"
                    className="flex-1 h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                  <input type="date" value={g.targetDate} onChange={(e) => updateGoal(g.tmpId, { targetDate: e.target.value })}
                    className="h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-2 text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
                  {goals.length > 1 && (
                    <button type="button" onClick={() => removeGoal(g.tmpId)} className="p-2 text-brand-text-muted hover:text-red-400 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!canSave || saving}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
