'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEmployees } from '@/features/employees/Hooks/useEmployees';

interface Props {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

export function ScheduleOneOnOneModal({ onClose, onSave, saving }: Props) {
  const { employees } = useEmployees({ limit: 1000 });
  const [employeeId, setEmployeeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = () => {
    if (!employeeId || !scheduledAt) return;
    onSave({ employeeId, scheduledAt });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Schedule 1-on-1</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Direct Report</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Date &amp; Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!employeeId || !scheduledAt || saving}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
