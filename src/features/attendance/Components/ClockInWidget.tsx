'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, LogIn, LogOut, Bell, CheckCircle2, Loader2, AlertTriangle, ExternalLink, CalendarDays, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface BreakEntry {
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface TodayRecord {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInAt?: string | null;
  mode?: 'onsite' | 'offsite';
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  breaks?: BreakEntry[];
  totalWorkMinutes?: number;
  totalBreakMinutes?: number;
}

interface WeekRecord {
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
}

const RING_R    = 70;
const RING_CIRC = 2 * Math.PI * RING_R;
const WORK_TARGET_MINS = 480; // 8 h

function calcMins(checkIn: string, checkOut: string): number {
  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  return Math.max(0, oh * 60 + om - (ih * 60 + im));
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtSecs(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
    const j = await r.json();
    const a = j.address ?? {};
    const parts = [a.road || a.pedestrian, a.suburb || a.neighbourhood, a.city || a.town || a.village || a.county].filter(Boolean);
    return parts.length ? parts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function acquireGPS(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  );
}

async function scheduleNotifications(workStartTime: string, workEndTime: string) {
  if (!('Notification' in window)) return;
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') return;
  const now = nowMinutes();
  const startMin = timeToMinutes(workStartTime);
  const endMin   = timeToMinutes(workEndTime);
  const msTillIn  = ((startMin - 15) - now) * 60_000;
  const msTillOut = ((endMin   - 15) - now) * 60_000;
  if (msTillIn  > 0) setTimeout(() => new Notification('⏰ Time to clock in soon!',   { body: `Work starts at ${workStartTime}. Clock in within 15 minutes.`, icon: '/favicon.ico' }), msTillIn);
  if (msTillOut > 0) setTimeout(() => new Notification('🕔 Almost time to clock out!', { body: `Work ends at ${workEndTime}. Remember to clock out.`,         icon: '/favicon.ico' }), msTillOut);
}

export function ClockInWidget() {
  const [record,       setRecord]       = useState<TodayRecord | null>(null);
  const [weekRecords,  setWeekRecords]  = useState<WeekRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [step,         setStep]         = useState<'idle' | 'locating' | 'geocoding' | 'submitting'>('idle');
  const [geoError,     setGeoError]     = useState<string | null>(null);
  const [workLocation, setWorkLocation] = useState<'office' | 'home' | 'remote' | 'client_site'>('office');
  const [now,          setNow]          = useState(new Date());
  const [elapsed,      setElapsed]      = useState(0);   // seconds of actual work time
  const [breakSecs,    setBreakSecs]    = useState(0);   // seconds on current break
  const [confirmPending, setConfirmPending] = useState<'in' | 'out' | 'break_start' | 'break_end' | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('notifications_enabled') !== 'false';
  });
  const notifScheduled = useRef(false);

  // Wall clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const clockedIn  = !!record?.checkInTime;
  const clockedOut = !!record?.checkOutTime;
  const openBreak  = record?.breaks?.find(b => !b.endTime);
  const isOnBreak  = clockedIn && !clockedOut && !!openBreak;
  const isWorking  = clockedIn && !clockedOut && !openBreak;

  // Live elapsed timer
  useEffect(() => {
    if (!clockedIn || clockedOut) return;
    const compute = () => {
      if (!record?.checkInAt) return;
      const checkInMs = new Date(record.checkInAt).getTime();
      const pastBreakMs = (record.breaks || []).reduce((sum, b) => {
        if (b.endTime) return sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
        return sum;
      }, 0);
      const curBreakMs = openBreak ? Date.now() - new Date(openBreak.startTime).getTime() : 0;
      setElapsed(Math.max(0, Math.floor((Date.now() - checkInMs - pastBreakMs - curBreakMs) / 1000)));
      setBreakSecs(Math.max(0, Math.floor(curBreakMs / 1000)));
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [clockedIn, clockedOut, record, openBreak]);

  const fetchWeekRecords = useCallback(() => {
    apiCallFunction<{ data: WeekRecord[] }>({
      url: `${API_BASE_URL}/attendance/my-records?days=7`,
      showToast: false,
      thenFn: (r) => setWeekRecords(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const fetchStatus = useCallback(() => {
    apiCallFunction<{ data: TodayRecord | null }>({
      url: `${API_BASE_URL}/attendance/today-status`,
      showToast: false,
      thenFn: (r) => setRecord(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchWeekRecords();
    if (notifScheduled.current) return;
    notifScheduled.current = true;
    apiCallFunction<{ data: { workStartTime?: string; workEndTime?: string } }>({
      url: `${API_BASE_URL}/config/company-settings`,
      showToast: false,
      thenFn: (r) => { if (notifEnabled) scheduleNotifications(r.data?.workStartTime ?? '08:00', r.data?.workEndTime ?? '17:00'); },
    });
  }, [fetchStatus, fetchWeekRecords]);

  const getLocData = async () => {
    setGeoError(null);
    if (!navigator.geolocation) { setGeoError('GPS not supported in your browser.'); return null; }
    setStep('locating');
    try {
      const pos = await acquireGPS();
      setStep('geocoding');
      const locationName = await reverseGeocode(pos.latitude, pos.longitude);
      return { latitude: pos.latitude, longitude: pos.longitude, locationName };
    } catch (e: unknown) {
      const err = e as GeolocationPositionError;
      setGeoError(
        err?.code === 1 ? 'Location access denied. Allow GPS in browser settings and retry.' :
        err?.code === 2 ? 'Could not determine location. Ensure GPS is enabled.' :
                          'Location request timed out. Move to an open area and retry.'
      );
      setStep('idle');
      return null;
    }
  };

  const doClockIn = async () => {
    const loc = await getLocData();
    if (!loc) return;
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-in`,
      method: 'POST',
      data: { ...loc, workLocation },
      thenFn: () => { toast.success(`Clocked in from ${loc.locationName}.`); fetchStatus(); setStep('idle'); },
      catchFn: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Clock-in failed.';
        setGeoError(msg); setStep('idle');
      },
    });
  };

  const doClockOut = async () => {
    const loc = await getLocData();
    if (!loc) return;
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-out`,
      method: 'POST',
      data: loc,
      thenFn: () => { toast.success('Clocked out successfully.'); fetchStatus(); fetchWeekRecords(); setStep('idle'); },
      catchFn: () => { setStep('idle'); toast.error('Clock-out failed.'); },
    });
  };

  const doBreakStart = () => {
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-start`,
      method: 'POST',
      data: {},
      thenFn: () => { toast.success('Break started.'); fetchStatus(); setStep('idle'); },
      catchFn: () => { setStep('idle'); toast.error('Could not start break.'); },
    });
  };

  const doBreakEnd = () => {
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-end`,
      method: 'POST',
      data: {},
      thenFn: () => { toast.success('Break ended.'); fetchStatus(); setStep('idle'); },
      catchFn: () => { setStep('idle'); toast.error('Could not end break.'); },
    });
  };

  const busy = step !== 'idle';

  // Ring visuals
  const ringWorkPct    = Math.min(1, elapsed / (WORK_TARGET_MINS * 60));
  const ringDashOffset = RING_CIRC * (1 - ringWorkPct);
  const ringColor      = isOnBreak ? '#f59e0b' : '#22c55e';

  const hours   = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dateStr = now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-xs text-slate-500">Loading attendance…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">

      {/* ── Hero clock ── */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden">
        <div className="relative px-6 pt-6 pb-5 text-center bg-gradient-to-br from-[#1e293b] via-[#1e293b] to-indigo-900/40">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-indigo-500/5 pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 bg-slate-700/60 rounded-full px-3 py-1 mb-4">
            <CalendarDays className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400 text-xs font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className="text-5xl font-black text-slate-100 tracking-tight font-mono tabular-nums">{hours}</span>
            <span className="text-5xl font-black text-slate-500 mb-1">:</span>
            <span className="text-5xl font-black text-slate-100 tracking-tight font-mono tabular-nums">{minutes}</span>
            <span className="text-5xl font-black text-slate-500 mb-1">:</span>
            <span className="text-5xl font-black text-slate-600 tracking-tight font-mono tabular-nums">{seconds}</span>
          </div>

          {/* Status badge */}
          {!clockedIn && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-700/50 px-4 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" /> Not clocked in yet
            </span>
          )}
          {isWorking && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> On duty since {record?.checkInTime}
            </span>
          )}
          {isOnBreak && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full">
              <Coffee className="h-3.5 w-3.5" /> On break
            </span>
          )}
          {clockedOut && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Day complete · {record?.checkInTime} – {record?.checkOutTime}
            </span>
          )}
        </div>
      </div>

      {/* ── Error alert ── */}
      {geoError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed">{geoError}</p>
        </div>
      )}

      {/* ── Action card: Working / On break with SVG ring ── */}
      {clockedIn && !clockedOut && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-5">
          {/* SVG ring */}
          <div className="relative">
            <svg width="160" height="160" className="-rotate-90">
              <circle cx="80" cy="80" r={RING_R} fill="none" stroke="#334155" strokeWidth="8" />
              <circle cx="80" cy="80" r={RING_R} fill="none" stroke={ringColor} strokeWidth="8"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringDashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isOnBreak ? (
                <>
                  <span className="text-xl font-bold text-amber-400 font-mono">{fmtSecs(breakSecs)}</span>
                  <span className="text-[11px] text-amber-500 mt-0.5">On Break</span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-green-400 font-mono">{fmtSecs(elapsed)}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Working</span>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">In</p>
              <p className="text-sm font-bold text-slate-200">{record?.checkInTime ?? '—'}</p>
            </div>
            <div className="bg-slate-800 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Breaks</p>
              <p className="text-sm font-bold text-slate-200">
                {(record?.breaks || []).filter(b => b.endTime).length} taken
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Break time</p>
              <p className="text-sm font-bold text-slate-200">
                {(record?.breaks || []).reduce((s, b) => s + (b.duration || 0), 0)}m
              </p>
            </div>
          </div>

          {record?.checkInLocation && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3 w-3 text-slate-600" />
              <span className="truncate max-w-xs">{record.checkInLocation}</span>
            </div>
          )}

          {/* Break / Clock-out buttons */}
          <div className="w-full flex gap-2">
            {isOnBreak ? (
              <button onClick={() => setConfirmPending('break_end')} disabled={busy}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />} End Break
              </button>
            ) : (
              <button onClick={() => setConfirmPending('break_start')} disabled={busy}
                className="flex-1 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 text-amber-400 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />} Break
              </button>
            )}
            <button onClick={() => setConfirmPending('out')} disabled={busy || isOnBreak}
              className="flex-1 h-11 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 text-red-400 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Clock Out
            </button>
          </div>
          {isOnBreak && <p className="text-[11px] text-slate-600">End your break before clocking out.</p>}
        </div>
      )}

      {/* ── Not clocked in ── */}
      {!clockedIn && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-3">
            <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300/70 leading-relaxed">
              Your GPS location is captured automatically. You must be within the allowed radius of the office to clock in.
            </p>
          </div>
          <button onClick={() => setConfirmPending('in')} disabled={busy}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-3">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{step === 'locating' ? 'Getting location…' : step === 'geocoding' ? 'Identifying…' : 'Clocking in…'}</span>
              </>
            ) : (
              <><LogIn className="h-4 w-4" /> Clock In</>
            )}
          </button>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'office', label: 'Office' },
              { value: 'home', label: 'Home' },
              { value: 'remote', label: 'Remote' },
              { value: 'client_site', label: 'Client Site' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWorkLocation(opt.value as typeof workLocation)}
                className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${
                  workLocation === opt.value
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Day complete summary ── */}
      {clockedOut && (() => {
        const workedMins = record?.totalWorkMinutes
          ?? ((record?.checkInTime && record?.checkOutTime) ? calcMins(record.checkInTime, record.checkOutTime) : 0);
        const pct = Math.min(100, Math.round((workedMins / WORK_TARGET_MINS) * 100));
        const barColor = workedMins >= WORK_TARGET_MINS ? 'bg-emerald-500' : workedMins >= WORK_TARGET_MINS * 0.75 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="font-bold text-slate-100 text-base">Day Complete!</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Clock In',  value: record?.checkInTime  ?? '—' },
                { label: 'Hours',     value: workedMins > 0 ? fmtDuration(workedMins) : '—' },
                { label: 'Clock Out', value: record?.checkOutTime ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 rounded-lg px-3 py-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-bold text-sm text-slate-200">{value}</p>
                </div>
              ))}
            </div>
            {workedMins > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">vs 8h standard</span>
                  <span className="text-[10px] font-semibold text-slate-400">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {(record?.totalBreakMinutes ?? 0) > 0 && (
              <p className="text-xs text-slate-500 text-center">{record?.totalBreakMinutes}m total break time</p>
            )}
          </div>
        );
      })()}

      {/* ── Location record ── */}
      {clockedIn && (record?.checkInLocation || record?.checkOutLocation) && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Location Record
          </p>
          {record?.checkInLocation && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <LogIn className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock-in</p>
                <p className="text-xs text-slate-300 truncate">{record.checkInLocation}</p>
              </div>
              {record.checkInLat && record.checkInLng && (
                <a href={`https://maps.google.com/?q=${record.checkInLat},${record.checkInLng}`} target="_blank" rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
          {record?.checkOutLocation && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <LogOut className="h-3.5 w-3.5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Clock-out</p>
                <p className="text-xs text-slate-300 truncate">{record.checkOutLocation}</p>
              </div>
              {record.checkOutLat && record.checkOutLng && (
                <a href={`https://maps.google.com/?q=${record.checkOutLat},${record.checkOutLng}`} target="_blank" rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Weekly bar chart ── */}
      {weekRecords.length > 0 && (() => {
        const stdMins = WORK_TARGET_MINS;
        const slots = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const ds = d.toISOString().split('T')[0];
          const rec = weekRecords.find(r => r.date === ds);
          const mins = rec?.checkInTime && rec?.checkOutTime ? calcMins(rec.checkInTime, rec.checkOutTime) : 0;
          return { label: d.toLocaleDateString('en-KE', { weekday: 'short' }), mins, pct: Math.min(100, Math.round((mins / stdMins) * 100)), isToday: ds === new Date().toISOString().split('T')[0] };
        });
        const totalMins = slots.reduce((s, d) => s + d.mins, 0);
        const workedDays = slots.filter(d => d.mins > 0).length;
        return (
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">This Week</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span><strong className="text-slate-200">{fmtDuration(totalMins)}</strong> total</span>
                <span><strong className="text-slate-200">{workedDays}</strong> days</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {slots.map((d, i) => {
                const barColor = d.mins >= stdMins ? 'bg-emerald-500' : d.mins >= stdMins * 0.75 ? 'bg-amber-400' : d.mins > 0 ? 'bg-red-400' : 'bg-slate-700';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-600">{d.mins > 0 ? fmtDuration(d.mins) : ''}</span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '48px' }}>
                      <div className={`w-full rounded-t transition-all duration-500 ${barColor} ${d.isToday ? 'ring-2 ring-indigo-500/30' : ''}`}
                        style={{ height: `${Math.max(d.pct, d.mins > 0 ? 8 : 0)}%`, minHeight: d.mins > 0 ? '4px' : '0' }} />
                    </div>
                    <span className={`text-[10px] font-medium ${d.isToday ? 'text-indigo-400' : 'text-slate-500'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-600">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" /> ≥8h</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> ≥6h</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400 inline-block" /> &lt;6h</span>
              <span className="ml-auto">Standard: 8h/day</span>
            </div>
          </div>
        );
      })()}

      {/* ── Notification toggle ── */}
      <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3">
        <Bell className={`h-4 w-4 shrink-0 ${notifEnabled ? 'text-indigo-400' : 'text-slate-600'}`} />
        <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
          {notifEnabled ? 'Browser reminders on — 15 min before start/end.' : 'Browser reminders are off.'}
        </p>
        <button onClick={() => { const next = !notifEnabled; setNotifEnabled(next); localStorage.setItem('notifications_enabled', String(next)); }}
          className={`shrink-0 h-5 w-9 rounded-full transition-colors relative ${notifEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${notifEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* ── Confirmation dialog ── */}
      {confirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmPending(null)} />
          <div className="relative z-10 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-80 space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                confirmPending === 'in' ? 'bg-indigo-500/10' :
                confirmPending === 'out' ? 'bg-red-500/10' : 'bg-amber-500/10'
              }`}>
                {confirmPending === 'in'         && <LogIn   className="h-7 w-7 text-indigo-400" />}
                {confirmPending === 'out'        && <LogOut  className="h-7 w-7 text-red-400" />}
                {confirmPending === 'break_start'&& <Coffee  className="h-7 w-7 text-amber-400" />}
                {confirmPending === 'break_end'  && <Coffee  className="h-7 w-7 text-amber-400" />}
              </div>
              <div>
                <p className="font-bold text-base text-slate-100">
                  {confirmPending === 'in'          ? 'Clock In?' :
                   confirmPending === 'out'         ? 'Clock Out?' :
                   confirmPending === 'break_start' ? 'Start Break?' : 'End Break?'}
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {confirmPending === 'in'          ? 'This will record your start time and capture your location.' :
                   confirmPending === 'out'         ? 'This will end your working session for today.' :
                   confirmPending === 'break_start' ? 'Your break time will be tracked separately.' :
                                                     'Your working session will resume now.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmPending(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => {
                const a = confirmPending;
                setConfirmPending(null);
                if (a === 'in')          doClockIn();
                else if (a === 'out')    doClockOut();
                else if (a === 'break_start') doBreakStart();
                else                    doBreakEnd();
              }} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                confirmPending === 'in' ? 'bg-indigo-600 hover:bg-indigo-500' :
                confirmPending === 'out' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-500 hover:bg-amber-400'
              }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
