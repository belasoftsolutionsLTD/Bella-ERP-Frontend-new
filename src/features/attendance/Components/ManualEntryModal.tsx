'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { ManualAttendanceSchema } from '../schemas';

interface EmployeeOption { _id: string; fullName: string; staffNumber?: string }

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'remote', label: 'Remote' },
];

export function ManualEntryModal({ employees, defaultEmployeeId, defaultDate, onClose, onSaved }: {
  employees: EmployeeOption[];
  defaultEmployeeId?: string;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? '');
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('present');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaveConflict, setLeaveConflict] = useState(false);

  const submit = (override = false) => {
    const parsed = ManualAttendanceSchema.safeParse({ employeeId, date, status, checkInTime, checkOutTime, notes, overrideLeaveConflict: override });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Please check the form.'); return; }
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance`,
      method: 'POST',
      data: { employeeId, date, status, checkInTime: checkInTime || null, checkOutTime: checkOutTime || null, notes: notes || null, overrideLeaveConflict: override },
      showToast: false,
      thenFn: () => { toast.success('Attendance record saved.'); onSaved(); onClose(); },
      catchFn: (err: unknown) => {
        const e = err as { response?: { status?: number; data?: { message?: string; data?: { leaveConflict?: boolean } } } };
        if (e?.response?.status === 409 && e.response.data?.data?.leaveConflict) {
          setLeaveConflict(true);
        } else {
          toast.error(e?.response?.data?.message ?? 'Failed to save entry.');
        }
      },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white border border-brand-border rounded-2xl shadow-2xl p-6 w-96 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-brand-text">Add Manual Entry</p>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>

        {leaveConflict ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                This employee has approved leave covering {date}. Save this entry anyway?
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLeaveConflict(false)} className="flex-1 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">
                Cancel
              </button>
              <button onClick={() => submit(true)} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-sm font-bold text-white transition-colors">
                Save Anyway
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-brand-text-secondary block mb-1">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">Select employee…</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}{e.staffNumber ? ` (${e.staffNumber})` : ''}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-text-secondary block mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary block mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-text-secondary block mb-1">Check In</label>
                <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-xs text-brand-text-secondary block mb-1">Check Out</label>
                <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs text-brand-text-secondary block mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
            </div>
            <button onClick={() => submit(false)} disabled={saving}
              className="w-full h-10 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold text-sm transition-colors">
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
