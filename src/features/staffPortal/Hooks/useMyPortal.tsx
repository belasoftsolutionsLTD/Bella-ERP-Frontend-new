'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBalance, LeaveRequest } from '@/features/leave/Hooks/useLeave';
import type { PayrollSummary } from '@/features/payroll/Hooks/usePayroll';
import type { AttendanceGroup } from '@/features/attendance/Hooks/useAttendance';
import type { StaffEmployee } from './useStaffPortal';

export interface OnboardingTask {
  _id: string;
  taskTitle: string;
  assignedDepartment: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  description?: string;
}

export interface Notification {
  _id: string;
  title: string;
  body: string;
  type: 'payroll' | 'leave' | 'announcement' | 'onboarding' | 'general';
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
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedBy?: string;
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

interface MyPortalState {
  profile: StaffEmployee | null;
  leaveBalance: LeaveBalance | null;
  leaveRequests: LeaveRequest[];
  payslips: PayrollSummary[];
  attendance: AttendanceGroup[];
  onboardingTasks: OnboardingTask[];
  notifications: Notification[];
  announcements: Announcement[];
  documents: MyDocument[];
  appraisals: AppraisalRecord[];
  awards: EmpAward[];
  events: ScheduledEvent[];
  myTasks: EmployeeTask[];
  loading: boolean;
}

interface Envelope { data: any }

export function useMyPortal() {
  const [state, setState] = useState<MyPortalState>({
    profile: null, leaveBalance: null, leaveRequests: [], payslips: [],
    attendance: [], onboardingTasks: [], notifications: [], announcements: [],
    documents: [], appraisals: [], awards: [], events: [], myTasks: [], loading: true,
  });

  const set = (patch: Partial<MyPortalState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const fetchAll = useCallback(() => {
    set({ loading: true });
    Promise.all([
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/profile`,       showToast: false, thenFn: r => set({ profile: r.data ?? null }),       catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/leave/balance`, showToast: false, thenFn: r => set({ leaveBalance: r.data ?? null }),   catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/leave/requests`,showToast: false, thenFn: r => set({ leaveRequests: r.data ?? [] }),    catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/payslips`,      showToast: false, thenFn: r => set({ payslips: r.data ?? [] }),         catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/attendance`,    showToast: false, thenFn: r => set({ attendance: r.data ?? [] }),       catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/onboarding`,    showToast: false, thenFn: r => set({ onboardingTasks: r.data ?? [] }),  catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/hr/notifications`, showToast: false, thenFn: r => set({ notifications: r.data ?? [] }),    catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/announcements`, showToast: false, thenFn: r => set({ announcements: r.data ?? [] }),    catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/documents`,     showToast: false, thenFn: r => set({ documents: r.data ?? [] }),        catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/performance`,   showToast: false, thenFn: r => set({ appraisals: r.data ?? [] }),       catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/awards`,        showToast: false, thenFn: r => set({ awards: r.data ?? [] }),            catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/events`,        showToast: false, thenFn: r => set({ events: r.data ?? [] }),            catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/tasks`,         showToast: false, thenFn: r => set({ myTasks: r.data ?? [] }),           catchFn: () => {} }),
    ]).finally(() => set({ loading: false }));
  }, []);

  const refreshOnboarding = useCallback(() => {
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/onboarding`, showToast: false, thenFn: r => set({ onboardingTasks: r.data ?? [] }), catchFn: () => {} });
  }, []);

  const refreshLeave = useCallback(() => {
    Promise.all([
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/leave/balance`,  showToast: false, thenFn: r => set({ leaveBalance: r.data ?? null }), catchFn: () => {} }),
      apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/leave/requests`, showToast: false, thenFn: r => set({ leaveRequests: r.data ?? [] }),  catchFn: () => {} }),
    ]);
  }, []);

  const refreshNotifications = useCallback(() => {
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/hr/notifications`, showToast: false, thenFn: r => set({ notifications: r.data ?? [] }), catchFn: () => {} });
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/announcements`, showToast: false, thenFn: r => set({ announcements: r.data ?? [] }), catchFn: () => {} });
  }, []);

  const markNotifRead = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/hr/notifications/${id}/read`, method: 'PATCH', showToast: false });
    set({ notifications: state.notifications.filter(n => n._id !== id) });
  };

  const markAllNotifsRead = () => {
    apiCallFunction({ url: `${API_BASE_URL}/hr/notifications/read-all`, method: 'PATCH', showToast: false });
    set({ notifications: [] });
  };

  const markAnnouncementRead = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/me/announcements/${id}/read`, method: 'PATCH', showToast: false });
    set({ announcements: state.announcements.map(a => a._id === id ? { ...a, isRead: true } : a) });
  };

  const updateProfile = (data: Record<string, string>) =>
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/profile`, method: 'PATCH', data,
      thenFn: () => fetchAll() });

  const disputeLeave = (id: string, reason: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/me/leave/requests/${id}/dispute`, method: 'POST', data: { reason },
      thenFn: () => refreshLeave() });

  const refreshDocuments = useCallback(() => {
    apiCallFunction<Envelope>({ url: `${API_BASE_URL}/me/documents`, showToast: false, thenFn: r => set({ documents: r.data ?? [] }), catchFn: () => {} });
  }, []);

  const deleteDocument = (docId: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/me/documents/${docId}`, method: 'DELETE', showToast: false,
      thenFn: () => set({ documents: state.documents.filter(d => d.docId !== docId) }) });
  };

  // Poll for new notifications every 60 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(refreshNotifications, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll, refreshNotifications]);

  return { ...state, fetchAll, refreshLeave, refreshNotifications, refreshOnboarding, updateProfile, disputeLeave, markNotifRead, markAllNotifsRead, markAnnouncementRead, refreshDocuments, deleteDocument };
}
