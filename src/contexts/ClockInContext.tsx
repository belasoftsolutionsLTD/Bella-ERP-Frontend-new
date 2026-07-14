'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export type ClockState = 'idle' | 'working' | 'on_break';
export type WorkLocation = 'office' | 'home' | 'remote' | 'client_site';
export type ClockStep = 'idle' | 'locating' | 'geocoding' | 'submitting';

export interface BreakEntry {
  startTime: string;
  endTime?: string | null;
  duration?: number;
}

export interface TodayRecord {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInAt?: string | null;
  mode?: string;
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

export interface WeekRecord {
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
}

interface ClockInContextValue {
  // Legacy summary state (dashboard's lightweight widget)
  state: ClockState;
  clockedInAt: Date | null;
  breakStartedAt: Date | null;
  elapsedSeconds: number;
  breakSeconds: number;
  location: WorkLocation;

  // Full record state (attendance page / staff portal widget)
  record: TodayRecord | null;
  weekRecords: WeekRecord[];
  step: ClockStep;
  geoError: string | null;

  clockIn: (location: WorkLocation) => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  refetch: () => void;

  loading: boolean; // initial fetch
  busy: boolean;    // action in flight
}

const ClockInContext = createContext<ClockInContextValue | undefined>(undefined);

function acquireGPS(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  );
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

function deriveState(record: TodayRecord | null): ClockState {
  if (!record?.checkInTime || record.checkOutTime) return 'idle';
  const openBreak = (record.breaks || []).find((b) => !b.endTime);
  return openBreak ? 'on_break' : 'working';
}

export function ClockInProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<TodayRecord | null>(null);
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [location, setLocationState] = useState<WorkLocation>('office');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<ClockStep>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const state = deriveState(record);
  const clockedInAt = record?.checkInAt ? new Date(record.checkInAt) : null;
  const openBreak = record?.breaks?.find((b) => !b.endTime) || null;
  const breakStartedAt = openBreak ? new Date(openBreak.startTime) : null;

  const fetchStatus = useCallback(() => {
    apiCallFunction<{ data: TodayRecord | null }>({
      url: `${API_BASE_URL}/attendance/today-status`,
      showToast: false,
      thenFn: (r) => setRecord(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const fetchWeekRecords = useCallback(() => {
    apiCallFunction<{ data: WeekRecord[] }>({
      url: `${API_BASE_URL}/attendance/my-records?days=7`,
      showToast: false,
      thenFn: (r) => setWeekRecords(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const refetch = useCallback(() => {
    fetchStatus();
    fetchWeekRecords();
  }, [fetchStatus, fetchWeekRecords]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    refetch();
  }, [refetch]);

  // Tick every second while working or on break — derived purely from the shared record.
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (state === 'working' && clockedInAt) {
        const pastBreakMs = (record?.breaks || []).reduce((sum, b) => {
          if (b.endTime) return sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
          return sum;
        }, 0);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - clockedInAt.getTime() - pastBreakMs) / 1000)));
      }
      if (state === 'on_break' && breakStartedAt) {
        setBreakSeconds(Math.max(0, Math.floor((Date.now() - breakStartedAt.getTime()) / 1000)));
      }
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, clockedInAt?.getTime(), breakStartedAt?.getTime()]);

  // GPS capture is required by the backend for every clock event — previously the
  // dashboard's lightweight widget called clockIn()/clockOut() with no coordinates
  // at all, so every clock-in attempted from the dashboard silently 400'd.
  const captureLocation = async (): Promise<{ latitude: number; longitude: number; locationName: string } | null> => {
    setGeoError(null);
    if (!navigator.geolocation) { setGeoError('GPS not supported in your browser.'); return null; }
    setStep('locating');
    try {
      const pos = await acquireGPS();
      setStep('geocoding');
      const locationName = await reverseGeocode(pos.latitude, pos.longitude);
      return { ...pos, locationName };
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

  const clockIn = useCallback(async (loc: WorkLocation) => {
    const gps = await captureLocation();
    if (!gps) return;
    setBusy(true);
    setStep('submitting');
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-in`,
      method: 'POST',
      data: { latitude: gps.latitude, longitude: gps.longitude, locationName: gps.locationName, workLocation: loc },
      showToast: true,
      thenFn: () => { setLocationState(loc); refetch(); },
      catchFn: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Clock-in failed.';
        setGeoError(msg);
      },
    });
    setStep('idle');
    setBusy(false);
  }, [refetch]);

  const clockOut = useCallback(async () => {
    const gps = await captureLocation();
    if (!gps) return;
    setBusy(true);
    setStep('submitting');
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-out`,
      method: 'POST',
      data: { latitude: gps.latitude, longitude: gps.longitude, locationName: gps.locationName },
      showToast: true,
      thenFn: () => { refetch(); setElapsedSeconds(0); setBreakSeconds(0); },
      catchFn: () => { setGeoError('Clock-out failed.'); },
    });
    setStep('idle');
    setBusy(false);
  }, [refetch]);

  const startBreak = useCallback(async () => {
    setBusy(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-start`,
      method: 'POST',
      data: {},
      showToast: true,
      thenFn: () => { refetch(); setBreakSeconds(0); },
    });
    setBusy(false);
  }, [refetch]);

  const endBreak = useCallback(async () => {
    setBusy(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-end`,
      method: 'POST',
      data: {},
      showToast: true,
      thenFn: () => refetch(),
    });
    setBusy(false);
  }, [refetch]);

  return (
    <ClockInContext.Provider value={{
      state, clockedInAt, breakStartedAt, elapsedSeconds, breakSeconds, location,
      record, weekRecords, step, geoError,
      clockIn, clockOut, startBreak, endBreak, refetch,
      loading, busy,
    }}>
      {children}
    </ClockInContext.Provider>
  );
}

export function useClockIn() {
  const ctx = useContext(ClockInContext);
  if (!ctx) throw new Error('useClockIn must be used inside ClockInProvider');
  return ctx;
}
