'use client';

import { useState, useCallback, useEffect } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, Users, BookOpen, Dumbbell } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface Department { _id: string; name: string }

interface ScheduledEvent {
  _id: string;
  title: string;
  type: 'training' | 'team_building';
  description?: string;
  scheduledDate: string;
  endDate?: string;
  location?: string;
  audience: 'all' | 'department';
  department?: string;
  createdBy?: string;
}

type EventForm = {
  title: string; type: 'training' | 'team_building'; description: string;
  scheduledDate: string; endDate: string; location: string;
  audience: 'all' | 'department'; department: string;
};

const EMPTY: EventForm = {
  title: '', type: 'training', description: '', scheduledDate: '',
  endDate: '', location: '', audience: 'all', department: '',
};

const TypeIcon = ({ type }: { type: string }) =>
  type === 'training'
    ? <BookOpen className="h-4 w-4 text-blue-500" />
    : <Dumbbell className="h-4 w-4 text-emerald-500" />;

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

export default function EventsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents]           = useState<ScheduledEvent[]>([]);
  const [form, setForm]               = useState<EventForm>({ ...EMPTY });
  const [editing, setEditing]         = useState<ScheduledEvent | null>(null);
  const [open, setOpen]               = useState(false);
  const [saving, setSaving]           = useState(false);
  const [filter, setFilter]           = useState<'all' | 'training' | 'team_building'>('all');

  const loadDepts = useCallback(() => {
    apiCallFunction<{ data: Department[] }>({
      url: `${API_BASE_URL}/config/departments`,
      showToast: false,
      thenFn: r => setDepartments(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const loadEvents = useCallback(() => {
    apiCallFunction<{ data: ScheduledEvent[] }>({
      url: `${API_BASE_URL}/config/events`,
      showToast: false,
      thenFn: r => setEvents(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  useEffect(() => { loadDepts(); loadEvents(); }, [loadDepts, loadEvents]);

  const openNew = () => { setForm({ ...EMPTY }); setEditing(null); setOpen(true); };
  const openEdit = (e: ScheduledEvent) => {
    setForm({
      title: e.title, type: e.type, description: e.description || '',
      scheduledDate: e.scheduledDate, endDate: e.endDate || '',
      location: e.location || '', audience: e.audience, department: e.department || '',
    });
    setEditing(e); setOpen(true);
  };

  const save = () => {
    if (!form.title || !form.scheduledDate) return;
    setSaving(true);
    const url    = editing ? `${API_BASE_URL}/config/events/${editing._id}` : `${API_BASE_URL}/config/events`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { loadEvents(); setOpen(false); setEditing(null); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (id: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/config/events/${id}`, method: 'DELETE', thenFn: loadEvents });

  const today    = new Date().toISOString().split('T')[0];
  const shown    = events.filter(e => filter === 'all' || e.type === filter);
  const upcoming = shown.filter(e => e.scheduledDate >= today);
  const past     = shown.filter(e => e.scheduledDate < today);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6" /> Events
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            Schedule training sessions and team building activities. Staff will see upcoming events in their portal.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Schedule Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',    value: events.length,    color: '#6366f1', icon: CalendarDays },
          { label: 'Upcoming',        value: upcoming.length,  color: '#10b981', icon: CalendarDays },
          { label: 'Past Events',     value: past.length,      color: '#9ca3af', icon: CalendarDays },
          { label: 'Training',
            value: events.filter(e => e.type === 'training').length,
            color: '#3b82f6', icon: BookOpen },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" style={{ color }} />
            <div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-xs text-foreground/50">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {([['all', 'All'], ['training', 'Training'], ['team_building', 'Team Building']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              filter === val ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      {open && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{editing ? 'Edit Event' : 'New Event'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Event Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Q3 Sales Training / Annual Sports Day"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'training' | 'team_building' }))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="training">Training Session</option>
                <option value="team_building">Team Building</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Audience</label>
              <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value as 'all' | 'department' }))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="all">All Staff</option>
                <option value="department">Specific Department</option>
              </select>
            </div>
            {form.audience === 'department' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">— Select department —</option>
                  {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Date *</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">End Date (optional)</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Main Hall, Zoom, Nairobi CBD"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                placeholder="What will this event cover?"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setOpen(false); setEditing(null); }}
              className="text-xs text-foreground/40 hover:text-foreground px-3 py-1.5 rounded-lg">Cancel</button>
            <button onClick={save} disabled={saving || !form.title || !form.scheduledDate}
              className="text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/90">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Upcoming ({upcoming.length})</p>
          {upcoming.map(e => (
            <div key={e._id} className="flex items-start gap-3 p-4 rounded-xl border bg-white hover:border-primary/20 transition-colors">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                e.type === 'training' ? 'bg-blue-50' : 'bg-emerald-50')}>
                <TypeIcon type={e.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{e.title}</p>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                    e.type === 'training' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>
                    {e.type === 'training' ? 'Training' : 'Team Building'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" /> {e.audience === 'all' ? 'All Staff' : e.department}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {fmtDate(e.scheduledDate)}
                    {e.endDate && e.endDate !== e.scheduledDate ? ` – ${fmtDate(e.endDate)}` : ''}
                  </span>
                  {e.location && <span>📍 {e.location}</span>}
                </div>
                {e.description && <p className="text-xs text-foreground/40 mt-1">{e.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(e)}
                  className="p-1.5 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => del(e._id)}
                  className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Past ({past.length})</p>
          {past.map(e => (
            <div key={e._id} className="flex items-start gap-3 p-4 rounded-xl border bg-gray-50 opacity-60 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <TypeIcon type={e.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-through text-foreground/50">{e.title}</p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {fmtDate(e.scheduledDate)} {e.location ? `· ${e.location}` : ''}
                </p>
              </div>
              <button onClick={() => del(e._id)}
                className="p-1.5 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-50 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {shown.length === 0 && !open && (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-foreground/40">
          No events scheduled yet. Click &ldquo;Schedule Event&rdquo; to add one.
        </div>
      )}
    </div>
  );
}
