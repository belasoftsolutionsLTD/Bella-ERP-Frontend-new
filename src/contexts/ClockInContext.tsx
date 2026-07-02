'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export type ClockState = 'idle' | 'working' | 'on_break';
export type WorkLocation = 'office' | 'home' | 'remote' | 'client_site';

interface ClockInData {
  state: ClockState;
  clockedInAt: Date | null;
  breakStartedAt: Date | null;
  elapsedSeconds: number;
  breakSeconds: number;
  location: WorkLocation;
  project: string;
}

interface ClockInContextValue extends ClockInData {
  clockIn: (location: WorkLocation, project?: string) => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  setProject: (project: string) => void;
  loading: boolean;
}

const ClockInContext = createContext<ClockInContextValue | undefined>(undefined);

export function ClockInProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClockState>('idle');
  const [clockedInAt, setClockedInAt] = useState<Date | null>(null);
  const [breakStartedAt, setBreakStartedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [location, setLocation] = useState<WorkLocation>('office');
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore state from backend on mount
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    apiCallFunction<{ data: Record<string, unknown> | null }>({
      url: `${API_BASE_URL}/attendance/today-status`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => {
        const record = res?.data;
        if (!record?.checkInTime) return;

        const checkedIn = new Date(record.checkInTime as string);
        setClockedInAt(checkedIn);

        // Find open break
        const breaks = (record.breaks as Array<{ startTime: string; endTime: string | null }>) || [];
        const openBreak = breaks.find(b => !b.endTime);

        if (record.checkOutTime) {
          setState('idle');
        } else if (openBreak) {
          setState('on_break');
          setBreakStartedAt(new Date(openBreak.startTime));
        } else {
          setState('working');
        }

        // Compute total break time from closed breaks
        const closedBreakSecs = breaks
          .filter(b => b.endTime)
          .reduce((sum, b) => {
            return sum + Math.floor((new Date(b.endTime!).getTime() - new Date(b.startTime).getTime()) / 1000);
          }, 0);
        setBreakSeconds(closedBreakSecs);
      },
    });
  }, []);

  // Tick every second
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        if (state === 'working' && clockedInAt) {
          return Math.floor((Date.now() - clockedInAt.getTime()) / 1000);
        }
        return prev;
      });
      if (state === 'on_break' && breakStartedAt) {
        setBreakSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [state, clockedInAt, breakStartedAt]);

  const clockIn = useCallback(async (loc: WorkLocation, proj = '') => {
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-in`,
      method: 'POST',
      data: { workLocation: loc, project: proj },
      showToast: true,
      thenFn: () => {
        const now = new Date();
        setState('working');
        setClockedInAt(now);
        setLocation(loc);
        setProject(proj);
        setElapsedSeconds(0);
        setBreakSeconds(0);
      },
    });
    setLoading(false);
  }, []);

  const clockOut = useCallback(async () => {
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/clock-out`,
      method: 'POST',
      data: {},
      showToast: true,
      thenFn: () => {
        setState('idle');
        setClockedInAt(null);
        setBreakStartedAt(null);
        setElapsedSeconds(0);
        setBreakSeconds(0);
      },
    });
    setLoading(false);
  }, []);

  const startBreak = useCallback(async () => {
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-start`,
      method: 'POST',
      data: {},
      showToast: true,
      thenFn: () => {
        setState('on_break');
        setBreakStartedAt(new Date());
      },
    });
    setLoading(false);
  }, []);

  const endBreak = useCallback(async () => {
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/attendance/break-end`,
      method: 'POST',
      data: {},
      showToast: true,
      thenFn: () => {
        setState('working');
        setBreakStartedAt(null);
      },
    });
    setLoading(false);
  }, []);

  return (
    <ClockInContext.Provider value={{
      state, clockedInAt, breakStartedAt, elapsedSeconds, breakSeconds,
      location, project,
      clockIn, clockOut, startBreak, endBreak,
      setProject,
      loading,
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
