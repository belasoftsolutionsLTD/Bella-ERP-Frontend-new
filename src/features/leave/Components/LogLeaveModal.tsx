'use client';

import { useState, useEffect } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

function countWorkingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const LEAVE_TYPES = [
  { value: 'annual',     label: 'Annual Leave' },
  { value: 'sick',       label: 'Sick Leave' },
  { value: 'maternity',  label: 'Maternity Leave' },
  { value: 'paternity',  label: 'Paternity Leave' },
  { value: 'unpaid',     label: 'Unpaid Leave' },
  { value: 'emergency',  label: 'Emergency Leave' },
];

interface Employee { _id: string; fullName: string; staffNumber: string; designation: string }

interface Props {
  /** Pre-fill employee (Staff Portal). When omitted, show employee picker (HR page). */
  employeeId?: string;
  employeeName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogLeaveModal({ employeeId, employeeName, onClose, onSuccess }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employeeId: employeeId ?? '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      apiCallFunction<any>({
        url: `${API_BASE_URL}/employees`,
        params: { limit: 300, status: 'active' },
        showToast: false,
        thenFn: (r) => setEmployees(r.data?.data ?? []),
      });
    }
  }, [employeeId]);

  const set = (field: keyof typeof form, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const workingDays = (form.startDate && form.endDate) ? countWorkingDays(form.startDate, form.endDate) : null;
  const calendarDays = (() => {
    if (!form.startDate || !form.endDate) return null;
    const diff = (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000 + 1;
    return diff > 0 ? diff : null;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests`,
      method: 'POST',
      data: form,
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  const title = employeeId ? `Apply Leave — ${employeeName}` : 'Log Leave Request';
  const subtitle = employeeId ? 'Submit a leave request on behalf of this employee' : 'Log a leave request for any employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-primary">{title}</h2>
            <p className="text-xs text-foreground/50">{subtitle}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="log-leave-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Employee picker — only when not pre-filled */}
          {!employeeId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                Employee <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => set('employeeId', e.target.value)}
                  className="appearance-none h-10 w-full border border-gray-200 rounded-xl px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} — {emp.designation} ({emp.staffNumber})
                    </option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none text-xs">▾</span>
              </div>
            </div>
          )}

          {/* Leave type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Leave Type <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map((lt) => (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => set('leaveType', lt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.leaveType === lt.value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-foreground/60 border-gray-200 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
            <input type="hidden" required value={form.leaveType} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                Start Date <span className="text-danger">*</span>
              </label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                End Date <span className="text-danger">*</span>
              </label>
              <input
                required
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Day count pill */}
          {calendarDays !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                {workingDays !== null && workingDays > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {workingDays} working day{workingDays !== 1 ? 's' : ''}
                  </span>
                ) : null}
                {calendarDays !== workingDays && calendarDays !== null && (
                  <span className="text-foreground/40 text-xs">{calendarDays} calendar days</span>
                )}
              </div>
              {workingDays === 0 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  ⚠ Your selected dates fall entirely on weekends or holidays. Please include at least one working day.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Reason <span className="text-danger">*</span>
            </label>
            <textarea
              required
              minLength={5}
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="Briefly describe the reason for this leave…"
              rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="log-leave-form"
            variant="accent"
            disabled={submitting || !form.leaveType || workingDays === 0}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}
