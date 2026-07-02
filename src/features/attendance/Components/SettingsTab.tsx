'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin, Clock, Shield, Calendar, Pencil, X, TrendingUp } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface AttendanceSettings {
  clockInMethods: string[];
  geofencingEnabled: boolean;
  officeLatitude: string;
  officeLongitude: string;
  officeRadiusMeters: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  selfMarkEnabled: boolean;
  autoClockOutEnabled: boolean;
  autoClockOutTime: string;
  breakTracking: boolean;
  maxBreakMinutes: number;
  overtimeEnabled: boolean;
  maxOvertimeHours: number;
  blockUnscheduledClockIn: boolean;
}

interface WorkSchedule {
  _id: string;
  name: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  breakMinutes: number;
  weeklyHours: number;
  gracePeriod: number;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CLOCK_METHODS = [
  { value: 'gps',       label: 'GPS Clock-In',     desc: 'Location-based with geofencing' },
  { value: 'manual',    label: 'Manual Entry',      desc: 'HR marks attendance manually'   },
  { value: 'biometric', label: 'Biometric',         desc: 'Fingerprint / face recognition' },
  { value: 'qr',        label: 'QR Code',           desc: 'Scan a QR code at entry point'  },
];

const defaultSettings: AttendanceSettings = {
  clockInMethods: ['gps'],
  geofencingEnabled: true,
  officeLatitude: '',
  officeLongitude: '',
  officeRadiusMeters: 200,
  workStartTime: '08:00',
  workEndTime: '17:00',
  gracePeriodMinutes: 15,
  selfMarkEnabled: true,
  autoClockOutEnabled: false,
  autoClockOutTime: '19:00',
  breakTracking: true,
  maxBreakMinutes: 60,
  overtimeEnabled: true,
  maxOvertimeHours: 3,
  blockUnscheduledClockIn: false,
};

const blankSched = { name: '', workDays: ['Mon','Tue','Wed','Thu','Fri'], startTime: '08:00', endTime: '17:00', breakMinutes: 60, weeklyHours: 40, gracePeriod: 15 };

export function SettingsTab() {
  const [settings,     setSettings]     = useState<AttendanceSettings>(defaultSettings);
  const [schedules,    setSchedules]    = useState<WorkSchedule[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [showNewSched, setShowNewSched] = useState(false);
  const [newSched,     setNewSched]     = useState({ ...blankSched });
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editSched,    setEditSched]    = useState({ ...blankSched });

  useEffect(() => {
    Promise.all([
      new Promise<void>(r => apiCallFunction<any>({
        url: `${API_BASE_URL}/attendance/settings`,
        showToast: false,
        thenFn: res => { setSettings({ ...defaultSettings, ...res.data }); r(); },
        catchFn: () => r(),
      })),
      new Promise<void>(r => apiCallFunction<any>({
        url: `${API_BASE_URL}/attendance/schedules`,
        showToast: false,
        thenFn: res => { setSchedules(res.data ?? []); r(); },
        catchFn: () => r(),
      })),
    ]).finally(() => setLoading(false));
  }, []);

  const saveSettings = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/settings`,
      method: 'PUT',
      data: settings,
      finallyFn: () => setSaving(false),
    });
  };

  const toggleMethod = (v: string) => {
    setSettings(s => ({
      ...s,
      clockInMethods: s.clockInMethods.includes(v)
        ? s.clockInMethods.filter(m => m !== v)
        : [...s.clockInMethods, v],
    }));
  };

  const toggleDay = (day: string, which: 'new' | 'edit') => {
    if (which === 'new') {
      setNewSched(s => ({ ...s, workDays: s.workDays.includes(day) ? s.workDays.filter(d => d !== day) : [...s.workDays, day] }));
    } else {
      setEditSched(s => ({ ...s, workDays: s.workDays.includes(day) ? s.workDays.filter(d => d !== day) : [...s.workDays, day] }));
    }
  };

  const createSchedule = () => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/schedules`,
      method: 'POST',
      data: newSched,
      thenFn: (r: any) => {
        setSchedules(s => [...s, { ...newSched, _id: r.data?._id ?? String(Date.now()) }]);
        setShowNewSched(false);
        setNewSched({ ...blankSched });
      },
    });
  };

  const saveEditSchedule = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/schedules/${id}`,
      method: 'PUT',
      data: editSched,
      thenFn: () => {
        setSchedules(s => s.map(sc => sc._id === id ? { ...sc, ...editSched } : sc));
        setEditingId(null);
      },
    });
  };

  const deleteSchedule = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/schedules/${id}`,
      method: 'DELETE',
      thenFn: () => setSchedules(s => s.filter(sc => sc._id !== id)),
    });
  };

  const startEdit = (sc: WorkSchedule) => {
    setEditSched({ name: sc.name, workDays: [...sc.workDays], startTime: sc.startTime, endTime: sc.endTime, breakMinutes: sc.breakMinutes, weeklyHours: sc.weeklyHours, gracePeriod: sc.gracePeriod });
    setEditingId(sc._id);
    setShowNewSched(false);
  };

  const set = <K extends keyof AttendanceSettings>(k: K, v: AttendanceSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }));

  if (loading) {
    return <div className="py-16 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Clock-in methods */}
      <Section icon={Shield} title="Clock-In Methods">
        <div className="grid grid-cols-2 gap-3">
          {CLOCK_METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => toggleMethod(m.value)}
              className={cn('flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                settings.clockInMethods.includes(m.value)
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600')}>
              <div className={cn('h-4 w-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center',
                settings.clockInMethods.includes(m.value) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600')}>
                {settings.clockInMethods.includes(m.value) && <div className="h-2 w-2 rounded-sm bg-white" />}
              </div>
              <div>
                <p className={cn('text-sm font-semibold', settings.clockInMethods.includes(m.value) ? 'text-indigo-300' : 'text-slate-300')}>
                  {m.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Geofencing */}
      <Section icon={MapPin} title="Geofencing">
        <div className="space-y-4">
          <Toggle label="Enable geofencing" desc="Restrict clock-in to a defined office radius"
            on={settings.geofencingEnabled} onToggle={() => set('geofencingEnabled', !settings.geofencingEnabled)} />
          {settings.geofencingEnabled && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Office Latitude"  value={settings.officeLatitude}   onChange={v => set('officeLatitude', v)}  placeholder="e.g. -1.2921" />
              <Field label="Office Longitude" value={settings.officeLongitude}  onChange={v => set('officeLongitude', v)} placeholder="e.g. 36.8219" />
              <NumField label="Radius (meters)" value={settings.officeRadiusMeters} onChange={v => set('officeRadiusMeters', v)} min={50} max={2000} />
            </div>
          )}
        </div>
      </Section>

      {/* Work hours */}
      <Section icon={Clock} title="Work Hours & Grace Period">
        <div className="grid grid-cols-3 gap-3">
          <TimeField label="Work Start"         value={settings.workStartTime}      onChange={v => set('workStartTime', v)} />
          <TimeField label="Work End"           value={settings.workEndTime}        onChange={v => set('workEndTime', v)} />
          <NumField  label="Grace Period (min)" value={settings.gracePeriodMinutes} onChange={v => set('gracePeriodMinutes', v)} min={0} max={60} />
        </div>
        <div className="mt-3 space-y-3">
          <Toggle label="Allow self-marking" desc="Employees can mark their own attendance via the app"
            on={settings.selfMarkEnabled} onToggle={() => set('selfMarkEnabled', !settings.selfMarkEnabled)} />
          <Toggle label="Auto clock-out" desc="Automatically clock out employees at a set time"
            on={settings.autoClockOutEnabled} onToggle={() => set('autoClockOutEnabled', !settings.autoClockOutEnabled)} />
          {settings.autoClockOutEnabled && (
            <TimeField label="Auto clock-out time" value={settings.autoClockOutTime} onChange={v => set('autoClockOutTime', v)} />
          )}
        </div>
      </Section>

      {/* Breaks */}
      <Section icon={Clock} title="Break Tracking">
        <Toggle label="Enable break tracking" desc="Track break start / end times within work sessions"
          on={settings.breakTracking} onToggle={() => set('breakTracking', !settings.breakTracking)} />
        {settings.breakTracking && (
          <div className="mt-3">
            <NumField label="Max break per day (min)" value={settings.maxBreakMinutes} onChange={v => set('maxBreakMinutes', v)} min={0} max={480} />
          </div>
        )}
      </Section>

      {/* Overtime */}
      <Section icon={TrendingUp} title="Overtime">
        <Toggle label="Enable overtime tracking" desc="Any work past scheduled hours is counted as overtime"
          on={settings.overtimeEnabled} onToggle={() => set('overtimeEnabled', !settings.overtimeEnabled)} />
        {settings.overtimeEnabled && (
          <div className="mt-3">
            <NumField label="Maximum overtime hours per day" value={settings.maxOvertimeHours} onChange={v => set('maxOvertimeHours', v)} min={1} max={12} />
            <p className="text-xs text-slate-500 mt-1.5">The system will stop counting overtime after this limit is reached.</p>
          </div>
        )}
        <div className="mt-3">
          <Toggle label="Block unscheduled clock-ins" desc="Employees without a shift assigned for the day cannot clock in"
            on={settings.blockUnscheduledClockIn} onToggle={() => set('blockUnscheduledClockIn', !settings.blockUnscheduledClockIn)} />
        </div>
      </Section>

      {/* Work schedules */}
      <Section icon={Calendar} title="Work Schedules">
        <div className="space-y-3">
          {schedules.map(sc => (
            <div key={sc._id}>
              {editingId === sc._id ? (
                <div className="bg-slate-800 border border-indigo-500/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Edit Schedule</p>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Field label="Schedule Name" value={editSched.name} onChange={v => setEditSched(s => ({ ...s, name: v }))} placeholder="e.g. Standard Office Hours" />
                  <div>
                    <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-2">Work Days</label>
                    <div className="flex gap-2">
                      {ALL_DAYS.map(d => (
                        <button key={d} type="button" onClick={() => toggleDay(d, 'edit')}
                          className={cn('h-8 w-9 rounded-lg text-xs font-semibold transition-all',
                            editSched.workDays.includes(d) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>
                          {d[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <TimeField label="Start" value={editSched.startTime} onChange={v => setEditSched(s => ({ ...s, startTime: v }))} />
                    <TimeField label="End"   value={editSched.endTime}   onChange={v => setEditSched(s => ({ ...s, endTime: v }))} />
                    <NumField  label="Break (min)"  value={editSched.breakMinutes} onChange={v => setEditSched(s => ({ ...s, breakMinutes: v }))} min={0} max={180} />
                    <NumField  label="Weekly hours" value={editSched.weeklyHours}  onChange={v => setEditSched(s => ({ ...s, weeklyHours: v }))} min={1} max={84} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                    <button onClick={() => saveEditSchedule(sc._id)} disabled={!editSched.name} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{sc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sc.workDays.join(', ')} · {sc.startTime}–{sc.endTime} · {sc.breakMinutes}m break · {sc.weeklyHours}h/week
                    </p>
                  </div>
                  <button onClick={() => startEdit(sc)}
                    className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-300 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteSchedule(sc._id)}
                    className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {showNewSched ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New Schedule</p>
              <Field label="Schedule Name" value={newSched.name} onChange={v => setNewSched(s => ({ ...s, name: v }))} placeholder="e.g. Standard Office Hours" />
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-2">Work Days</label>
                <div className="flex gap-2">
                  {ALL_DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d, 'new')}
                      className={cn('h-8 w-9 rounded-lg text-xs font-semibold transition-all',
                        newSched.workDays.includes(d) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <TimeField label="Start" value={newSched.startTime} onChange={v => setNewSched(s => ({ ...s, startTime: v }))} />
                <TimeField label="End"   value={newSched.endTime}   onChange={v => setNewSched(s => ({ ...s, endTime: v }))} />
                <NumField  label="Break (min)"  value={newSched.breakMinutes} onChange={v => setNewSched(s => ({ ...s, breakMinutes: v }))} min={0} max={180} />
                <NumField  label="Weekly hours" value={newSched.weeklyHours}  onChange={v => setNewSched(s => ({ ...s, weeklyHours: v }))} min={1} max={84} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowNewSched(false); setNewSched({ ...blankSched }); }} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={createSchedule} disabled={!newSched.name} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">Create Schedule</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setShowNewSched(true); setEditingId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 text-sm transition-colors w-full justify-center">
              <Plus className="h-4 w-4" /> Add Work Schedule
            </button>
          )}
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button onClick={saveSettings} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
        <Icon className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button onClick={onToggle}
        className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', on ? 'bg-indigo-500' : 'bg-slate-700')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 bg-slate-900 border border-slate-600 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <input type="time" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 bg-slate-900 border border-slate-600 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
    </div>
  );
}

function NumField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <input type="number" value={value} min={min} max={max} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-9 bg-slate-900 border border-slate-600 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
    </div>
  );
}
