'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import {
  User, CalendarDays, DollarSign, Clock, ClipboardList, Loader2,
  Mail, Phone, Briefcase, Building2, MessageSquare, Plus,
  CheckCircle2, CheckCircle, Circle, ChevronRight, Pencil, X, Save,
  CreditCard, Landmark, Smartphone, AlertTriangle, Bell,
  CheckCheck, FileText, BarChart3, FolderOpen, Shield,
  Upload, Trash2, Download, Printer, Star, TrendingUp, TrendingDown,
  Trophy, BookOpen, Dumbbell, MapPin, BellOff, Menu, Eye,
} from 'lucide-react';
import { DocViewerModal } from '@/components/custom-ui/DocViewerModal';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile, openFile } from '@/functions/downloadFile';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { useMyPortal, type OnboardingTask, type OffboardingTask, type MyDocument, type AppraisalRecord, type EmpAward, type ScheduledEvent, type EmployeeTask, type MyGoal, type ReviewResult, type MyProject, type MyProjectTimeEntry } from '../Hooks/useMyPortal';
import { MyShiftsTab } from './MyShiftsTab';
import CommunicationPage from '@/features/communication/Pages/CommunicationPage';
import InboxPage from '@/features/inbox/Pages/InboxPage';
import AwardsPage from '@/features/awards/Pages/AwardsPage';
import { LeaveBalanceCard } from '@/features/leave/Components/LeaveBalanceCard';
import { PayrollTable } from '@/features/payroll/Components/PayrollTable';
import { AttendanceGrid } from '@/features/attendance/Components/AttendanceGrid';
import { ClockInWidget } from '@/features/attendance/Components/ClockInWidget';
import { TimesheetsTab } from '@/features/attendance/Components/TimesheetsTab';
import { LogLeaveModal } from '@/features/leave/Components/LogLeaveModal';
import type { LeaveRequest } from '@/features/leave/Hooks/useLeave';

type Section = 'profile' | 'leave' | 'payslips' | 'attendance' | 'timesheets' | 'shifts' | 'onboarding' | 'offboarding' | 'tasks' | 'payment' | 'messages' | 'inbox' | 'documents' | 'performance' | 'awards' | 'events' | 'training' | 'jd' | 'terms' | 'expenses' | 'projects' | 'jobs';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',     'from-fuchsia-500 to-violet-600',
];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const STATUS_STYLE: Record<string, string> = {
  active:     'bg-emerald-100 text-emerald-700',
  on_leave:   'bg-amber-100 text-amber-700',
  suspended:  'bg-red-100 text-red-700',
  terminated: 'bg-gray-100 text-gray-500',
};

const NOTIF_COLORS: Record<string, string> = {
  payroll:      'bg-emerald-100 text-emerald-700',
  leave:        'bg-blue-100 text-blue-700',
  announcement: 'bg-violet-100 text-violet-700',
  onboarding:   'bg-amber-100 text-amber-700',
  task:         'bg-indigo-100 text-indigo-700',
  general:      'bg-gray-100 text-gray-600',
};

const NAV: { key: Section; label: string; icon: typeof User; description: string }[] = [
  // ── Daily essentials ──
  { key: 'profile',      label: 'My Profile',          icon: User,          description: 'Personal & contact info' },
  { key: 'inbox',        label: 'Inbox',                icon: Bell,          description: 'Approvals & action items' },
  // ── Time & attendance ──
  { key: 'attendance',   label: 'Attendance',           icon: Clock,         description: 'Daily records & clock-in' },
  { key: 'timesheets',   label: 'Timesheets',           icon: Clock,         description: 'Weekly timesheets & hours logged' },
  { key: 'shifts',       label: 'My Shifts',            icon: CalendarDays,  description: 'Upcoming shifts & open shift applications' },
  { key: 'leave',        label: 'Leave',                icon: CalendarDays,  description: 'Balance & requests' },
  // ── Tasks & work ──
  { key: 'tasks',        label: 'My Tasks',             icon: CheckCircle2,  description: 'Tasks assigned by HR' },
  { key: 'projects',     label: 'My Projects',          icon: Briefcase,     description: 'Projects you are a member of' },
  { key: 'jd',           label: 'Job Description',      icon: FileText,      description: 'Your role & responsibilities' },
  // ── Finance ──
  { key: 'payslips',     label: 'Payslips',             icon: DollarSign,    description: 'Monthly payroll history' },
  { key: 'expenses',     label: 'Expenses',             icon: DollarSign,    description: 'Submit & track claims' },
  { key: 'payment',      label: 'Payment Methods',      icon: CreditCard,    description: 'Bank & M-Pesa details' },
  // ── Growth ──
  { key: 'jobs',         label: 'Internal Jobs',        icon: Briefcase,     description: 'Open vacancies & apply internally' },
  { key: 'training',     label: 'Training',             icon: BookOpen,      description: 'Enroll in published courses' },
  { key: 'performance',  label: 'My Performance',       icon: BarChart3,     description: 'Goals, reviews & appraisal history' },
  { key: 'awards',       label: 'Awards & Recognition', icon: Trophy,        description: 'Kudos, leaderboard & certifications' },
  // ── Communication ──
  { key: 'messages',     label: 'Communication',        icon: MessageSquare, description: 'Feed, 1:1 meetings & announcements' },
  { key: 'events',       label: 'Events & Schedule',    icon: CalendarDays,  description: 'Upcoming training & team building' },
  // ── Documents & onboarding ──
  { key: 'documents',    label: 'My Documents',         icon: FolderOpen,    description: 'Certificates & files' },
  { key: 'onboarding',   label: 'Onboarding',           icon: ClipboardList, description: 'Tasks & checklist' },
  { key: 'offboarding',  label: 'Offboarding',          icon: ClipboardList, description: 'Exit checklist' },
  // ── Policies ──
  { key: 'terms',        label: 'Terms & Conditions',   icon: Shield,        description: 'Policies & agreements' },
];

