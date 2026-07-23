'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { MyPayslip } from '@/features/payroll/Components/MyPayslipsPanel';
import type { AttendanceGroup } from '@/features/attendance/Hooks/useAttendance';
import type { StaffEmployee } from './useStaffPortal';

export interface Notification {
  _id: string;
  title: string;
  body: string;
  subtitle?: string;
  type: 'payroll' | 'leave' | 'announcement' | 'onboarding' | 'offboarding' | 'task' | 'general';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  audience: 'all' | 'department' | 'hr_only';
  department?: string;
  createdByName: string;
  createdAt: string;
  isRead: boolean;
}

export interface MyDocument {
  docId: string;
  docType: string;
  fileName: string;
  uploadedAt: string;
}

export interface AppraisalRecord {
  _id: string;
  reviewPeriod: string;
  rating: number;
  comments?: string;
  goalsSet: string[];
  goalsAchieved: string[];
  createdAt: string;
}

export interface EmployeeTask {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'blocked';
  type?: string;
  module?: string;
  assignedBy?: string;
  assignedToName?: string;
  completedAt?: string;
}

export interface EmpAward {
  _id: string;
  awardTypeId: string;
  awardTypeName: string;
  year: number;
  notes?: string;
  awardedAt: string;
}

export interface MyGoal {
  _id: string;
  title: string;
  description?: string;
  category: string;
  period: string;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ReviewResult {
  _id: string;
  reviewType: 'self' | 'manager';
  overallRating: number | null;
  responses: { question?: string; answer?: string }[];
  cycleName: string | null;
  submittedAt: string;
  recommendation?: string | null;
}

export interface MyProjectTimeEntry {
  _id: string;
  hours: number;
  date: string;
  description?: string | null;
  task?: string | null;
  billable: boolean;
}

export interface MyProject {
  _id: string;
  name: string;
  code: string;
  description?: string | null;
  clientName?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  currency: string;
  myRole: string;
  myHours: number;
  myRecentEntries: MyProjectTimeEntry[];
}

export interface ScheduledEvent {
  _id: string;
  title: string;
  type: 'training' | 'team_building';
  description?: string;
  scheduledDate: string;
  endDate?: string;
  location?: string;
  audience: 'all' | 'department';
  department?: string;
}

export interface MyWelfareMembership {
  schemeId: string | null;
  schemeName: string;
  description: string;
  contributionType: 'fixed' | 'percentage' | null;
  amount: number;
  effectiveFrom: string;
}

interface MyPortalState {
  profile: StaffEmployee | null;
  payslips: MyPayslip[];
  welfare: MyWelfareMembership[];
  attendance: AttendanceGroup[];
  notifications: Notification[];
  announcements: Announcement[];
  documents: MyDocument[];
  appraisals: AppraisalRecord[];
  goals: MyGoal[];
  reviewResults: ReviewResult[];
  awards: EmpAward[];
  events: ScheduledEvent[];
  myTasks: EmployeeTask[];
  myProjects: MyProject[];
  loading: boolean;
}

interface Envelope { data: any }

export function useMyPortal() {
  const [state, setState] = useState<MyPortalState>({
    profile: null, payslips: [], welfare: [],
    attendance: [], notifications: [], announcements: [],
    documents: [], appraisals: [], goals: [], reviewResults: [], awards: [], events: [], myTasks: [], myProjects: [], loading: true,
  });

  const set = (patch: Partial<MyPortalState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const fetchAll = useCallback(() => {
    set({ loading: true });
    Promise.all([
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/profile`,       showToast: false, thenFn: r => set({ profile: r.data ?? null }),       catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/payslips`,      showToast: false, thenFn: r => set({ payslips: r.data ?? [] }),         catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/welfare`,       showToast: false, thenFn: r => set({ welfare: r.data ?? [] }),          catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/attendance`,    showToast: false, thenFn: r => set({ attendance: r.data ?? [] }),       catchFn: () => {} }),
      apiCallFunction<any>({
        url: `${API_BASE_URL}/notifications?limit=10&unread=true`,
        showToast: false,
        thenFn: r => set({ notifications: (r.data?.data ?? []).map((n: Notification) => ({ ...n, body: n.body || n.subtitle || '' })) }),
        catchFn: () => {},
      }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/announcements`, showToast: false, thenFn: r => set({ announcements: r.data ?? [] }),    catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/documents`,     showToast: false, thenFn: r => set({ documents: r.data ?? [] }),        catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/performance`, showToast: false, thenFn: r => {
        const d = r.data;
        if (d && typeof d === 'object' && 'appraisals' in d) {
          set({ appraisals: d.appraisals ?? [], goals: d.goals ?? [], reviewResults: d.reviews ?? [] });
        } else {
          set({ appraisals: Array.isArray(d) ? d : [] });
        }
      }, catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/awards`,        showToast: false, thenFn: r => set({ awards: r.data ?? [] }),            catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/events`,        showToast: false, thenFn: r => set({ events: r.data ?? [] }),            catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/tasks`,         showToast: false, thenFn: r => set({ myTasks: r.data ?? [] }),           catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/projects`,      showToast: false, thenFn: r => set({ myProjects: r.data ?? [] }),        catchFn: () => {} }),
    ]).finally(() => set({ loading: false }));
  }, []);

  const refreshNotifications = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/notifications?limit=10&unread=true`,
      showToast: false,
      thenFn: r => set({ notifications: (r.data?.data ?? []).map((n: Notification) => ({ ...n, body: n.body || n.subtitle || '' })) }),
      catchFn: () => {},
    });
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/announcements`, showToast: false, thenFn: r => set({ announcements: r.data ?? [] }), catchFn: () => {} });
  }, []);

  const markNotifRead = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/${id}/read`, method: 'PUT', showToast: false });
    setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n._id !== id) }));
  };

  const markAllNotifsRead = () => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/read-all`, method: 'PUT', showToast: false });
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const markAnnouncementRead = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/me/announcements/${id}/read`, method: 'PATCH', showToast: false });
    setState(prev => ({ ...prev, announcements: prev.announcements.map(a => a._id === id ? { ...a, isRead: true } : a) }));
  };

  const updateProfile = (data: Record<string, unknown>) =>
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/profile`, method: 'PATCH', data,
      thenFn: () => fetchAll() });

  const refreshDocuments = useCallback(() => {
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/documents`, showToast: false, thenFn: r => set({ documents: r.data ?? [] }), catchFn: () => {} });
  }, []);

  const deleteDocument = (docId: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/me/documents/${docId}`, method: 'DELETE', showToast: false,
      thenFn: () => setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.docId !== docId) })) });
  };

  // Poll for new notifications every 60 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(refreshNotifications, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll, refreshNotifications]);

  return { ...state, fetchAll, refreshNotifications, updateProfile, markNotifRead, markAllNotifsRead, markAnnouncementRead, refreshDocuments, deleteDocument };
}
