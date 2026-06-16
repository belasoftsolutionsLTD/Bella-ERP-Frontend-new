'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, LogIn, LogOut, Bell, CheckCircle2, Loader2, AlertTriangle, ExternalLink, CalendarDays, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface TodayRecord {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  mode?: 'onsite' | 'offsite';
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
}

interface WeekRecord {
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
}

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
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const j = await r.json();
    const a = j.address ?? {};
    const parts = [
      a.road || a.pedestrian,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village || a.county,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function getLocation(): Promise<{ latitude: number; longitude: number }> {
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
  if (msTillIn  > 0) setTimeout(() => new Notification('⏰ Time to clock in soon!',  { body: `Work starts at ${workStartTime}. Clock in within 15 minutes.`, icon: '/favicon.ico' }), msTillIn);
  if (msTillOut > 0) setTimeout(() => new Notification('🕔 Almost time to clock out!', { body: `Work ends at ${workEndTime}. Remember to clock out.`,         icon: '/favicon.ico' }), msTillOut);
}

export function ClockInWidget() {
  const [record, setRecord]         = useState<TodayRecord | null>(null);
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState<'idle' | 'locating' | 'geocoding' | 'submitting'>('idle');
  const [geoError, setGeoError]     = useState<string | null>(null);
  const [now, setNow]               = useState(new Date());
  const [confirmPending, setConfirmPending] = useState<'in' | 'out' | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('notifications_enabled') !== 'false';
  });
  const notifScheduled              = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

  const acquireLocation = async () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support GPS. Please use a modern browser.');
      return null;
    }
    setStep('locating');
    try {
      const pos = await getLocation();
      setStep('geocoding');
      const locationName = await reverseGeocode(pos.latitude, pos.longitude);
      return { latitude: pos.latitude, longitude: pos.longitude, locationName };
    } catch (e: unknown) {
      const err = e as GeolocationPositionError;
      if (err?.code === 1) {
        setGeoError('Location access denied. Please allow GPS in your browser settings and try again.');
      } else if (err?.code === 2) {
        setGeoError('Could not determine your location. Make sure GPS is enabled on your device.');
      } else {
        setGeoError('Location request timed out. Move to an open area and try again.');
      }
      setStep('idle');
      return null;
    }
  };

  const handleClockIn = async () => {
    const loc = await acquireLocation();
    if (!loc) return;
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-in`,
      method: 'POST',
      data: loc,
      thenFn: () => {
        toast.success(`Clocked in from ${loc.locationName}.`);
        fetchStatus();
        setStep('idle');
      },
      catchFn: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Clock-in failed. Please try again.';
        setGeoError(msg);
        setStep('idle');
      },
    });
  };

  const handleClockOut = async () => {
    const loc = await acquireLocation();
    if (!loc) return;
    setStep('submitting');
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-out`,
      method: 'POST',
      data: loc,
      thenFn: () => {
        toast.success('Clocked out successfully.');
        fetchStatus();
        setStep('idle');
      },
      catchFn: () => {
        setStep('idle');
        toast.error('Clock-out failed. Please try again.');
      },
    });
  };

  const clockedIn  = !!record?.checkInTime;
  const clockedOut = !!record?.checkOutTime;
  const busy       = step !== 'idle';

  const hours   = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dateStr = now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-xs text-foreground/40">Loading attendance…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">

      {/* ── Hero clock card ── */}
      <div className="relative rounded-3xl overflow-hidden bg-brand-gradient shadow-xl">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative px-6 pt-8 pb-6 text-center">
          {/* Date pill */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mb-5">
            <CalendarDays className="h-3 w-3 text-white/60" />
            <span className="text-white/70 text-xs font-medium">{dateStr}</span>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-5xl font-black text-white tracking-tight font-mono tabular-nums">{hours}</span>
            <span className="text-5xl font-black text-white/60 mb-1">:</span>
            <span className="text-5xl font-black text-white tracking-tight font-mono tabular-nums">{minutes}</span>
            <span className="text-5xl font-black text-white/60 mb-1">:</span>
            <span className="text-5xl font-black text-white/40 tracking-tight font-mono tabular-nums">{seconds}</span>
          </div>

          {/* Status badge */}
          <div className="mt-5">
            {!clockedIn && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 bg-white/10 px-4 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                Not clocked in yet
              </span>
            )}
            {clockedIn && !clockedOut && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-4 py-1.5 rounded-full border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                On duty since {record?.checkInTime}
              </span>
            )}
            {clockedOut && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 bg-sky-900/40 px-4 py-1.5 rounded-full border border-sky-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Day complete · {record?.checkInTime} – {record?.checkOutTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error alert ── */}
      {geoError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
          <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          </div>
          <p className="text-xs text-red-700 leading-relaxed">{geoError}</p>
        </div>
      )}

      {/* ── Action card ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Not clocked in */}
        {!clockedIn && (
          <div className="p-5 space-y-4">
            {/* GPS notice */}
            <div className="flex items-start gap-3 bg-primary/5 rounded-2xl px-4 py-3">
              <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-xs text-primary/80 leading-relaxed">
                Your GPS location will be captured automatically.
                You must be within the allowed radius of the office to clock in.
              </p>
            </div>

            {/* Clock In button */}
            <button
              onClick={() => setConfirmPending('in')}
              disabled={busy}
              className="w-full relative flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-primary/25"
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-white/80">
                    {step === 'locating'   && 'Getting your location…'}
                    {step === 'geocoding'  && 'Identifying location…'}
                    {step === 'submitting' && 'Clocking in…'}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <LogIn className="h-4 w-4" />
                  </div>
                  Clock In
                </>
              )}
            </button>
          </div>
        )}

        {/* Clocked in, not out */}
        {clockedIn && !clockedOut && (
          <div className="p-5 space-y-4">
            {/* Duration display */}
            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Wifi className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700">Currently on duty</p>
                <p className="text-xs text-emerald-600/70">Started at {record?.checkInTime}</p>
              </div>
              <div className="ml-auto">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse block" />
              </div>
            </div>

            {/* Clock Out button */}
            <button
              onClick={() => setConfirmPending('out')}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-rose-500 text-white py-4 rounded-2xl font-bold text-sm transition-all duration-200 hover:bg-rose-600 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-rose-500/25"
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-white/80">
                    {step === 'locating'   && 'Getting your location…'}
                    {step === 'geocoding'  && 'Identifying location…'}
                    {step === 'submitting' && 'Clocking out…'}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  Clock Out
                </>
              )}
            </button>
          </div>
        )}

        {/* Day complete */}
        {clockedOut && (() => {
          const workedMins = (record?.checkInTime && record?.checkOutTime)
            ? calcMins(record.checkInTime, record.checkOutTime) : 0;
          const stdMins = 8 * 60;
          const pct = Math.min(100, Math.round((workedMins / stdMins) * 100));
          const barColor = workedMins >= stdMins ? 'bg-emerald-500' : workedMins >= stdMins * 0.75 ? 'bg-amber-400' : 'bg-rose-400';
          return (
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="font-bold text-foreground text-base">Day Complete!</p>
              </div>
              {/* Hours summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-2xl px-3 py-3">
                  <p className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1">Clock In</p>
                  <p className="font-bold text-sm text-foreground">{record?.checkInTime}</p>
                </div>
                <div className="bg-primary/5 rounded-2xl px-3 py-3">
                  <p className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1">Hours</p>
                  <p className="font-bold text-sm text-primary">{workedMins > 0 ? fmtDuration(workedMins) : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl px-3 py-3">
                  <p className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1">Clock Out</p>
                  <p className="font-bold text-sm text-foreground">{record?.checkOutTime}</p>
                </div>
              </div>
              {/* Progress vs 8h standard */}
              {workedMins > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-foreground/40 uppercase tracking-wider">vs 8h standard</span>
                    <span className="text-[10px] font-semibold text-foreground/60">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              <p className="text-center text-xs text-emerald-600 font-medium">Great work today!</p>
            </div>
          );
        })()}
      </div>

      {/* ── Location record ── */}
      {clockedIn && (record?.checkInLocation || record?.checkOutLocation) && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Location Record
          </p>
          {record?.checkInLocation && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <LogIn className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">Clock-in</p>
                <p className="text-xs text-foreground/80 truncate">{record.checkInLocation}</p>
              </div>
              {record.checkInLat && record.checkInLng && (
                <a href={`https://maps.google.com/?q=${record.checkInLat},${record.checkInLng}`}
                   target="_blank" rel="noopener noreferrer"
                   className="shrink-0 h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
          {record?.checkOutLocation && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">Clock-out</p>
                <p className="text-xs text-foreground/80 truncate">{record.checkOutLocation}</p>
              </div>
              {record.checkOutLat && record.checkOutLng && (
                <a href={`https://maps.google.com/?q=${record.checkOutLat},${record.checkOutLng}`}
                   target="_blank" rel="noopener noreferrer"
                   className="shrink-0 h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Weekly performance chart ── */}
      {weekRecords.length > 0 && (() => {
        const stdMins = 8 * 60;
        // build last-7-days slots
        const slots = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const rec = weekRecords.find(r => r.date === dateStr);
          const mins = (rec?.checkInTime && rec?.checkOutTime)
            ? calcMins(rec.checkInTime, rec.checkOutTime) : 0;
          return {
            label: d.toLocaleDateString('en-KE', { weekday: 'short' }),
            mins,
            pct: Math.min(100, Math.round((mins / stdMins) * 100)),
            isToday: dateStr === new Date().toISOString().split('T')[0],
          };
        });
        const totalWeekMins = slots.reduce((s, d) => s + d.mins, 0);
        const workedDays = slots.filter(d => d.mins > 0).length;
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">This Week</p>
              <div className="flex items-center gap-3 text-xs text-foreground/50">
                <span><strong className="text-foreground">{fmtDuration(totalWeekMins)}</strong> total</span>
                <span><strong className="text-foreground">{workedDays}</strong> days</span>
              </div>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-20">
              {slots.map((d, i) => {
                const barColor = d.mins >= stdMins ? 'bg-emerald-400' : d.mins >= stdMins * 0.75 ? 'bg-amber-400' : d.mins > 0 ? 'bg-rose-400' : 'bg-gray-100';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-foreground/40 font-medium">
                      {d.mins > 0 ? fmtDuration(d.mins) : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '48px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${barColor} ${d.isToday ? 'ring-2 ring-primary/30' : ''}`}
                        style={{ height: `${Math.max(d.pct, d.mins > 0 ? 8 : 0)}%`, minHeight: d.mins > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${d.isToday ? 'text-primary' : 'text-foreground/40'}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
            {/* legend */}
            <div className="flex items-center gap-3 text-[10px] text-foreground/40">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400 inline-block"/>≥8h</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block"/>≥6h</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400 inline-block"/>&lt;6h</span>
              <span className="ml-auto">Standard: 8h/day</span>
            </div>
          </div>
        );
      })()}

      {/* ── Notification toggle ── */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${notifEnabled ? 'bg-primary/8' : 'bg-gray-100'}`}>
          <Bell className={`h-3.5 w-3.5 ${notifEnabled ? 'text-primary/60' : 'text-foreground/30'}`} />
        </div>
        <p className="text-[10px] text-foreground/50 leading-relaxed flex-1">
          {notifEnabled
            ? 'Browser reminders are on — 15 min before work starts and ends.'
            : 'Browser reminders are off.'}
        </p>
        <button
          onClick={() => {
            const next = !notifEnabled;
            setNotifEnabled(next);
            localStorage.setItem('notifications_enabled', String(next));
          }}
          className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${notifEnabled ? 'bg-primary' : 'bg-gray-200'}`}
          aria-label="Toggle notifications"
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* ── Clock in/out confirmation dialog ── */}
      {confirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${confirmPending === 'in' ? 'bg-primary/10' : 'bg-rose-50'}`}>
                {confirmPending === 'in'
                  ? <LogIn className="h-7 w-7 text-primary" />
                  : <LogOut className="h-7 w-7 text-rose-500" />
                }
              </div>
              <div>
                <p className="font-bold text-base text-foreground">
                  {confirmPending === 'in' ? 'Clock In?' : 'Clock Out?'}
                </p>
                <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                  {confirmPending === 'in'
                    ? 'This will record your start time and capture your current location.'
                    : 'This will record your end time. Make sure you are ready to finish for the day.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmPending(null)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-foreground/60 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = confirmPending;
                  setConfirmPending(null);
                  if (action === 'in') handleClockIn();
                  else handleClockOut();
                }}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-colors ${confirmPending === 'in' ? 'bg-primary hover:brightness-110' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                Yes, {confirmPending === 'in' ? 'Clock In' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
