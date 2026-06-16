'use client';

import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const STATUS_OPTIONS = [
  { value: 'present',  label: 'Present',   color: 'text-emerald-600' },
  { value: 'absent',   label: 'Absent',    color: 'text-red-600' },
  { value: 'late',     label: 'Late',      color: 'text-amber-600' },
  { value: 'half_day', label: 'Half Day',  color: 'text-orange-600' },
  { value: 'remote',   label: 'Remote',    color: 'text-blue-600' },
];

interface Employee { _id: string; fullName: string; staffNumber: string; department: string }

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const today = new Date().toISOString().split('T')[0];

export function MarkAttendanceModal({ onClose, onSuccess }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employeeId: '',
    date: today,
    status: 'present',
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      params: { limit: 300, status: 'active' },
      showToast: false,
      thenFn: (r) => setEmployees(r.data?.data ?? []),
    });
  }, []);

  const set = (field: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance`,
      method: 'POST',
      data: {
        employeeId: form.employeeId,
        date: form.date,
        status: form.status,
        checkInTime: form.checkInTime || null,
        checkOutTime: form.checkOutTime || null,
        notes: form.notes || null,
      },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-primary">Mark Attendance</h2>
            <p className="text-xs text-foreground/50">Record attendance for a single employee</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="mark-attendance-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Employee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Employee <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={form.employeeId}
                onChange={(e) => set('employeeId', e.target.value)}
                className="appearance-none h-10 w-full border border-gray-200 rounded-xl px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.staffNumber})
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none">▾</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Status <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {STATUS_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('status', value)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    form.status === value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : `border-gray-200 bg-white ${color} hover:border-primary/30`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Check-in</label>
              <input
                type="time"
                value={form.checkInTime}
                onChange={(e) => set('checkInTime', e.target.value)}
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Check-out</label>
              <input
                type="time"
                value={form.checkOutTime}
                onChange={(e) => set('checkOutTime', e.target.value)}
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="mark-attendance-form" variant="accent" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Record'}
          </Button>
        </div>
      </div>
    </div>
  );
}