function ProfilePhotoAvatar({ profile }: { profile: { fullName: string; photoPath?: string } }) {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  const photoUrl = profile.photoPath
    ? `${API_BASE_URL.replace(/\/api$/, '/uploads')}/${profile.photoPath}?token=${encodeURIComponent(token)}`
    : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [src, setSrc] = useState<string | null>(photoUrl);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    setUploading(true);
    apiCallFunction({
      url: `${API_BASE_URL}/me/profile/photo`,
      method: 'POST',
      data: fd,
      thenFn: (r: any) => {
        const newPath = r?.data?.photoPath;
        if (newPath) setSrc(`${API_BASE_URL.replace(/\/api$/, '/uploads')}/${newPath}?token=${encodeURIComponent(token)}&t=${Date.now()}`);
      },
      finallyFn: () => setUploading(false),
    });
  };

  return (
    <div
      className="relative h-12 w-12 rounded-xl shrink-0 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
      title="Click to change profile photo"
    >
      {src ? (
        <img src={src} alt={profile.fullName} className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <div className={cn('h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-bold text-white', avatarColor(profile.fullName))}>
          {profile.fullName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        {uploading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Upload className="h-4 w-4 text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

export function MyPortalView() {
  const {
    profile, leaveBalance, leaveRequests, payslips, attendance, onboardingTasks, offboardingTasks,
    notifications, announcements, documents, appraisals, goals, reviewResults, events, myTasks, myProjects, loading,
    refreshLeave, refreshOnboarding, refreshOffboarding, updateProfile, disputeLeave,
    markNotifRead, markAllNotifsRead,
    refreshDocuments, deleteDocument,
  } = useMyPortal();

  const [active, setActive]           = useState<Section>('profile');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifsOn, setNotifsOn]       = useState(true);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const now = new Date();

  useEffect(() => {
    apiCallFunction<{ data: { notificationsEnabled: boolean } }>({
      url: `${API_BASE_URL}/me/notifications/preference`,
      showToast: false,
      thenFn: r => setNotifsOn(r.data?.notificationsEnabled !== false),
      catchFn: () => {},
    });
  }, []);

  const toggleNotifPref = () => {
    if (togglingNotif) return;
    setTogglingNotif(true);
    setNotifsOn(prev => !prev);
    apiCallFunction({
      url: `${API_BASE_URL}/me/notifications/toggle`,
      method: 'PATCH',
      showToast: false,
      finallyFn: () => setTogglingNotif(false),
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <User className="h-12 w-12 text-slate-500 opacity-50" />
      <p className="text-sm font-medium text-slate-300">No employee record linked to your account.</p>
      <p className="text-xs text-slate-500">Contact HR to link your account to an employee record.</p>
    </div>
  );

  const pendingOnboarding  = onboardingTasks.filter(t => t.status !== 'completed').length;
  const unreadAnnouncements = announcements.filter(a => !a.isRead).length;
  const unreadNotifs = notifications.length;
  const totalUnread  = unreadNotifs + unreadAnnouncements;

  const pendingTasks        = myTasks.filter(t => t.status !== 'completed').length;
  const pendingOffboarding  = offboardingTasks.filter(t => t.status !== 'completed').length;

  const navBadge = (key: Section) => {
    if (key === 'onboarding')    return pendingOnboarding || null;
    if (key === 'offboarding')   return pendingOffboarding || null;
    if (key === 'messages')      return unreadAnnouncements || null;
    if (key === 'tasks')         return pendingTasks || null;
    return null;
  };

  return (
    <>
      {showLeaveModal && (
        <LogLeaveModal
          employeeId={profile._id}
          employeeName={profile.fullName}
          onClose={() => setShowLeaveModal(false)}
          onSuccess={() => { setShowLeaveModal(false); refreshLeave(); }}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      <div className="flex gap-5 h-[calc(100vh-5rem)] min-h-0">

        {/* ── Left sidebar ── */}
        <aside className={cn(
          'shrink-0 flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden transition-all',
          'lg:w-64',
          showSidebar
            ? 'fixed inset-y-4 left-4 z-50 w-72 max-h-[calc(100vh-2rem)]'
            : 'hidden lg:flex',
        )}>
          <div className="bg-gradient-to-br from-primary to-[#1a3461] p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <ProfilePhotoAvatar profile={profile} />

              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{profile.fullName}</p>
                <p className="text-white/60 text-xs truncate">{profile.designation}</p>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md">{profile.staffNumber}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium capitalize', STATUS_STYLE[profile.status] ?? 'bg-gray-100 text-gray-500')}>
                {profile.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-2">{profile.department}</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {NAV.map(({ key, label, icon: Icon, description }) => {
              const isActive = active === key;
              const badge = navBadge(key);
              return (
                <button key={key} onClick={() => { setActive(key); setShowSidebar(false); }}
                  className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5',
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-foreground/70 hover:bg-gray-50 hover:text-foreground')}>
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isActive ? 'bg-white/20' : 'bg-gray-100')}>
                    <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-foreground/60')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-foreground')}>{label}</p>
                    <p className={cn('text-xs truncate', isActive ? 'text-white/60' : 'text-foreground/40')}>{description}</p>
                  </div>
                  {badge
                    ? <span className={cn('h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center shrink-0', isActive ? 'bg-white text-primary' : 'bg-primary text-white')}>{badge}</span>
                    : <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white/60' : 'text-foreground/20')} />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content area ── */}
        <main className="flex-1 min-w-0 rounded-2xl border bg-white shadow-sm overflow-y-auto">

          {/* Sticky header */}
          <div className="sticky top-0 bg-white border-b px-6 py-3 z-10">
            {(() => {
              const item = NAV.find(n => n.key === active)!;
              const Icon = item.icon;
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden h-9 w-9 rounded-xl bg-gray-100 text-foreground/60 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-foreground truncate">{item.label}</h2>
                    <p className="text-xs text-foreground/40 hidden sm:block">{item.description}</p>
                  </div>

                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    {active === 'leave' && (
                      <button onClick={() => setShowLeaveModal(true)}
                        className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Apply for Leave
                      </button>
                    )}

                    {/* Notification bell */}
                    <div className="relative">
                      <button
                        onClick={() => setShowNotifPanel(v => !v)}
                        className={cn('relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors',
                          showNotifPanel ? 'bg-primary text-white' : 'bg-gray-100 text-foreground/60 hover:bg-gray-200')}
                      >
                        {notifsOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 opacity-50" />}
                        {notifsOn && totalUnread > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {totalUnread > 9 ? '9+' : totalUnread}
                          </span>
                        )}
                      </button>

                      {/* Dropdown panel */}
                      {showNotifPanel && (
                        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border z-50 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                            <span className="text-sm font-bold text-foreground">Notifications</span>
                            {unreadNotifs > 0 && (
                              <button onClick={markAllNotifsRead} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto divide-y">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-foreground/30 text-sm">No new notifications</div>
                            ) : notifications.map(n => {
                              const LINK_MAP: Record<string, Section> = {
                                '/leave': 'leave', '/tasks': 'tasks', '/onboarding': 'onboarding',
                                '/offboarding': 'offboarding', '/payslips': 'payslips',
                                '/attendance': 'attendance', '/payroll': 'payslips',
                                '/projects': 'projects', '/training': 'training',
                                '/expenses': 'expenses', '/performance': 'performance',
                              };
                              const dest = n.link ? Object.entries(LINK_MAP).find(([k]) => n.link!.includes(k))?.[1] : undefined;
                              return (
                                <div key={n._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <button
                                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                                    onClick={() => {
                                      markNotifRead(n._id);
                                      if (dest) { setActive(dest); setShowNotifPanel(false); }
                                    }}
                                  >
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 capitalize', NOTIF_COLORS[n.type] ?? NOTIF_COLORS.general)}>
                                      {n.type}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn('text-sm font-semibold text-foreground leading-tight', dest && 'hover:text-primary')}>{n.title}</p>
                                      <p className="text-xs text-foreground/50 mt-0.5 leading-snug">{n.body || (n as any).subtitle || ''}</p>
                                      <p className="text-xs text-foreground/30 mt-1">{new Date(n.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                                    </div>
                                  </button>
                                  <button onClick={() => markNotifRead(n._id)} className="text-foreground/20 hover:text-foreground shrink-0" aria-label="Dismiss notification">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50">
                            <span className="text-xs text-foreground/50">Notifications {notifsOn ? 'on' : 'off'}</span>
                            <button onClick={toggleNotifPref} disabled={togglingNotif}
                              className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none', notifsOn ? 'bg-primary' : 'bg-gray-300')}>
                              <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', notifsOn ? 'translate-x-4' : 'translate-x-1')} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Overlay to close notification panel */}
          {showNotifPanel && <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />}

          <div className="p-6">
            {active === 'profile'    && <ProfilePanel profile={profile} onSave={updateProfile} onEditPayment={() => setActive('payment')} />}
            {active === 'payment'    && <PaymentPanel profile={profile} onSave={updateProfile} />}
            {active === 'leave'      && <LeavePanel leaveBalance={leaveBalance} leaveRequests={leaveRequests} onDispute={disputeLeave} />}
            {active === 'payslips'   && (
              payslips.length > 0
                ? <PayrollTable records={payslips} employeeId={profile._id} />
                : <EmptyState icon={DollarSign} text="No payslips yet." sub="Your payslips will appear here once payroll is processed." />
            )}
            {active === 'attendance' && (
              <div className="space-y-6">
                <ClockInWidget />
                <div>
                  <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">This Month's Records</p>
                  {attendance.length > 0
                    ? <AttendanceGrid data={attendance} month={now.getMonth() + 1} year={now.getFullYear()} />
                    : <EmptyState icon={Clock} text="No attendance records found." />
                  }
                </div>
              </div>
            )}
            {active === 'timesheets'  && <div className="-mx-6"><TimesheetsTab /></div>}
            {active === 'shifts'      && <MyShiftsTab />}
            {active === 'onboarding'  && <OnboardingTasksPanel tasks={onboardingTasks} onComplete={() => refreshOnboarding()} />}
            {active === 'offboarding' && <OffboardingPanel tasks={offboardingTasks} onComplete={refreshOffboarding} />}
            {active === 'tasks'       && <MyTasksPanel tasks={myTasks} />}
            {active === 'projects'    && <MyProjectsPanel projects={myProjects} />}
            {active === 'documents'   && <DocumentsPanel docs={documents} onDeleted={deleteDocument} onUploaded={refreshDocuments} employeeId={profile._id} />}
            {active === 'performance' && <PerformancePanel appraisals={appraisals} goals={goals} reviewResults={reviewResults} />}
            {active === 'awards'      && <div className="-m-6"><AwardsPage embedded /></div>}
            {active === 'events'      && <MyEventsPanel events={events} />}
            {active === 'training'    && <TrainingPanel />}
            {active === 'jobs'        && <InternalJobsPanel />}
            {active === 'jd'          && <JobDescriptionPanel jd={(profile as any).jobDescription} />}
            {active === 'expenses'    && <ExpensesPanel />}
            {active === 'terms'          && <TermsPanel />}
            {active === 'messages'       && <div className="-m-6"><CommunicationPage /></div>}
            {active === 'inbox'          && <div className="-m-6"><InboxPage /></div>}
          </div>
        </main>
      </div>
    </>
  );
}

// ── Profile panel ──────────────────────────────────────────────────────────────
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Bank Transfer', mpesa: 'M-Pesa', cash: 'Cash', paypal: 'PayPal', crypto: 'Crypto',
};

const NOTE_COLORS: Record<string, string> = {
  commendation:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  verbal_warning:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  written_warning:     'bg-orange-100 text-orange-700 border-orange-200',
  disciplinary_action: 'bg-red-100 text-red-700 border-red-200',
  general_note:        'bg-slate-100 text-slate-600 border-slate-200',
};

function ProfilePanel({ profile, onSave, onEditPayment }: {
  profile: any;
  onSave: (d: Record<string, string>) => void;
  onEditPayment?: () => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [email, setEmail]         = useState(profile.email || '');
  const [phone, setPhone]         = useState(profile.phone || '');
  const [nextOfKin, setNextOfKin] = useState(profile.nextOfKin || '');
  const [kraPin, setKraPin]       = useState(profile.kraPin || '');
  const [saving, setSaving]       = useState(false);
  const [myNotes, setMyNotes]     = useState<any[]>([]);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/me/notes`,
      showToast: false,
      thenFn: (r) => setMyNotes(r.data ?? []),
    });
  }, []);

  const gaps: { label: string; critical: boolean; action?: string }[] = [];
  if (!profile.grossPay)                                    gaps.push({ label: 'Gross Pay',       critical: true  });
  if (!profile.jobGroupId)                                  gaps.push({ label: 'Job Group',        critical: true  });
  if (!profile.kraPin)                                      gaps.push({ label: 'Tax ID / PIN',          critical: false, action: 'edit' });
  if (!profile.bankAccountNumber && !profile.mpesaNumber)   gaps.push({ label: 'Payment Details',  critical: false, action: 'payment' });

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ email, phone, nextOfKin, kraPin });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const paymentMethod = profile.paymentMethod || 'bank_transfer';
  const paymentLabel  = PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod;
  const paymentDetail = paymentMethod === 'bank_transfer'
    ? [profile.bankName, profile.bankAccountNumber].filter(Boolean).join(' · ') || '—'
    : paymentMethod === 'mpesa'
      ? profile.mpesaNumber || '—'
      : paymentMethod === 'paypal'
        ? profile.paypalEmail || '—'
        : paymentMethod === 'cash'
          ? 'Paid in cash'
          : profile.cryptoWalletAddress || '—';

  return (
    <div className="space-y-5">
      {/* Profile completeness banner */}
      {gaps.length > 0 && (
        <div className={cn(
          'rounded-xl border px-4 py-3 text-sm',
          gaps.some(g => g.critical) ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
        )}>
          <p className={cn('font-semibold text-xs mb-2', gaps.some(g => g.critical) ? 'text-red-700' : 'text-amber-700')}>
            {gaps.some(g => g.critical) ? '⚠ Your profile has critical gaps that may block payroll' : 'Your profile is missing some details'}
          </p>
          <div className="flex flex-wrap gap-2">
            {gaps.map(g => (
              <span key={g.label} className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                g.critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
              )}>
                {g.label}
                {g.action === 'payment' && onEditPayment && (
                  <button onClick={onEditPayment} className="underline font-bold ml-0.5">Fix →</button>
                )}
                {g.action === 'edit' && (
                  <button onClick={() => setEditing(true)} className="underline font-bold ml-0.5">Fix →</button>
                )}
                {!g.action && <span className="opacity-60 ml-0.5">— Contact HR</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Personal Information</p>
        {!editing
          ? <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Pencil className="h-3.5 w-3.5" /> Edit</button>
          : <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground"><X className="h-3.5 w-3.5" /> Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
        }
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {editing ? <EditField icon={Mail}  label="Email"       value={email}      onChange={setEmail}      color="text-blue-600" />
                 : <InfoRow  icon={Mail}   label="Email"       value={profile.email || '—'}                color="text-blue-600" />}
        {editing ? <EditField icon={Phone} label="Phone"       value={phone}      onChange={setPhone}      color="text-green-600" />
                 : <InfoRow  icon={Phone}  label="Phone"       value={profile.phone || '—'}                color="text-green-600" />}
        <InfoRow icon={Building2}    label="Department"   value={profile.department || '—'}    color="text-violet-600" />
        <InfoRow icon={Briefcase}    label="Designation"  value={profile.designation || '—'}   color="text-indigo-600" />
        <InfoRow icon={CalendarDays} label="Date of Hire" value={profile.dateOfHire ? new Date(profile.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-rose-600" />
        {editing ? <EditField icon={User}      label="Next of Kin" value={nextOfKin} onChange={setNextOfKin} color="text-primary" />
                 : <InfoRow  icon={User}       label="Next of Kin" value={profile.nextOfKin || '—'}           color="text-primary" />}
        {editing ? <EditField icon={FileText}  label="Tax ID / PIN"     value={kraPin}    onChange={setKraPin}    color="text-orange-600" />
                 : <InfoRow  icon={FileText}   label="Tax ID / PIN"     value={profile.kraPin || '—'}              color="text-orange-600" />}
      </div>
      {editing && <p className="text-xs text-foreground/40 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">You can update your email, phone, Tax ID / PIN and next of kin. For salary or job group changes, contact HR.</p>}

      {/* Employment details */}
      <div className="border-t pt-5">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Employment Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Briefcase}    label="Employment Type"  value={profile.employmentType || '—'}                  color="text-amber-600" />
          <InfoRow icon={Building2}    label="Staff Category"   value={profile.staffCategory || '—'}                  color="text-teal-600" />
          <InfoRow icon={User}         label="Staff Number"     value={profile.staffNumber || '—'}                        color="text-slate-500" />
          <InfoRow icon={CalendarDays} label="Probation End"    value={profile.probationEndDate ? new Date(profile.probationEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-orange-600" />
        </div>
      </div>

      {/* Payment summary */}
      <div className="border-t pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Payment Details</p>
          {onEditPayment && (
            <button onClick={onEditPayment} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={CreditCard} label="Payment Method" value={paymentLabel}     color="text-primary" />
          <InfoRow icon={Landmark}   label="Account Details" value={paymentDetail}   color="text-emerald-600" />
        </div>
      </div>

      {/* Notes from HR */}
      <div className="border-t pt-5">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Notes from HR</p>
        {myNotes.length === 0 ? (
          <p className="text-sm text-foreground/30 italic">No notes on your record.</p>
        ) : (
          <div className="space-y-3">
            {myNotes.map(n => (
              <div key={n._id} className="flex gap-3 rounded-xl border bg-white/60 p-3">
                <span className={cn(
                  'shrink-0 self-start mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap',
                  NOTE_COLORS[n.category] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                )}>
                  {n.category.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{n.note}</p>
                  <p className="text-xs text-foreground/40 mt-1">
                    {n.createdByName ?? 'HR'} · {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mpesa',         label: 'M-Pesa' },
  { value: 'cash',          label: 'Cash' },
  { value: 'paypal',        label: 'PayPal' },
  { value: 'crypto',        label: 'Crypto' },
];

// ── Payment panel ──────────────────────────────────────────────────────────────
function PaymentPanel({ profile, onSave }: { profile: any; onSave: (d: Record<string, string>) => void }) {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [method, setMethod]     = useState(profile.paymentMethod || 'bank_transfer');
  const [bankName, setBankName] = useState(profile.bankName || '');
  const [bankAcct, setBankAcct] = useState(profile.bankAccountNumber || '');
  const [mpesa, setMpesa]       = useState(profile.mpesaNumber || '');
  const [paypal, setPaypal]     = useState(profile.paypalEmail || '');
  const [wallet, setWallet]     = useState(profile.cryptoWalletAddress || '');
  const [network, setNetwork]   = useState(profile.cryptoNetwork || '');

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ paymentMethod: method, bankName, bankAccountNumber: bankAcct, mpesaNumber: mpesa, paypalEmail: paypal, cryptoWalletAddress: wallet, cryptoNetwork: network });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const methodLabel = PAYMENT_METHODS.find(m => m.value === method)?.label ?? method;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Payment Details</p>
        {!editing
          ? <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Pencil className="h-3.5 w-3.5" /> Edit</button>
          : <div className="flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground"><X className="h-3.5 w-3.5" /> Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</button>
            </div>}
      </div>

      {/* Payment Method selector */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Payment Method</span>
        </div>
        <div className="p-4">
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                    method === m.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-foreground/60 hover:border-primary/40 hover:text-primary')}>
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <InfoRow icon={CreditCard} label="Method" value={methodLabel} color="text-primary" />
          )}
        </div>
      </div>

      {/* Bank Transfer fields */}
      {(method === 'bank_transfer') && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b"><Landmark className="h-4 w-4 text-primary" /><span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Bank Account</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {editing
              ? <><EditField icon={Landmark} label="Bank Name" value={bankName} onChange={setBankName} color="text-primary" /><EditField icon={CreditCard} label="Account Number" value={bankAcct} onChange={setBankAcct} color="text-primary" /></>
              : <><InfoRow icon={Landmark} label="Bank Name" value={profile.bankName || '—'} color="text-primary" /><InfoRow icon={CreditCard} label="Account Number" value={profile.bankAccountNumber || '—'} color="text-primary" /></>}
          </div>
        </div>
      )}

      {/* M-Pesa fields */}
      {(method === 'mpesa') && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b"><Smartphone className="h-4 w-4 text-emerald-600" /><span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">M-Pesa</span></div>
          <div className="p-4">
            {editing
              ? <EditField icon={Smartphone} label="M-Pesa Number" value={mpesa} onChange={setMpesa} color="text-emerald-600" />
              : <InfoRow icon={Smartphone} label="M-Pesa Number" value={profile.mpesaNumber || '—'} color="text-emerald-600" />}
          </div>
        </div>
      )}

      {/* Cash */}
      {(method === 'cash') && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b"><DollarSign className="h-4 w-4 text-amber-600" /><span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Cash</span></div>
          <div className="p-4 text-sm text-foreground/50">Salary is paid in cash. No additional details required.</div>
        </div>
      )}

      {/* PayPal */}
      {(method === 'paypal') && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b"><Mail className="h-4 w-4 text-blue-600" /><span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">PayPal</span></div>
          <div className="p-4">
            {editing
              ? <EditField icon={Mail} label="PayPal Email" value={paypal} onChange={setPaypal} color="text-blue-600" />
              : <InfoRow icon={Mail} label="PayPal Email" value={profile.paypalEmail || '—'} color="text-blue-600" />}
          </div>
        </div>
      )}

      {/* Crypto */}
      {(method === 'crypto') && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b"><Shield className="h-4 w-4 text-violet-600" /><span className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Crypto</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {editing
              ? <><EditField icon={Shield} label="Wallet Address" value={wallet} onChange={setWallet} color="text-violet-600" /><EditField icon={Shield} label="Network / Coin" value={network} onChange={setNetwork} color="text-violet-600" /></>
              : <><InfoRow icon={Shield} label="Wallet Address" value={profile.cryptoWalletAddress || '—'} color="text-violet-600" /><InfoRow icon={Shield} label="Network / Coin" value={profile.cryptoNetwork || '—'} color="text-violet-600" /></>}
          </div>
        </div>
      )}

      <p className="text-xs text-foreground/40 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Payment details are used by HR for payroll processing. Ensure the information is accurate.</p>
    </div>
  );
}

// ── Leave panel ────────────────────────────────────────────────────────────────
function LeavePanel({ leaveBalance, leaveRequests, onDispute }: { leaveBalance: any; leaveRequests: LeaveRequest[]; onDispute: (id: string, reason: string) => void }) {
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitDispute = async (id: string) => {
    if (!disputeReason.trim()) return;
    setSubmitting(true);
    try {
      await onDispute(id, disputeReason);
      setDisputingId(null);
      setDisputeReason('');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    disputed: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      {leaveBalance && <LeaveBalanceCard balance={leaveBalance} />}
      {leaveRequests.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Leave History</h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-primary/5 border-b">
                <tr>{['Type','From','To','Days','Status','Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/60">{h}</th>)}</tr>
              </thead>
              <tbody>
                {leaveRequests.map(r => (
                  <Fragment key={r._id}>
                    <tr className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 capitalize font-medium">{r.leaveType.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-foreground/60">{new Date(r.startDate).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3 text-foreground/60">{new Date(r.endDate).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">{r.numberOfDays}</td>
                      <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500')}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.status === 'rejected' && <button onClick={() => { setDisputingId(r._id); setDisputeReason(''); }} className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"><AlertTriangle className="h-3.5 w-3.5" /> Dispute</button>}
                          {r.status === 'disputed' && <span className="text-xs text-orange-500 font-medium">Under review</span>}
                          <button
                            onClick={() => downloadFile(`${API_BASE_URL}/me/leave/requests/${r._id}/pdf`, `leave-${r._id}.pdf`).catch(err => alert(err.message))}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            aria-label="Download leave letter"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                          <button
                            onClick={() => openFile(`${API_BASE_URL}/me/leave/requests/${r._id}/pdf`).catch(err => alert(err.message))}
                            className="flex items-center gap-1 text-xs font-medium text-foreground/50 hover:text-foreground hover:underline"
                            aria-label="Print leave letter"
                          >
                            <Printer className="h-3.5 w-3.5" /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                    {disputingId === r._id && (
                      <tr className="bg-orange-50 border-b">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Dispute this rejection</p>
                            <textarea rows={3} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Explain why you are disputing this decision…" className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                            <div className="flex items-center gap-2">
                              <button onClick={() => submitDispute(r._id)} disabled={!disputeReason.trim() || submitting} className="text-xs font-semibold bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Dispute'}</button>
                              <button onClick={() => setDisputingId(null)} className="text-xs text-foreground/40 hover:text-foreground">Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!leaveBalance && leaveRequests.length === 0 && <EmptyState icon={CalendarDays} text="No leave records yet." sub="Apply for leave using the button above." />}
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text, sub }: { icon: typeof User; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-foreground/30 gap-2">
      <Icon className="h-12 w-12 opacity-30" />
      <p className="text-sm font-medium text-foreground/40">{text}</p>
      {sub && <p className="text-xs text-foreground/30">{sub}</p>}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color = 'text-primary' }: { icon: typeof User; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 hover:bg-gray-50 transition-colors">
      <div className={cn('h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0', color)}><Icon className="h-4 w-4" /></div>
      <div><p className="text-xs text-foreground/50 font-medium uppercase tracking-wide">{label}</p><p className="text-sm font-semibold text-foreground mt-0.5 break-all">{value}</p></div>
    </div>
  );
}

function EditField({ icon: Icon, label, value, onChange, color = 'text-primary' }: { icon: typeof User; label: string; value: string; onChange: (v: string) => void; color?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className={cn('h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0', color)}><Icon className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide mb-1">{label}</p>
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full text-sm font-semibold bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
    </div>
  );
}

// ── Onboarding panel ───────────────────────────────────────────────────────────
const TASK_STATUS: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  pending:     { icon: Circle,       color: 'text-foreground/30', label: 'Pending' },
  in_progress: { icon: Clock,        color: 'text-amber-500',     label: 'In Progress' },
  completed:   { icon: CheckCircle2, color: 'text-emerald-500',   label: 'Done' },
};

function OnboardingTasksPanel({ tasks, onComplete }: { tasks: OnboardingTask[]; onComplete: (id: string) => void }) {
  const done = tasks.filter(t => t.status === 'completed');
  const pending = tasks.filter(t => t.status !== 'completed');
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && pending.length === 0;

  if (tasks.length === 0) return <EmptyState icon={ClipboardList} text="No onboarding tasks assigned." />;

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Successfully Onboarded!</h3>
          <p className="text-sm text-foreground/50 mt-1">All {tasks.length} onboarding tasks have been completed. Welcome aboard!</p>
        </div>
        <div className="w-full max-w-xs bg-gray-50 rounded-xl border p-4">
          <div className="flex justify-between text-xs mb-1"><span className="text-foreground/40">Onboarding Progress</span><span className="text-emerald-600 font-bold">100%</span></div>
          <div className="h-2 rounded-full bg-gray-200"><div className="h-full bg-emerald-500 rounded-full w-full" /></div>
        </div>
        <details className="w-full max-w-xs">
          <summary className="text-xs text-foreground/40 cursor-pointer hover:text-foreground/60">View completed tasks</summary>
          <div className="mt-3 space-y-2">{done.map(t => <TaskRow key={t._id} task={t} onComplete={onComplete} />)}</div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Onboarding Progress</span><span className="text-sm font-bold text-emerald-600">{pct}%</span></div>
        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="text-xs text-foreground/40 mt-2">{done.length} of {tasks.length} tasks completed</p>
      </div>
      {pending.length > 0 && <div><h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">To Do ({pending.length})</h4><div className="space-y-2">{pending.map(t => <TaskRow key={t._id} task={t} onComplete={onComplete} />)}</div></div>}
      {done.length > 0 && <div><h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Completed ({done.length})</h4><div className="space-y-2">{done.map(t => <TaskRow key={t._id} task={t} onComplete={onComplete} />)}</div></div>}
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: OnboardingTask; onComplete: (id: string) => void }) {
  const [marking, setMarking] = useState(false);
  const s = TASK_STATUS[task.status] ?? TASK_STATUS.pending;
  const Icon = s.icon;

  const handleDone = async () => {
    setMarking(true);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      await fetch(`${API_BASE_URL}/hr/onboarding/tasks/${task._id}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      onComplete(task._id);
    } finally { setMarking(false); }
  };

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors', task.status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white hover:bg-gray-50')}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', s.color)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-foreground/40')}>{task.taskTitle}</p>
        <p className="text-xs text-foreground/40 mt-0.5">{task.assignedDepartment} · Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
        {task.description && <p className="text-xs text-foreground/50 mt-1">{task.description}</p>}
      </div>
      {task.status !== 'completed' ? (
        <button onClick={handleDone} disabled={marking}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors shrink-0">
          {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {marking ? '…' : 'Mark Done'}
        </button>
      ) : (
        <span className={cn('text-xs font-medium shrink-0 mt-0.5', s.color)}>{s.label}</span>
      )}
    </div>
  );
}

// ── Offboarding panel ──────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  before_last_day: 'Before Last Day',
  last_day:        'Last Day',
  after_departure: 'After Departure',
};

function OffboardingPanel({ tasks, onComplete }: { tasks: OffboardingTask[]; onComplete: () => void }) {
  const [marking, setMarking] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <EmptyState icon={ClipboardList} text="No offboarding tasks assigned."
        sub="Tasks will appear here when HR starts your offboarding process." />
    );
  }

  const sections = ['before_last_day', 'last_day', 'after_departure'] as const;
  const done  = tasks.filter(t => t.status === 'completed').length;
  const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && done === tasks.length;

  const completeTask = async (taskId: string) => {
    setMarking(taskId);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE_URL}/me/offboarding/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) onComplete();
    } finally { setMarking(null); }
  };

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Successfully Offboarded</h3>
          <p className="text-sm text-foreground/50 mt-1">All {tasks.length} offboarding tasks have been completed. Wishing you all the best!</p>
        </div>
        <div className="w-full max-w-xs bg-gray-50 rounded-xl border p-4">
          <div className="flex justify-between text-xs mb-1"><span className="text-foreground/40">Exit Checklist</span><span className="text-emerald-600 font-bold">100%</span></div>
          <div className="h-2 rounded-full bg-gray-200"><div className="h-full bg-emerald-500 rounded-full w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="rounded-xl border p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Exit Checklist Progress</span>
          <span className={cn('text-sm font-bold', pct === 100 ? 'text-emerald-600' : 'text-orange-500')}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-orange-500')} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-foreground/40 mt-2">{done} of {tasks.length} tasks completed</p>
      </div>

      {/* Task sections */}
      {sections.map(section => {
        const sectionTasks = tasks.filter(t => t.taskSection === section);
        if (!sectionTasks.length) return null;
        return (
          <div key={section}>
            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">
              {SECTION_LABELS[section]}
            </h4>
            <div className="space-y-2">
              {sectionTasks.map(task => {
                const isDone    = task.status === 'completed';
                const isMarking = marking === task._id;
                const overdue   = !isDone && new Date(task.dueDate) < new Date();
                return (
                  <div key={task._id} className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                    isDone ? 'bg-emerald-50/50 border-emerald-100' : overdue ? 'bg-red-50/30 border-red-200' : 'bg-white hover:bg-gray-50'
                  )}>
                    {isDone
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      : <Circle className="h-5 w-5 text-foreground/20 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isDone && 'line-through text-foreground/40')}>{task.taskTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-foreground/40">{task.assignedDepartment}</span>
                        <span className={cn('text-xs', overdue && !isDone ? 'text-red-600 font-semibold' : 'text-foreground/40')}>
                          {overdue && !isDone && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                          Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                        </span>
                        {isDone && task.completedAt && (
                          <span className="text-xs text-emerald-600 font-medium">
                            · Done {new Date(task.completedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isDone && (
                      <button onClick={() => completeTask(task._id)} disabled={!!isMarking}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors shrink-0">
                        {isMarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isMarking ? '…' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Documents panel ────────────────────────────────────────────────────────────
const DOC_TYPES = ['National ID', 'Passport', 'Driving License', 'Degree Certificate', 'Diploma Certificate', 'Professional Certificate', 'Tax ID / PIN', 'NHIF Card', 'NSSF Card', 'Other'];

function DocumentsPanel({ docs, onDeleted, onUploaded, employeeId: _employeeId }: {
  docs: MyDocument[]; onDeleted: (id: string) => void; onUploaded: () => void; employeeId: string;
}) {
  const [docType, setDocType]   = useState(DOC_TYPES[0]);
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; fileName: string } | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE_URL}/me/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.ok) { setFile(null); onUploaded(); }
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <div className="rounded-xl border bg-gray-50 p-5 space-y-4">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Upload a Document</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground/60 block mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/60 block mb-1">File (PDF, JPG, PNG — max 10MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full h-9 text-sm border rounded-xl bg-white px-2 py-1.5 focus:outline-none file:mr-2 file:text-xs file:font-medium file:border-0 file:bg-primary/10 file:text-primary file:rounded-lg file:px-2 file:py-1" />
          </div>
        </div>
        <button onClick={handleUpload} disabled={!file || uploading}
          className={cn('flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors',
            file && !uploading ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {/* Document list */}
      {docs.length === 0
        ? <EmptyState icon={FolderOpen} text="No documents uploaded yet." sub="Upload your certificates, ID, and other documents above." />
        : <div className="space-y-2">
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{docs.length} Document{docs.length !== 1 ? 's' : ''}</p>
            {docs.map(d => (
              <div key={d.docId} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{d.docType}</p>
                  <p className="text-xs text-foreground/40 truncate">{d.fileName} · {new Date(d.uploadedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
                      setViewingDoc({ url: `${API_BASE_URL}/me/documents/${d.docId}/download?token=${token}`, fileName: d.fileName ?? 'document' });
                    }}
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-emerald-50 flex items-center justify-center text-foreground/40 hover:text-emerald-600 transition-colors"
                    aria-label={`View ${d.docType}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => downloadFile(`${API_BASE_URL}/me/documents/${d.docId}/download`, d.fileName ?? 'document').catch(err => alert(err.message))}
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-primary/10 flex items-center justify-center text-foreground/40 hover:text-primary transition-colors"
                    aria-label={`Download ${d.docType}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {confirmId === d.docId ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { onDeleted(d.docId); setConfirmId(null); }} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                      <span className="text-foreground/20">/</span>
                      <button onClick={() => setConfirmId(null)} className="text-xs text-foreground/40 hover:underline">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(d.docId)}
                      className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center text-foreground/30 hover:text-red-500 transition-colors"
                      aria-label={`Delete ${d.docType}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
      }

      {viewingDoc && (
        <DocViewerModal
          url={viewingDoc.url}
          fileName={viewingDoc.fileName}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}

// ── Performance panel (self-view) ──────────────────────────────────────────────
const RATING_LABEL = ['', 'Unsatisfactory', 'Needs Improvement', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'];
const RATING_COLOR = ['', 'text-red-600 bg-red-50 border-red-200', 'text-orange-600 bg-orange-50 border-orange-200',
  'text-blue-600 bg-blue-50 border-blue-200', 'text-emerald-600 bg-emerald-50 border-emerald-200', 'text-violet-600 bg-violet-50 border-violet-200'];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} className={cn('h-4 w-4', s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200')} />)}
    </div>
  );
}

// ── My Projects panel ──────────────────────────────────────────────────────────
const PROJECT_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700' },
  on_hold:   { label: 'On Hold',   cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
};

const ROLE_STYLE: Record<string, string> = {
  lead:     'bg-violet-100 text-violet-700',
  reviewer: 'bg-sky-100 text-sky-700',
  member:   'bg-gray-100 text-gray-600',
};

function MyProjectsPanel({ projects }: { projects: MyProject[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ hours: string; date: string; task: string; description: string; billable: boolean }>({
    hours: '', date: new Date().toISOString().slice(0, 10), task: '', description: '', billable: false,
  });
  const [saving, setSaving] = useState(false);
  const [localEntries, setLocalEntries] = useState<Record<string, MyProjectTimeEntry[]>>({});

  const entries = (id: string) => localEntries[id] ?? projects.find(p => p._id === id)?.myRecentEntries ?? [];

  if (projects.length === 0)
    return <EmptyState icon={Briefcase} text="No projects assigned." sub="You will appear here once HR adds you to a project." />;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';
  const fmtHours = (h: number) => h === 1 ? '1 hr' : `${h} hrs`;

  const submitTimeEntry = (projectId: string) => {
    if (!logForm.hours || Number(logForm.hours) <= 0) return;
    setSaving(true);
    apiCallFunction<{ data: { _id: string } }>({
      url: `${API_BASE_URL}/projects/${projectId}/time-entries`,
      method: 'POST',
      data: {
        hours: Number(logForm.hours),
        date: logForm.date,
        task: logForm.task || null,
        description: logForm.description || null,
        billable: logForm.billable,
      },
      returnResponse: true,
      thenFn: r => {
        const newEntry: MyProjectTimeEntry = {
          _id: r?.data?._id ?? Date.now().toString(),
          hours: Number(logForm.hours),
          date: logForm.date,
          task: logForm.task || null,
          description: logForm.description || null,
          billable: logForm.billable,
        };
        setLocalEntries(prev => ({ ...prev, [projectId]: [newEntry, ...(prev[projectId] ?? projects.find(p => p._id === projectId)?.myRecentEntries ?? [])] }));
        setLogForm(f => ({ ...f, hours: '', task: '', description: '' }));
      },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
      {projects.map(p => {
        const st = PROJECT_STATUS_STYLE[p.status] ?? PROJECT_STATUS_STYLE.active;
        const roleStyle = ROLE_STYLE[p.myRole] ?? ROLE_STYLE.member;
        const isOpen = expanded === p._id;
        const myEntries = entries(p._id);

        return (
          <div key={p._id} className="rounded-xl border bg-white overflow-hidden">
            {/* Project header */}
            <button
              onClick={() => setExpanded(isOpen ? null : p._id)}
              className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground">{p.name}</p>
                  <span className="text-[10px] font-bold text-foreground/30">{p.code}</span>
                </div>
                {p.clientName && <p className="text-xs text-foreground/50 mt-0.5">Client: {p.clientName}</p>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', roleStyle)}>{p.myRole}</span>
                  <span className="text-[11px] text-foreground/40 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {fmtHours(p.myHours)} logged
                  </span>
                </div>
              </div>
              <div className="text-xs text-foreground/30 shrink-0 text-right">
                {p.startDate && <div>{fmtDate(p.startDate)}</div>}
                {p.endDate   && <div>→ {fmtDate(p.endDate)}</div>}
                <ChevronRight className={cn('h-4 w-4 mt-1 ml-auto transition-transform', isOpen && 'rotate-90')} />
              </div>
            </button>

            {/* Expanded: time log form + recent entries */}
            {isOpen && (
              <div className="border-t bg-gray-50 p-5 space-y-5">
                {p.description && (
                  <p className="text-sm text-foreground/60 italic">{p.description}</p>
                )}

                {/* Log time form */}
                <div className="rounded-xl border bg-white p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide">Log Time</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-foreground/50 block mb-1">Hours *</label>
                      <input
                        type="number" min="0.25" step="0.25"
                        value={logForm.hours}
                        onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))}
                        placeholder="e.g. 2.5"
                        className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground/50 block mb-1">Date *</label>
                      <input
                        type="date"
                        value={logForm.date}
                        onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground/50 block mb-1">Task / Activity</label>
                    <input
                      value={logForm.task}
                      onChange={e => setLogForm(f => ({ ...f, task: e.target.value }))}
                      placeholder="e.g. Frontend design, Client meeting"
                      className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground/50 block mb-1">Description</label>
                    <textarea
                      value={logForm.description}
                      onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="What did you work on?"
                      className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/60">
                      <input
                        type="checkbox"
                        checked={logForm.billable}
                        onChange={e => setLogForm(f => ({ ...f, billable: e.target.checked }))}
                        className="h-4 w-4 rounded"
                      />
                      Billable
                    </label>
                    <button
                      onClick={() => submitTimeEntry(p._id)}
                      disabled={saving || !logForm.hours || Number(logForm.hours) <= 0}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Log Time
                    </button>
                  </div>
                </div>

                {/* Recent time entries */}
                {myEntries.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wide mb-2">My Recent Entries</p>
                    <div className="space-y-1.5">
                      {myEntries.map(e => (
                        <div key={e._id} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white border text-sm">
                          <div className="shrink-0 font-bold text-primary w-12 text-right">{fmtHours(e.hours)}</div>
                          <div className="flex-1 min-w-0">
                            {e.task && <p className="font-medium text-foreground/80 text-xs">{e.task}</p>}
                            {e.description && <p className="text-foreground/50 text-xs truncate">{e.description}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[11px] text-foreground/40">{fmtDate(e.date)}</p>
                            {e.billable && <span className="text-[10px] text-emerald-600 font-semibold">Billable</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const GOAL_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  not_started: { label: 'Not Started', cls: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  at_risk:     { label: 'At Risk',     cls: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
};

function AddGoalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Professional', period: 'annual', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.title.trim()) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/performance/goals`,
      method: 'POST',
      data: form,
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Set a New Goal</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Complete leadership training"
            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional details…"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
              {['Professional', 'Skills', 'Leadership', 'Teamwork', 'Personal'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Period</label>
            <select value={form.period} onChange={e => set('period', e.target.value)}
              className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
              <option value="q1">Q1</option><option value="q2">Q2</option>
              <option value="q3">Q3</option><option value="q4">Q4</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Set Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PerformancePanel({ appraisals, goals: initialGoals, reviewResults }: {
  appraisals: AppraisalRecord[];
  goals: MyGoal[];
  reviewResults: ReviewResult[];
}) {
  const [goals, setGoals] = useState<MyGoal[]>(initialGoals);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const refreshGoals = () => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/performance/goals`,
      showToast: false,
      thenFn: r => setGoals(r.data ?? []),
    });
  };

  const avg = appraisals.length > 0 ? appraisals.reduce((s, r) => s + r.rating, 0) / appraisals.length : null;
  const trend = appraisals.length >= 2 ? appraisals[0].rating - appraisals[1].rating : null;

  return (
    <>
    {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onSaved={refreshGoals} />}
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors">
          <Plus className="h-4 w-4" /> Set Goal
        </button>
      </div>

      {appraisals.length === 0 && goals.length === 0 && reviewResults.length === 0 && (
        <EmptyState icon={BarChart3} text="No performance data yet." sub="Set your first goal above or wait for HR to run appraisals." />
      )}

      {/* ── Summary bar (only when appraisals exist) ── */}
      {avg !== null && (
        <div className="rounded-xl border bg-gray-50 p-4 flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <StarRow rating={Math.round(avg)} />
              <span className="text-lg font-bold text-foreground">{avg.toFixed(1)}</span>
              {trend !== null && trend !== 0 && (
                trend > 0
                  ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary">{appraisals.length}</p>
            <p className="text-xs text-foreground/40">Appraisal{appraisals.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* ── Goals ── */}
      {goals.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">My Goals ({goals.length})</p>
          <div className="space-y-3">
            {goals.map(g => {
              const s = GOAL_STATUS_STYLE[g.status] ?? GOAL_STATUS_STYLE.not_started;
              return (
                <div key={g._id} className="rounded-xl border bg-white p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{g.title}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">{g.category} · {g.period.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0', s.cls)}>{s.label}</span>
                  </div>
                  {g.description && <p className="text-xs text-foreground/60">{g.description}</p>}
                  <div>
                    <div className="flex justify-between text-[11px] text-foreground/40 mb-1">
                      <span>Progress</span><span>{g.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', g.status === 'completed' ? 'bg-emerald-500' : g.status === 'at_risk' ? 'bg-amber-400' : 'bg-primary')}
                        style={{ width: `${Math.min(g.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Formal review results ── */}
      {reviewResults.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">Review Results ({reviewResults.length})</p>
          <div className="space-y-3">
            {reviewResults.map(r => (
              <div key={r._id} className="rounded-xl border bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {r.cycleName ?? 'Review Cycle'}
                    </p>
                    <p className="text-xs text-foreground/40 mt-0.5 capitalize">
                      {r.reviewType === 'self' ? 'Self Review' : 'Manager Review'} ·{' '}
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : ''}
                    </p>
                  </div>
                  {r.overallRating != null && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StarRow rating={r.overallRating} />
                      <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', RATING_COLOR[r.overallRating])}>
                        {RATING_LABEL[r.overallRating]}
                      </span>
                    </div>
                  )}
                </div>
                {r.recommendation && (
                  <p className="text-xs text-foreground/60 border-l-2 border-gray-200 pl-3 italic">{r.recommendation}</p>
                )}
                {r.responses?.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t">
                    {r.responses.map((resp, i) => (
                      <div key={i}>
                        {resp.question && <p className="text-[11px] font-semibold text-foreground/50">{resp.question}</p>}
                        {resp.answer && <p className="text-xs text-foreground/70">{resp.answer}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Legacy appraisal cards ── */}
      {appraisals.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">Appraisal History ({appraisals.length})</p>
          <div className="space-y-4">
            {appraisals.map(r => (
              <div key={r._id} className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground">{r.reviewPeriod}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarRow rating={r.rating} />
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', RATING_COLOR[r.rating])}>
                      {RATING_LABEL[r.rating]}
                    </span>
                  </div>
                </div>
                {r.comments && <p className="text-sm text-foreground/70 italic border-l-2 border-gray-200 pl-3">"{r.comments}"</p>}
                <div className="grid grid-cols-2 gap-4">
                  {r.goalsSet?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Goals Set</p>
                      <ul className="space-y-1">{r.goalsSet.map((g, i) => <li key={i} className="text-xs text-foreground/60 flex gap-1.5"><span className="text-primary/40 shrink-0">·</span>{g}</li>)}</ul>
                    </div>
                  )}
                  {r.goalsAchieved?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide mb-1.5">Goals Achieved</p>
                      <ul className="space-y-1">{r.goalsAchieved.map((g, i) => <li key={i} className="text-xs text-foreground/60 flex gap-1.5"><span className="text-emerald-500 shrink-0">✓</span>{g}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// ── Job Description panel ──────────────────────────────────────────────────────
function JobDescriptionPanel({ jd }: { jd?: string }) {
  if (!jd) return (
    <EmptyState icon={FileText} text="No job description on file."
      sub="Contact HR to have your job description added to your profile." />
  );
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Your Role & Responsibilities</p>
      <div className="rounded-xl border bg-white p-5">
        <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed text-sm">
          {jd}
        </div>
      </div>
    </div>
  );
}

// ── Terms & Conditions panel ───────────────────────────────────────────────────
const DEFAULT_TERMS = [
  { title: '1. Employment Agreement', body: "By accessing this portal, you acknowledge that you are employed under the terms outlined in your signed employment contract. All activities on this portal are subject to the organisation's HR policies." },
  { title: '2. Confidentiality', body: 'All information accessible through this portal — including payslips, appraisals, and colleague details — is strictly confidential. You must not share, copy, or disclose this information to unauthorised parties.' },
  { title: '3. Acceptable Use', body: 'This portal is provided solely for work-related purposes. Misuse, unauthorised access attempts, or sharing of login credentials is prohibited and may result in disciplinary action.' },
  { title: '4. Data Accuracy', body: 'You are responsible for ensuring that your personal details (phone, next of kin, bank details) are kept accurate and up to date. Notify HR immediately of any discrepancies.' },
  { title: '5. Leave Policy', body: 'Leave applications must be submitted with adequate notice as per your employment contract. Approved leave can only be revoked through a formal HR process. Unapproved absences may be treated as unpaid leave.' },
  { title: '6. Performance Appraisals', body: 'Appraisal records are accessible to you and authorised HR personnel only. Ratings are determined by your direct supervisor and HR based on agreed performance indicators.' },
  { title: '7. Document Uploads', body: 'Documents uploaded to this portal are stored securely and accessed only by authorised HR staff. You are responsible for ensuring uploaded documents are authentic and belong to you.' },
  { title: '8. Amendments', body: 'The organisation reserves the right to update these terms at any time. Continued use of the portal after changes constitutes acceptance of the updated terms.' },
];

// ── My Tasks panel ─────────────────────────────────────────────────────────────
const TASK_PRIORITY_STYLE: Record<string, string> = {
  low:    'bg-slate-700 text-slate-300',
  medium: 'bg-amber-900/40 text-amber-400',
  high:   'bg-red-900/40 text-red-400',
};

function MyTasksPanel({ tasks }: { tasks: EmployeeTask[] }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const updateStatus = (id: string, status: string) => {
    setUpdating(id);
    setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, status: status as EmployeeTask['status'] } : t));
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/${id}/status`,
      method: 'PATCH',
      data: { status },
      showToast: true,
      finallyFn: () => setUpdating(null),
    });
  };

  const now = new Date();
  const isOverdue = (t: EmployeeTask) =>
    t.status !== 'completed' && t.status !== 'blocked' && t.dueDate && new Date(t.dueDate) < now;

  const overdue   = localTasks.filter(t => t.status === 'overdue' || isOverdue(t));
  const inProg    = localTasks.filter(t => t.status === 'in_progress' && !isOverdue(t));
  const pending   = localTasks.filter(t => (t.status === 'not_started' || t.status === 'pending') && !isOverdue(t));
  const blocked   = localTasks.filter(t => t.status === 'blocked');
  const completed = localTasks.filter(t => t.status === 'completed');

  if (localTasks.length === 0)
    return <EmptyState icon={CheckCircle2} text="No tasks assigned." sub="Tasks assigned by HR will appear here." />;

  const TaskCard = ({ task }: { task: EmployeeTask }) => {
    const isTaskOverdue = task.status === 'overdue' || isOverdue(task);
    const isDone = task.status === 'completed';
    const isBlocked = task.status === 'blocked';
    const isStartable = task.status === 'not_started' || task.status === 'pending';
    return (
      <div className={cn(
        'rounded-xl border p-4 space-y-3 transition-colors',
        isDone     ? 'bg-emerald-900/20 border-emerald-700/30' :
        isTaskOverdue ? 'bg-red-900/20 border-red-700/40' :
        isBlocked  ? 'bg-slate-800/60 border-slate-700' :
        'bg-[#0f172a] border-slate-700/60 hover:border-slate-600'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            isDone ? 'bg-emerald-900/40' : isTaskOverdue ? 'bg-red-900/30' : isBlocked ? 'bg-slate-700' : 'bg-indigo-900/30')}>
            {isDone
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : task.status === 'in_progress'
                ? <Clock className="h-4 w-4 text-indigo-400" />
                : isTaskOverdue
                  ? <AlertTriangle className="h-4 w-4 text-red-400" />
                  : <Circle className="h-4 w-4 text-slate-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-sm', isDone ? 'line-through text-slate-500' : 'text-slate-200')}>{task.title}</p>
            {task.description && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{task.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize', TASK_PRIORITY_STYLE[task.priority] ?? TASK_PRIORITY_STYLE.medium)}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className={cn('text-xs flex items-center gap-0.5', isTaskOverdue && !isDone ? 'text-red-400 font-semibold' : 'text-slate-500')}>
                  {isTaskOverdue && !isDone && <AlertTriangle className="h-3 w-3" />}
                  Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </span>
              )}
              {task.module && <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded capitalize">{task.module}</span>}
            </div>
          </div>
        </div>
        {isBlocked && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
            Blocked — waiting on prerequisite tasks
          </div>
        )}
        {!isDone && !isBlocked && (
          <div className="flex gap-2 pt-1">
            {isStartable && (
              <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'in_progress')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-400 hover:bg-indigo-900/60 disabled:opacity-50 flex items-center gap-1 border border-indigo-700/40">
                <Clock className="h-3 w-3" /> Start
              </button>
            )}
            <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'completed')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 disabled:opacity-50 flex items-center gap-1 border border-emerald-700/30">
              <CheckCircle2 className="h-3 w-3" />
              {updating === task._id ? '…' : 'Mark Done'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Overdue ({overdue.length})</p>
          {overdue.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending ({pending.length})</p>
          {pending.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {inProg.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> In Progress ({inProg.length})</p>
          {inProg.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {blocked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Blocked ({blocked.length})</p>
          {blocked.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Completed ({completed.length})</p>
          {completed.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
    </div>
  );
}

// ── My Awards panel ────────────────────────────────────────────────────────────
const AWARD_COLORS = [
  'from-amber-400 to-orange-500',
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-cyan-500',
  'from-rose-400 to-pink-500',
];
const awardColor = (name: string) => AWARD_COLORS[name.charCodeAt(0) % AWARD_COLORS.length];

function MyAwardsPanel({ awards }: { awards: EmpAward[] }) {
  if (awards.length === 0)
    return <EmptyState icon={Trophy} text="No awards yet." sub="Awards and certifications granted by HR will appear here." />;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-amber-50 px-5 py-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Trophy className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-foreground">{awards.length} Award{awards.length !== 1 ? 's' : ''} Earned</p>
          <p className="text-xs text-foreground/50 mt-0.5">Congratulations on your recognition!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {awards.map(a => (
          <div key={a._id} className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow">
            <div className={cn('h-2 w-full bg-gradient-to-r', awardColor(a.awardTypeName))} />
            <div className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', awardColor(a.awardTypeName))}>
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground leading-tight">{a.awardTypeName}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {a.year} · Awarded {new Date(a.awardedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
              {a.notes && <p className="text-xs text-foreground/60 bg-gray-50 rounded-lg px-3 py-2 italic">"{a.notes}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── My Events panel ────────────────────────────────────────────────────────────
function MyEventsPanel({ events }: { events: ScheduledEvent[] }) {
  if (events.length === 0)
    return <EmptyState icon={CalendarDays} text="No upcoming events." sub="Scheduled training sessions and team building events will appear here." />;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const training     = events.filter(e => e.type === 'training');
  const teamBuilding = events.filter(e => e.type === 'team_building');

  const EventCard = ({ e }: { e: ScheduledEvent }) => {
    const isTraining = e.type === 'training';
    return (
      <div className={cn('rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow')}>
        <div className={cn('h-1.5 w-full', isTraining ? 'bg-blue-400' : 'bg-emerald-400')} />
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', isTraining ? 'bg-blue-50' : 'bg-emerald-50')}>
              {isTraining ? <BookOpen className="h-5 w-5 text-blue-500" /> : <Dumbbell className="h-5 w-5 text-emerald-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground leading-tight">{e.title}</p>
              <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1', isTraining ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>
                {isTraining ? 'Training' : 'Team Building'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/50">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{fmtDate(e.scheduledDate)}{e.endDate && e.endDate !== e.scheduledDate ? ` – ${fmtDate(e.endDate)}` : ''}</span>
          </div>
          {e.location && (
            <div className="flex items-center gap-1.5 text-xs text-foreground/50">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{e.location}</span>
            </div>
          )}
          {e.description && <p className="text-xs text-foreground/50 border-t pt-2 mt-1">{e.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {training.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-blue-400" /> Training Sessions ({training.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {training.map(e => <EventCard key={e._id} e={e} />)}
          </div>
        </div>
      )}
      {teamBuilding.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Dumbbell className="h-3.5 w-3.5 text-emerald-400" /> Team Building ({teamBuilding.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamBuilding.map(e => <EventCard key={e._id} e={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}

const PORTAL_TRAINING_TYPE_LABELS: Record<string, string> = {
  one_on_one: '1-on-1',
  time_based: 'Time-Based',
  one_time:   'One-Time',
  refresher:  'Refresher',
  self_paced: 'Self-Paced',
};

interface TrainingCourse {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  trainingType: string;
  objectives: string[];
  duration: number;
  enrolledCount: number;
  isMandatory: boolean;
  myEnrollment?: {
    _id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    completedObjectives: number[];
    objectives: string[];
    trainingType: string;
  } | null;
}

function TrainingPanel() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingObjective, setSavingObjective] = useState(false);
  const [localObjectives, setLocalObjectives] = useState<Record<string, { completed: number[]; progress: number }>>({});

  const fetchCourses = () => {
    setLoading(true);
    apiCallFunction<{ data: TrainingCourse[] }>({
      url: `${API_BASE_URL}/training/courses?status=published`,
      showToast: false,
      returnResponse: true,
      thenFn: r => {
        const list = r?.data ?? [];
        setCourses(list);
        const seed: Record<string, { completed: number[]; progress: number }> = {};
        for (const c of list) {
          if (c.myEnrollment?._id) {
            seed[c.myEnrollment._id] = {
              completed: c.myEnrollment.completedObjectives ?? [],
              progress: c.myEnrollment.progress ?? 0,
            };
          }
        }
        setLocalObjectives(seed);
      },
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => { fetchCourses(); }, []);

  const enroll = (courseId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/training/courses/${courseId}/enroll`,
      method: 'POST',
      thenFn: fetchCourses,
    });
  };

  const startCourse = (courseId: string) => {
    setStartingId(courseId);
    apiCallFunction({
      url: `${API_BASE_URL}/training/courses/${courseId}/start`,
      method: 'POST',
      thenFn: fetchCourses,
      finallyFn: () => setStartingId(null),
    });
  };

  const toggleObjective = (enrollmentId: string, idx: number) => {
    setSavingObjective(true);
    apiCallFunction<{ data: { completedObjectives: number[]; progress: number } }>({
      url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/objective`,
      method: 'PATCH',
      data: { index: idx },
      showToast: false,
      returnResponse: true,
      thenFn: r => {
        if (r?.data) {
          setLocalObjectives(prev => ({
            ...prev,
            [enrollmentId]: { completed: r.data.completedObjectives, progress: r.data.progress },
          }));
        }
      },
      finallyFn: () => setSavingObjective(false),
    });
  };

  const markComplete = (enrollmentId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/progress`,
      method: 'PUT',
      data: { progress: 100 },
      thenFn: fetchCourses,
    });
  };

  const levelStyle = (level: TrainingCourse['level']) =>
    level === 'advanced'
      ? 'bg-rose-100 text-rose-700'
      : level === 'intermediate'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700';

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>;
  }

  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} text="No training courses available." sub="Published courses created by HR will appear here." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map(course => {
        const enrollment = course.myEnrollment;
        const enrollmentId = enrollment?._id;
        const localState = enrollmentId ? localObjectives[enrollmentId] : null;
        const completedObjs = localState?.completed ?? enrollment?.completedObjectives ?? [];
        const progress = localState?.progress ?? enrollment?.progress ?? 0;
        const objectives = enrollment?.objectives?.length ? enrollment.objectives : (course.objectives ?? []);
        const isSelfPaced = (enrollment?.trainingType ?? course.trainingType) === 'self_paced';
        const isExpanded = expandedId === course._id;
        const canComplete = isSelfPaced
          ? (objectives.length === 0 || progress >= 100)
          : true;

        return (
          <div key={course._id} className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="p-4 space-y-3 flex flex-col flex-1">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground leading-tight">{course.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                      {course.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${levelStyle(course.level)}`}>
                      {course.level}
                    </span>
                    {course.trainingType && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {PORTAL_TRAINING_TYPE_LABELS[course.trainingType] ?? course.trainingType}
                      </span>
                    )}
                    {course.isMandatory && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">{course.description}</p>

              <div className="flex items-center justify-between text-[11px] text-foreground/50">
                <span>{course.duration ? `${course.duration} min` : 'Duration not set'}</span>
                <span>{course.enrolledCount ?? 0} enrolled</span>
              </div>

              {enrollment?.status === 'in_progress' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-foreground/60">
                    <span>Progress</span>
                    <span className="font-semibold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {isSelfPaced && enrollment?.status === 'in_progress' && objectives.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : course._id)}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Objectives ({completedObjs.length}/{objectives.length})
                    <span className="ml-1 text-foreground/30">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 border rounded-lg p-2 bg-gray-50">
                      {objectives.map((obj, i) => {
                        const isDone = completedObjs.includes(i);
                        return (
                          <button
                            key={i}
                            onClick={() => enrollmentId && !savingObjective && toggleObjective(enrollmentId, i)}
                            disabled={savingObjective}
                            className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
                          >
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'
                            }`}>
                              {isDone && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className={`text-xs ${isDone ? 'text-emerald-600 line-through' : 'text-foreground/80'}`}>{obj}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto pt-1">
                {!enrollment ? (
                  <button
                    onClick={() => enroll(course._id)}
                    className="w-full h-9 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Enroll
                  </button>
                ) : enrollment.status === 'not_started' ? (
                  <button
                    onClick={() => startCourse(course._id)}
                    disabled={startingId === course._id}
                    className="w-full h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {startingId === course._id ? 'Starting…' : 'Start Course'}
                  </button>
                ) : enrollment.status === 'in_progress' ? (
                  canComplete ? (
                    <button
                      onClick={() => enrollmentId && markComplete(enrollmentId)}
                      className="w-full h-9 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Mark as Complete
                    </button>
                  ) : (
                    <div className="w-full h-9 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold flex items-center justify-center cursor-not-allowed">
                      Complete all objectives first
                    </div>
                  )
                ) : (
                  <div className="w-full h-9 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ── Terms & Conditions panel ───────────────────────────────────────────────────
function TermsPanel() {
  const [blobUrl, setBlobUrl]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [hasPdf, setHasPdf]       = useState(false);
  const printRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    fetch(`${API_BASE_URL}/config/terms-pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('no pdf');
        return res.blob();
      })
      .then(blob => {
        setBlobUrl(URL.createObjectURL(blob));
        setHasPdf(true);
      })
      .catch(() => setHasPdf(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  const buildFallbackHtml = () => {
    const sections = DEFAULT_TERMS.map(
      ({ title, body }) => `<h3>${title}</h3><p>${body}</p>`
    ).join('');
    const now = new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    return `<html><head><title>Terms & Conditions</title><style>body{font-family:sans-serif;padding:2rem;font-size:13px;color:#333;max-width:800px;margin:0 auto}h3{font-size:14px;margin:16px 0 4px;font-weight:600}p{margin-bottom:12px;line-height:1.6;color:#555}</style></head><body><h2 style="margin-bottom:4px">Terms & Conditions</h2><p style="color:#999;font-size:11px;margin-bottom:24px">Last updated: ${now}</p>${sections}</body></html>`;
  };

  const handleView = () => {
    if (hasPdf && blobUrl) {
      window.open(blobUrl, '_blank');
    } else {
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(buildFallbackHtml());
      win.document.close();
    }
  };

  const handlePrint = () => {
    if (hasPdf && blobUrl) {
      const win = window.open(blobUrl, '_blank');
      win?.addEventListener('load', () => win.print());
    } else {
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(buildFallbackHtml());
      win.document.close();
      win.focus();
      win.addEventListener('load', () => win.print());
    }
  };

  const handleDownload = () => {
    if (hasPdf && blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Terms-and-Conditions.pdf';
      a.click();
    } else {
      const html = buildFallbackHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = 'Terms-and-Conditions.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Terms & Conditions</p>
        <div className="flex items-center gap-2">
          <button onClick={handleView}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <FileText className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-foreground/60 hover:bg-gray-200 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
        </div>
      ) : hasPdf && blobUrl ? (
        <div className="rounded-xl border overflow-hidden shadow-sm bg-gray-100">
          <iframe
            src={blobUrl}
            className="w-full"
            style={{ height: '70vh', minHeight: '480px' }}
            title="Terms and Conditions"
          />
        </div>
      ) : (
        <div ref={printRef} className="rounded-xl border bg-white p-6 space-y-5 text-sm text-foreground/70 leading-relaxed">
          {DEFAULT_TERMS.map(({ title, body }) => (
            <div key={title}>
              <p className="font-bold text-foreground mb-1">{title}</p>
              <p>{body}</p>
            </div>
          ))}
          <p className="text-xs text-foreground/30 border-t pt-4 mt-2">For queries, please contact your HR department.</p>
        </div>
      )}
    </div>
  );
}

// ── Expenses Panel ─────────────────────────────────────────────────────────────
const CLAIM_STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
  draft:     'bg-gray-100 text-gray-500',
};

const EXPENSE_CATEGORIES = ['Meals', 'Transport', 'Accommodation', 'Office Supplies', 'Communication', 'Training', 'Other'];

function ExpensesPanel() {
  const [claims, setClaims]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [type, setType]           = useState<'regular' | 'per_diem' | 'mileage'>('regular');
  const [category, setCategory]   = useState('');
  const [amount, setAmount]       = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [description, setDesc]    = useState('');
  const [destination, setDest]    = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [distanceKm, setDist]     = useState('');
  const [isRoundTrip, setRound]   = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fetchClaims = () => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/expense-claims`,
      showToast: false,
      thenFn: r => setClaims(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => { fetchClaims(); }, []);

  const resetForm = () => {
    setType('regular'); setCategory(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10));
    setDesc(''); setDest(''); setStartDate(''); setEndDate(''); setDist(''); setRound(false);
    setReceiptFile(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append('type', type);
    if (category) fd.append('category', category);
    fd.append('amount', String(Number(amount)));
    fd.append('date', date);
    if (description) fd.append('description', description);
    if (type === 'per_diem') { fd.append('destination', destination); fd.append('startDate', startDate); fd.append('endDate', endDate); }
    if (type === 'mileage') { fd.append('distanceKm', String(Number(distanceKm))); fd.append('isRoundTrip', String(isRoundTrip)); }
    fd.append('receipt', receiptFile!);
    apiCallFunction({
      url: `${API_BASE_URL}/expense-claims`,
      method: 'POST',
      data: fd,
      thenFn: () => { resetForm(); fetchClaims(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">My Expense Claims</h2>
          <p className="text-xs text-foreground/50 mt-0.5">Submit and track your reimbursement requests</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Claim
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/40 border rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Submit Expense Claim</p>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5">Expense Type</label>
            <div className="flex gap-2">
              {(['regular', 'per_diem', 'mileage'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn('flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all',
                    type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/40 hover:border-foreground/20')}>
                  {t === 'per_diem' ? 'Per Diem' : t === 'mileage' ? 'Mileage' : 'Regular'}
                </button>
              ))}
            </div>
          </div>

          {/* Regular fields */}
          {type === 'regular' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary">
                  <option value="">Select…</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Amount (KES)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {/* Per diem fields */}
          {type === 'per_diem' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Destination</label>
                <input value={destination} onChange={e => setDest(e.target.value)} placeholder="e.g. Mombasa" required
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-foreground/50 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-foreground/50 mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Mileage fields */}
          {type === 'mileage' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Distance (km)</label>
                <input type="number" value={distanceKm} onChange={e => setDist(e.target.value)} placeholder="0" required
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
                  <input type="checkbox" checked={isRoundTrip} onChange={e => setRound(e.target.checked)} className="rounded" />
                  Round trip
                </label>
              </div>
            </div>
          )}

          {/* Date + description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Description</label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="What was this for?"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Receipt */}
          <div>
            <label className="block text-xs text-foreground/50 mb-1">
              Receipt <span className="text-red-500">*</span>
              <span className="text-foreground/30 ml-1">PDF, JPG, PNG, WebP · max 5 MB</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              required
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm border border-border rounded-lg bg-background px-2 py-1.5 focus:outline-none file:mr-2 file:text-xs file:font-medium file:border-0 file:bg-primary/10 file:text-primary file:rounded-md file:px-2 file:py-1 file:cursor-pointer"
            />
            {receiptFile
              ? <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {receiptFile.name}</p>
              : <p className="text-xs text-foreground/30 mt-1">A receipt is required for all expense claims.</p>
            }
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-foreground/50 border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !receiptFile}
              className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
      ) : claims.length === 0 ? (
        <EmptyState icon={DollarSign} text="No expense claims yet." sub="Submit a claim to get reimbursed for work-related expenses." />
      ) : (
        <div className="space-y-2">
          {claims.map(c => (
            <div key={c._id} className="flex items-center justify-between bg-muted/30 border rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.description || `${c.type} expense`}</p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {c.category && <span className="capitalize mr-2">{c.category}</span>}
                  {new Date(c.date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-foreground">KES {(c.amount || 0).toLocaleString()}</span>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', CLAIM_STATUS_STYLE[c.status] ?? CLAIM_STATUS_STYLE.draft)}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Internal Jobs Panel ───────────────────────────────────────────────────────

interface InternalPosition {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  headcount: number;
  description?: string;
  salaryRange?: { min: number; max: number; currency: string };
}

interface MyApplication {
  _id: string;
  positionId: string;
  positionTitle: string;
  status: string;
  stageName: string | null;
  createdAt: string;
}

const APP_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  active:    { label: 'In Progress',    cls: 'bg-blue-50 text-blue-700'    },
  hired:     { label: 'Hired',          cls: 'bg-emerald-50 text-emerald-700 font-semibold' },
  rejected:  { label: 'Not Proceeding', cls: 'bg-red-50 text-red-600'      },
  withdrawn: { label: 'Withdrawn',      cls: 'bg-gray-100 text-gray-600'   },
};

function InternalJobsPanel() {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  const [positions, setPositions] = useState<InternalPosition[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'open' | 'mine'>('open');

  const load = async () => {
    setLoading(true);
    const [posRes, appRes] = await Promise.all([
      apiCallFunction(`${API_BASE_URL}/me/jobs`, 'GET', null, token),
      apiCallFunction(`${API_BASE_URL}/me/jobs/applications`, 'GET', null, token),
    ]);
    if (posRes.status) setPositions(posRes.data ?? []);
    if (appRes.status) setMyApps(appRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const appliedPositionIds = new Set(myApps.map(a => a.positionId));

  const handleApply = async (positionId: string) => {
    setApplying(positionId);
    const res = await apiCallFunction(`${API_BASE_URL}/me/jobs/${positionId}/apply`, 'POST', {}, token);
    if (res.status) {
      await load();
      setTab('mine');
    } else {
      alert(res.message || 'Failed to submit application.');
    }
    setApplying(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-foreground/40">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading positions…
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Internal Job Board</h2>
        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
          {(['open', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-3 py-1.5 font-medium transition-colors',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground/60 hover:bg-muted')}>
              {t === 'open' ? 'Open Positions' : `My Applications (${myApps.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'open' && (
        positions.length === 0
          ? <p className="text-sm text-foreground/40 text-center py-10">No open positions at this time.</p>
          : <div className="space-y-3">
              {positions.map(pos => {
                const isExpanded = expandedId === pos._id;
                const alreadyApplied = appliedPositionIds.has(pos._id);
                return (
                  <div key={pos._id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button onClick={() => setExpandedId(isExpanded ? null : pos._id)}
                      className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{pos.title}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">{pos.department}</span>
                          <span className="text-[11px] px-2 py-0.5 bg-muted text-foreground/60 rounded-full">{pos.location}</span>
                          {pos.headcount > 0 && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{pos.headcount} opening{pos.headcount > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 text-foreground/30 shrink-0 mt-0.5 transition-transform', isExpanded && 'rotate-90')} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {pos.description && <p className="text-sm text-foreground/70 leading-relaxed">{pos.description}</p>}
                        {pos.salaryRange?.min != null && (
                          <p className="text-xs text-foreground/50">
                            Salary: {pos.salaryRange.currency} {pos.salaryRange.min.toLocaleString()}{pos.salaryRange.max ? ` – ${pos.salaryRange.max.toLocaleString()}` : '+'}
                          </p>
                        )}
                        <div className="pt-1">
                          {alreadyApplied
                            ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <CheckCircle className="h-3.5 w-3.5" /> Applied
                              </span>
                            : <button onClick={() => handleApply(pos._id)} disabled={applying === pos._id}
                                className="inline-flex items-center gap-1.5 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity">
                                {applying === pos._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                Apply Now
                              </button>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      )}

      {tab === 'mine' && (
        myApps.length === 0
          ? <p className="text-sm text-foreground/40 text-center py-10">You haven't applied to any positions yet.</p>
          : <div className="space-y-2">
              {myApps.map(app => {
                const statusCfg = APP_STATUS_CFG[app.status] ?? { label: app.status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={app._id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{app.positionTitle}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {app.stageName ? `${app.stageName} · ` : ''}{new Date(app.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0', statusCfg.cls)}>{statusCfg.label}</span>
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}

