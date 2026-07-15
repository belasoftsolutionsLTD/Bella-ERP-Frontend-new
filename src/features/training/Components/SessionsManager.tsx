'use client';

import { useState } from 'react';
import { Plus, Trash2, Users, Video, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourseSessions } from '../Hooks/useSessions';
import { useUserAccounts } from '../Hooks/useUserAccounts';
import type { TrainingSession } from '../types';

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

function AttendanceModal({ session, onClose, onSave }: {
  session: TrainingSession;
  onClose: () => void;
  onSave: (attendance: { employeeId: string; attended: boolean }[]) => void;
}) {
  const { accounts } = useUserAccounts();
  const [attended, setAttended] = useState<Set<string>>(
    new Set(session.attendance.filter((a) => a.attended).map((a) => a.employeeId)),
  );
  const registrants = accounts.filter((a) => session.attendeeIds.includes(a._id));

  const toggle = (id: string) => setAttended((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Mark Attendance — {session.title}</h3>
        {registrants.length === 0 ? (
          <p className="text-sm text-slate-400">No one registered for this session.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {registrants.map((r) => (
              <label key={r._id} className="flex items-center gap-2 py-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={attended.has(r._id)} onChange={() => toggle(r._id)} />
                {r.name}
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-brand-primary text-white" onClick={() => {
            onSave(registrants.map((r) => ({ employeeId: r._id, attended: attended.has(r._id) })));
            onClose();
          }}>
            Save Attendance
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SessionsManager({ courseId }: { courseId: string }) {
  const { sessions, createSession, updateSession, deleteSession, markAttendance } = useCourseSessions(courseId);
  const { accounts } = useUserAccounts();
  const [showNew, setShowNew] = useState(false);
  const [attendanceFor, setAttendanceFor] = useState<TrainingSession | null>(null);
  const [form, setForm] = useState({
    title: '', facilitatorId: '', scheduledAt: '', durationMinutes: 50, meetingLink: '', capacity: '' as number | '',
  });

  const submit = async () => {
    const facilitator = accounts.find((a) => a._id === form.facilitatorId);
    const result = await createSession({
      title: form.title || undefined,
      facilitatorId: form.facilitatorId || undefined,
      facilitatorName: facilitator?.name,
      scheduledAt: form.scheduledAt,
      durationMinutes: Number(form.durationMinutes),
      meetingLink: form.meetingLink,
      capacity: form.capacity ? Number(form.capacity) : null,
    });
    if (result) {
      setShowNew(false);
      setForm({ title: '', facilitatorId: '', scheduledAt: '', durationMinutes: 50, meetingLink: '', capacity: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Live Sessions</h2>
        <Button size="sm" className="bg-brand-primary text-white" onClick={() => setShowNew((s) => !s)}><Plus className="h-4 w-4 mr-1" /> Schedule Session</Button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <input placeholder="Session title (optional, defaults to course title)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.facilitatorId} onChange={(e) => setForm((f) => ({ ...f, facilitatorId: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Facilitator (optional)</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
            <input type="number" placeholder="Capacity (blank = unlimited)" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value ? Number(e.target.value) : '' }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" placeholder="Duration (minutes)" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <input placeholder="Meeting link (Google Meet, Zoom, etc.)" value={form.meetingLink} onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <Button size="sm" className="bg-brand-primary text-white" onClick={submit} disabled={!form.scheduledAt || !form.meetingLink}>Schedule</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {sessions.map((s) => (
          <div key={s._id} className="p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes}min</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.attendeeIds.length}{s.capacity ? `/${s.capacity}` : ''} registered</span>
                  {s.facilitatorName && <span>· {s.facilitatorName}</span>}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>{s.status}</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"><Video className="h-3 w-3" /> Meeting link</a>
              {s.status === 'scheduled' && (
                <>
                  <button onClick={() => setAttendanceFor(s)} className="text-xs text-brand-primary hover:underline">Mark Attendance</button>
                  <button onClick={() => deleteSession(s._id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3" /> Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No sessions scheduled yet.</p>}
      </div>

      {attendanceFor && (
        <AttendanceModal
          session={attendanceFor}
          onClose={() => setAttendanceFor(null)}
          onSave={(attendance) => markAttendance(attendanceFor._id, attendance)}
        />
      )}
    </div>
  );
}
