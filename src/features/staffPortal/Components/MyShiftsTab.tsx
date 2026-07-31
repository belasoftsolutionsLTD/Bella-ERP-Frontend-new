'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, CalendarDays, CheckCircle2, XCircle, Loader2, Inbox, X, ListChecks, MessageSquare, AlertTriangle, Plus, LogIn, LogOut, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { API_BASE_URL } from '@/configs/constants';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { useClockIn, type WorkLocation } from '@/contexts/ClockInContext';

interface Shift {
  _id: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  location: string;
  notes?: string;
  isOpen?: boolean;
  address?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
}

interface ShiftApplication {
  _id: string;
  shiftId: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  createdAt: string;
  shift: Shift | null;
}

interface ShiftTask { _id: string; title: string; completed: boolean; order: number }
interface ShiftNote { _id: string; type: 'progress' | 'incident'; text: string; authorName: string; createdAt: string }

const LOCATION_COLORS: Record<string, string> = {
  office:       'text-sky-400',
  remote:       'text-emerald-400',
  field:        'text-orange-400',
  'client site':'text-violet-400',
};

const APP_STATUS_MAP: Record<string, Status> = {
  pending: 'pending', approved: 'approved', rejected: 'rejected',
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ShiftCard({ shift, badge, action }: { shift: Shift; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/5 shrink-0">
        <span className="text-xs font-bold text-primary uppercase">{new Date(shift.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</span>
        <span className="text-lg font-black text-primary leading-none">{new Date(shift.date + 'T00:00:00').getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{fmtDate(shift.date)}</p>
          {badge}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-foreground/50">
            <Clock className="h-3 w-3" /> {shift.startTime} – {shift.endTime}
          </span>
          <span className={cn('flex items-center gap-1 text-xs font-medium', LOCATION_COLORS[shift.location] ?? 'text-foreground/50')}>
            <MapPin className="h-3 w-3" /> {shift.location}
          </span>
          {shift.notes && <span className="text-xs text-foreground/40 truncate max-w-[200px]">{shift.notes}</span>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Maps a shift's location label onto the existing org-wide clock-in system's
// WorkLocation type — attendance is tracked once per employee per day (not per shift),
// so this reuses that exact same mechanism rather than inventing a separate one.
function shiftLocationToWorkLocation(location: string): WorkLocation {
  if (location === 'remote') return 'remote';
  if (location === 'field' || location === 'client site') return 'client_site';
  return 'office';
}

function ShiftClockControl({ shift }: { shift: Shift }) {
  const { record, clockIn, clockOut, busy, loading } = useClockIn();
  const clockedIn = !!record?.checkInTime;
  const clockedOut = !!record?.checkOutTime;

  if (loading) return null;

  if (clockedOut) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-2 text-xs font-semibold text-primary">
        <CheckCircle2 className="h-4 w-4" /> Clocked out for today ({record?.checkInTime}–{record?.checkOutTime})
      </div>
    );
  }
  if (clockedIn) {
    return (
      <button onClick={() => clockOut()} disabled={busy}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold disabled:opacity-50 hover:bg-red-500/20 transition-colors">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Clock Out
      </button>
    );
  }
  return (
    <button onClick={() => clockIn(shiftLocationToWorkLocation(shift.location))} disabled={busy}
      className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Clock In
    </button>
  );
}

function ShiftDetailModal({ shift, onClose }: { shift: Shift; onClose: () => void }) {
  const [tab, setTab] = useState<'tasks' | 'progress' | 'handover'>('tasks');
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [handover, setHandover] = useState<{ previousShift: { date: string; employeeName: string } | null; notes: ShiftNote[] }>({ previousShift: null, notes: [] });
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteType, setNoteType] = useState<'progress' | 'incident'>('progress');
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchTasks = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/${shift._id}/tasks`, showToast: false, thenFn: r => setTasks(r.data ?? []) });
  }, [shift._id]);
  const fetchNotes = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/${shift._id}/notes`, showToast: false, thenFn: r => setNotes(r.data ?? []) });
  }, [shift._id]);
  const fetchHandover = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/${shift._id}/handover`, showToast: false, thenFn: r => setHandover(r.data ?? { previousShift: null, notes: [] }) });
  }, [shift._id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(res => { fetchTasks(); res(); }),
      new Promise<void>(res => { fetchNotes(); res(); }),
      new Promise<void>(res => { fetchHandover(); res(); }),
    ]).finally(() => setLoading(false));
  }, [fetchTasks, fetchNotes, fetchHandover]);

  const toggleTask = (task: ShiftTask) => {
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: !t.completed } : t));
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/${shift._id}/tasks/${task._id}`,
      method: 'PATCH',
      data: { completed: !task.completed },
      showToast: false,
      catchFn: () => fetchTasks(), // roll back the optimistic toggle on failure
    });
  };

  const submitNote = () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/${shift._id}/notes`,
      method: 'POST',
      data: { type: noteType, text: noteText.trim() },
      thenFn: () => { setNoteText(''); setShowAddNote(false); fetchNotes(); },
      finallyFn: () => setSubmittingNote(false),
    });
  };

  const doneCount = tasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-foreground">{fmtDate(shift.date)}</p>
            <p className="text-xs text-foreground/50">{shift.startTime}–{shift.endTime} · {shift.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 shrink-0 space-y-3">
          <ShiftClockControl shift={shift} />
          {shift.address && shift.addressLat != null && shift.addressLng != null && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <iframe
                title="Shift location map"
                className="w-full h-36 border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${shift.addressLng - 0.01}%2C${shift.addressLat - 0.01}%2C${shift.addressLng + 0.01}%2C${shift.addressLat + 0.01}&layer=mapnik&marker=${shift.addressLat}%2C${shift.addressLng}`}
              />
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50">
                <p className="text-xs text-foreground/60 truncate">{shift.address}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${shift.addressLat},${shift.addressLng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  Get Directions
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 shrink-0">
          {([
            { key: 'tasks',    label: 'Tasks',    icon: ListChecks,    count: tasks.length ? `${doneCount}/${tasks.length}` : null },
            { key: 'progress', label: 'Progress', icon: MessageSquare, count: notes.length || null },
            { key: 'handover', label: 'Handover', icon: History,       count: handover.notes.length || null },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground')}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}{t.count ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-primary/40" /></div>
          ) : tab === 'tasks' ? (
            tasks.length === 0 ? (
              <p className="text-sm text-foreground/40 text-center py-8">No checklist attached to this shift.</p>
            ) : (
              <div className="space-y-1">
                {tasks.map(t => (
                  <label key={t._id} className="flex items-start gap-3 py-2 cursor-pointer select-none">
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t)} className="mt-0.5 h-4 w-4 rounded" />
                    <span className={cn('text-sm', t.completed ? 'line-through text-foreground/40' : 'text-foreground')}>{t.title}</span>
                  </label>
                ))}
              </div>
            )
          ) : tab === 'progress' ? (
            <div className="space-y-4">
              {!showAddNote ? (
                <button onClick={() => setShowAddNote(true)} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80">
                  <Plus className="h-4 w-4" /> Add Note
                </button>
              ) : (
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <div className="flex gap-2">
                    {(['progress', 'incident'] as const).map(ty => (
                      <button key={ty} type="button" onClick={() => setNoteType(ty)}
                        className={cn('px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors',
                          noteType === ty ? (ty === 'incident' ? 'bg-red-500 text-white' : 'bg-primary text-white') : 'bg-gray-100 text-foreground/60')}>
                        {ty}
                      </button>
                    ))}
                  </div>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                    placeholder={noteType === 'incident' ? 'Describe what happened…' : 'What did you do / observe?'}
                    className="w-full px-3 py-2 bg-gray-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddNote(false)} className="text-xs text-foreground/50 hover:text-foreground px-2 py-1">Cancel</button>
                    <button onClick={submitNote} disabled={submittingNote || !noteText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
                      {submittingNote ? 'Saving…' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}
              {notes.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-8">No notes logged for this shift yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n._id} className={cn('rounded-xl border px-3 py-2.5', n.type === 'incident' ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-gray-50')}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {n.type === 'incident' ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <MessageSquare className="h-3.5 w-3.5 text-foreground/40" />}
                        <span className={cn('text-xs font-bold capitalize', n.type === 'incident' ? 'text-red-600' : 'text-foreground/60')}>{n.type}</span>
                        <span className="text-xs text-foreground/30 ml-auto">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!handover.previousShift ? (
                <p className="text-sm text-foreground/40 text-center py-8">No prior shift notes to hand over — this is either the first shift here, or the previous one has none.</p>
              ) : (
                <>
                  <p className="text-xs text-foreground/50">
                    Notes from the previous shift ({fmtDate(handover.previousShift.date)}, handled by <span className="font-semibold text-foreground/70">{handover.previousShift.employeeName}</span>) — pick up from here.
                  </p>
                  {handover.notes.length === 0 ? (
                    <p className="text-sm text-foreground/40 text-center py-8">That shift ended with no notes logged.</p>
                  ) : (
                    <div className="space-y-2">
                      {handover.notes.map(n => (
                        <div key={n._id} className={cn('rounded-xl border px-3 py-2.5', n.type === 'incident' ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-gray-50')}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {n.type === 'incident' ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <MessageSquare className="h-3.5 w-3.5 text-foreground/40" />}
                            <span className={cn('text-xs font-bold capitalize', n.type === 'incident' ? 'text-red-600' : 'text-foreground/60')}>{n.type}</span>
                            <span className="text-xs text-foreground/30 ml-auto">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-foreground/80">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyShiftsTab() {
  const [myShifts,      setMyShifts]      = useState<Shift[]>([]);
  const [openShifts,    setOpenShifts]    = useState<Shift[]>([]);
  const [applications,  setApplications]  = useState<ShiftApplication[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [applying,      setApplying]      = useState<string | null>(null);
  const [tab,           setTab]           = useState<'mine' | 'open' | 'applied'>('mine');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/my`,               showToast: false, thenFn: r => { setMyShifts(r.data ?? []);     res(); }, catchFn: () => res() })),
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/open`,             showToast: false, thenFn: r => { setOpenShifts(r.data ?? []);   res(); }, catchFn: () => res() })),
      new Promise<void>(res => apiCallFunction<any>({ url: `${API_BASE_URL}/attendance/shifts/my-applications`,  showToast: false, thenFn: r => { setApplications(r.data ?? []); res(); }, catchFn: () => res() })),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const apply = (shiftId: string) => {
    setApplying(shiftId);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/shifts/${shiftId}/apply`,
      method: 'POST',
      thenFn: () => fetchAll(),
      finallyFn: () => setApplying(null),
    });
  };

  const appliedIds = new Set(applications.map(a => a.shiftId));

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'mine',    label: 'My Shifts',     count: myShifts.length },
          { key: 'open',    label: 'Open Shifts',   count: openShifts.length },
          { key: 'applied', label: 'My Applications', count: applications.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.key ? 'bg-white text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground')}>
            {t.label}
            {t.count > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === t.key ? 'bg-primary text-white' : 'bg-foreground/10 text-foreground/60')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My upcoming shifts */}
      {tab === 'mine' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Upcoming assigned shifts</h3>
          {myShifts.length === 0
            ? <Empty label="No upcoming shifts assigned to you" />
            : myShifts.map(s => (
                <button key={s._id} onClick={() => setSelectedShift(s)} className="w-full text-left">
                  <ShiftCard shift={s} action={<span className="text-xs text-primary font-semibold">View →</span>} />
                </button>
              ))}
        </div>
      )}

      {/* Open shifts available to apply for */}
      {tab === 'open' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Available open shifts</h3>
          {openShifts.length === 0
            ? <Empty label="No open shifts available right now" />
            : openShifts.map(s => {
                const alreadyApplied = appliedIds.has(s._id);
                return (
                  <ShiftCard key={s._id} shift={s}
                    badge={<span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Open</span>}
                    action={
                      alreadyApplied
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="h-4 w-4" /> Applied</span>
                        : <button onClick={() => apply(s._id)} disabled={applying === s._id}
                            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {applying === s._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                          </button>
                    }
                  />
                );
              })}
        </div>
      )}

      {/* My applications */}
      {tab === 'applied' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">Your shift applications</h3>
          {applications.length === 0
            ? <Empty label="You haven't applied for any shifts yet" />
            : applications.map(app => {
                return app.shift
                  ? <ShiftCard key={app._id} shift={app.shift}
                      badge={<StatusBadge status={APP_STATUS_MAP[app.status] ?? 'pending'} />}
                    />
                  : null;
              })}
        </div>
      )}

      {selectedShift && (
        <ShiftDetailModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-foreground/30 gap-2">
      <Inbox className="h-10 w-10 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
