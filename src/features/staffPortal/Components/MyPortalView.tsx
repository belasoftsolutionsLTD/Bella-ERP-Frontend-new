'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  User, CalendarDays, DollarSign, Clock, ClipboardList, Loader2,
  Mail, Phone, Briefcase, Building2, MessageSquare, Plus,
  CheckCircle2, CheckCircle, Circle, ChevronRight, Pencil, X, Save,
  CreditCard, Landmark, Smartphone, AlertTriangle, Bell,
  CheckCheck, FileText, BarChart3, FolderOpen, Shield,
  Upload, Trash2, Download, Printer, Star, TrendingUp, TrendingDown,
  Trophy, BookOpen, Dumbbell, MapPin, BellOff, Menu, Eye, ShoppingCart,
  GraduationCap, Award, Sparkles, Heart,
} from 'lucide-react';
import { DocViewerModal } from '@/components/custom-ui/DocViewerModal';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { SkillPicker } from '@/components/custom-ui/SkillPicker';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { downloadFile, openFile } from '@/functions/downloadFile';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { useMyPortal, type MyDocument, type AppraisalRecord, type EmpAward, type ScheduledEvent, type EmployeeTask, type ReviewResult, type MyProject, type MyProjectTimeEntry } from '../Hooks/useMyPortal';
import { GoalsTab } from '@/features/performance/Components/GoalsTab';
import { MyShiftsTab } from './MyShiftsTab';
import CommunicationPage from '@/features/communication/Pages/CommunicationPage';
import InboxPage from '@/features/inbox/Pages/InboxPage';
import AwardsPage from '@/features/awards/Pages/AwardsPage';
import { MyPayslipsPanel } from '@/features/payroll/Components/MyPayslipsPanel';
import { AttendanceGrid } from '@/features/attendance/Components/AttendanceGrid';
import { ClockInWidget } from '@/features/attendance/Components/ClockInWidget';
import { TimesheetsTab } from '@/features/attendance/Components/TimesheetsTab';

type Section = 'profile' | 'payslips' | 'attendance' | 'timesheets' | 'shifts' | 'tasks' | 'payment' | 'messages' | 'inbox' | 'documents' | 'performance' | 'awards' | 'events' | 'jd' | 'terms' | 'expenses' | 'requests' | 'projects' | 'jobs' | 'skills';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',     'from-fuchsia-500 to-violet-600',
];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const EMPLOYEE_STATUS_MAP: Record<string, Status> = {
  active: 'active', on_leave: 'onLeave', suspended: 'suspended', terminated: 'terminated',
};

const NOTIF_COLORS: Record<string, string> = {
  payroll:      'bg-emerald-100 text-emerald-700',
  leave:        'bg-blue-100 text-blue-700',
  announcement: 'bg-violet-100 text-violet-700',
  onboarding:   'bg-amber-100 text-amber-700',
  offboarding:  'bg-orange-100 text-orange-700',
  task:         'bg-brand-primary/10 text-brand-primary',
  general:      'bg-gray-100 text-gray-600',
};

const NAV: { key: Section | 'my-training' | 'my-onboarding' | 'my-offboarding' | 'my-leave'; label: string; icon: typeof User; description: string; href?: string; group: string }[] = [
  // ── Overview ──
  { key: 'profile',      label: 'My Profile',          icon: User,          description: 'Personal & contact info', group: 'Overview' },
  { key: 'inbox',        label: 'Inbox',                icon: Bell,          description: 'Approvals & action items', group: 'Overview' },
  // ── Time & Attendance ──
  { key: 'attendance',   label: 'Attendance',           icon: Clock,         description: 'Daily records & clock-in', group: 'Time & Attendance' },
  { key: 'timesheets',   label: 'Timesheets',           icon: Clock,         description: 'Weekly timesheets & hours logged', group: 'Time & Attendance' },
  { key: 'shifts',       label: 'My Shifts',            icon: CalendarDays,  description: 'Upcoming shifts & open shift applications', group: 'Time & Attendance' },
  { key: 'my-leave',     label: 'Leave',                icon: CalendarDays,  description: 'Balance & requests', href: '/my/leave', group: 'Time & Attendance' },
  { key: 'events',       label: 'Events & Schedule',    icon: CalendarDays,  description: 'Upcoming training & team building', group: 'Time & Attendance' },
  // ── My Work ──
  { key: 'tasks',        label: 'My Tasks',             icon: CheckCircle2,  description: 'Tasks assigned by HR', group: 'My Work' },
  { key: 'projects',     label: 'My Projects',          icon: Briefcase,     description: 'Projects you are a member of', group: 'My Work' },
  // ── Finance ──
  { key: 'payslips',     label: 'Payslips',             icon: DollarSign,    description: 'Monthly payroll history', group: 'Finance' },
  { key: 'expenses',     label: 'My Expenses',          icon: DollarSign,    description: 'Submit & track claims', group: 'Finance' },
  { key: 'requests',     label: 'My Requests',          icon: ShoppingCart,  description: 'Purchase requests & approvals', group: 'Finance' },
  { key: 'payment',      label: 'Payment Methods',      icon: CreditCard,    description: 'Bank & M-Pesa details', group: 'Finance' },
  // ── Growth ──
  { key: 'my-training',  label: 'My Training',          icon: BookOpen,      description: 'Courses, certificates & learning paths', href: '/my/training', group: 'Growth' },
  { key: 'performance',  label: 'My Performance',       icon: BarChart3,     description: 'Goals, reviews & appraisal history', group: 'Growth' },
  { key: 'skills',       label: 'Skills & Qualifications', icon: GraduationCap, description: 'Skills, certifications & education', group: 'Growth' },
  { key: 'awards',       label: 'Awards & Recognition', icon: Trophy,        description: 'Kudos, leaderboard & certifications', group: 'Growth' },
  { key: 'jobs',         label: 'Internal Jobs',        icon: Briefcase,     description: 'Open vacancies & apply internally', group: 'Growth' },
  // ── Communication ──
  { key: 'messages',     label: 'Communication',        icon: MessageSquare, description: 'Feed, 1:1 meetings & announcements', group: 'Communication' },
  // ── My Documents ──
  { key: 'documents',    label: 'My Documents',         icon: FolderOpen,    description: 'Certificates & files', group: 'My Documents' },
  { key: 'jd',           label: 'Job Description',      icon: FileText,      description: 'Your role & responsibilities', group: 'My Documents' },
  { key: 'terms',        label: 'Terms & Conditions',   icon: Shield,        description: 'Policies & agreements', group: 'My Documents' },
  // ── Employment Lifecycle ──
  { key: 'my-onboarding',  label: 'Onboarding',         icon: ClipboardList, description: 'Tasks & checklist', href: '/my/onboarding', group: 'Employment Lifecycle' },
  { key: 'my-offboarding', label: 'Offboarding',        icon: ClipboardList, description: 'Exit checklist', href: '/my/offboarding', group: 'Employment Lifecycle' },
];

// Section headers rendered above each group, in this order — derived once from NAV
// rather than hand-maintained separately, so adding an item to a group's block above
// is enough; no second place to keep in sync.
const NAV_GROUPS: { label: string; items: typeof NAV }[] = (() => {
  const order: string[] = [];
  const byGroup = new Map<string, typeof NAV>();
  for (const item of NAV) {
    if (!byGroup.has(item.group)) { byGroup.set(item.group, []); order.push(item.group); }
    byGroup.get(item.group)!.push(item);
  }
  return order.map((label) => ({ label, items: byGroup.get(label)! }));
})();

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
  const router = useRouter();
  const locale = useLocale();
  const {
    profile, payslips, attendance,
    notifications, announcements, documents, appraisals, reviewResults, events, myTasks, myProjects, loading,
    updateProfile,
    markNotifRead, markAllNotifsRead,
    refreshDocuments, deleteDocument,
  } = useMyPortal();

  const [active, setActive]           = useState<Section>('profile');
  const [showSidebar, setShowSidebar] = useState(false);
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
      <User className="h-12 w-12 text-brand-text-muted opacity-50" />
      <p className="text-sm font-medium text-brand-text-secondary">No employee record linked to your account.</p>
      <p className="text-xs text-brand-text-muted">Contact HR to link your account to an employee record.</p>
    </div>
  );

  const unreadAnnouncements = announcements.filter(a => !a.isRead).length;
  const unreadNotifs = notifications.length;
  const totalUnread  = unreadNotifs + unreadAnnouncements;

  const pendingTasks        = myTasks.filter(t => t.status !== 'completed').length;

  const navBadge = (key: Section | 'my-training' | 'my-onboarding' | 'my-offboarding' | 'my-leave') => {
    if (key === 'messages')      return unreadAnnouncements || null;
    if (key === 'tasks')         return pendingTasks || null;
    return null;
  };

  return (
    <>
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
          <div className="bg-brand-primary p-5 text-white">
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
              <StatusBadge status={EMPLOYEE_STATUS_MAP[profile.status] ?? 'inactive'} className="rounded-md" />
            </div>
            <p className="text-white/50 text-xs mt-2">{profile.department}</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {NAV_GROUPS.map(({ label: groupLabel, items }) => (
              <div key={groupLabel}>
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted select-none first:pt-1.5">
                  {groupLabel}
                </p>
                {items.map(({ key, label, icon: Icon, description, href }) => {
                  const isActive = active === key;
                  const badge = navBadge(key);
                  return (
                    <button key={key} onClick={() => { href ? router.push(`/${locale}${href}`) : setActive(key as Section); setShowSidebar(false); }}
                      className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5',
                        isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-text')}>
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isActive ? 'bg-white/20' : 'bg-brand-bg-muted')}>
                        <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-brand-text-secondary')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-brand-text')}>{label}</p>
                        <p className={cn('text-xs truncate', isActive ? 'text-white/60' : 'text-brand-text-muted')}>{description}</p>
                      </div>
                      {badge
                        ? <span className={cn('h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center shrink-0', isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white')}>{badge}</span>
                        : <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white/60' : 'text-brand-text-muted')} />}
                    </button>
                  );
                })}
              </div>
            ))}
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
                                '/tasks': 'tasks', '/payslips': 'payslips',
                                '/attendance': 'attendance', '/payroll': 'payslips',
                                '/projects': 'projects',
                                '/expenses': 'expenses', '/performance': 'performance',
                              };
                              const PUSH_LINK_MAP: Record<string, string> = {
                                '/training': '/my/training', '/onboarding': '/my/onboarding', '/offboarding': '/my/offboarding',
                                '/leave': '/my/leave',
                              };
                              const pushHref = n.link ? Object.entries(PUSH_LINK_MAP).find(([k]) => n.link!.includes(k))?.[1] : undefined;
                              const dest = !pushHref && n.link ? Object.entries(LINK_MAP).find(([k]) => n.link!.includes(k))?.[1] : undefined;
                              const clickable = !!pushHref || !!dest;
                              return (
                                <div key={n._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                  <button
                                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                                    onClick={() => {
                                      markNotifRead(n._id);
                                      if (pushHref) { router.push(`/${locale}${pushHref}`); setShowNotifPanel(false); }
                                      else if (dest) { setActive(dest); setShowNotifPanel(false); }
                                    }}
                                  >
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 capitalize', NOTIF_COLORS[n.type] ?? NOTIF_COLORS.general)}>
                                      {n.type}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn('text-sm font-semibold text-foreground leading-tight', clickable && 'hover:text-primary')}>{n.title}</p>
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
            {active === 'profile'    && <ProfilePanel profile={profile} onSave={updateProfile} onEditPayment={() => setActive('payment')} onNavigate={setActive}
              onContactHR={(topic) => apiCallFunction({ url: `${API_BASE_URL}/me/contact-hr`, method: 'POST', data: { topic } })} />}
            {active === 'payment'    && <PaymentPanel profile={profile} onSave={updateProfile} />}
            {active === 'payslips'   && (
              payslips.length > 0
                ? <MyPayslipsPanel payslips={payslips} />
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
            {active === 'tasks'       && <MyTasksPanel tasks={myTasks} />}
            {active === 'projects'    && <MyProjectsPanel projects={myProjects} />}
            {active === 'documents'   && <DocumentsPanel docs={documents} onDeleted={deleteDocument} onUploaded={refreshDocuments} employeeId={profile._id} />}
            {active === 'performance' && <PerformancePanel appraisals={appraisals} reviewResults={reviewResults} />}
            {active === 'awards'      && <div className="-m-6"><AwardsPage embedded /></div>}
            {active === 'events'      && <MyEventsPanel events={events} />}
            {active === 'jobs'        && <InternalJobsPanel />}
            {active === 'jd'          && <JobDescriptionPanel jd={(profile as any).jobDescription} />}
            {active === 'skills'      && <SkillsPanel initialSkills={(profile as any).skills} initialCertifications={(profile as any).certifications} initialEducation={(profile as any).educationHistory} />}
            {active === 'expenses'    && <ExpensesPanel />}
            {active === 'requests'    && <RequestsPanel />}
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
  general_note:        'bg-slate-100 text-brand-text-muted border-slate-200',
};

function ProfilePanel({ profile, onSave, onEditPayment, onContactHR, onNavigate }: {
  profile: any;
  onSave: (d: Record<string, unknown>) => void;
  onEditPayment?: () => void;
  onContactHR?: (topic: string) => void;
  onNavigate?: (section: Section) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [email, setEmail]         = useState(profile.email || '');
  const [phone, setPhone]         = useState(profile.phone || '');
  const nokRecord = profile.nextOfKin && typeof profile.nextOfKin === 'object' ? profile.nextOfKin : {};
  const [nokName, setNokName]                 = useState(nokRecord.name || '');
  const [nokRelationship, setNokRelationship] = useState(nokRecord.relationship || '');
  const [nokPhone, setNokPhone]               = useState(nokRecord.phone || '');
  const nokDisplay = nokRecord.name
    ? [nokRecord.name, nokRecord.relationship, nokRecord.phone].filter(Boolean).join(' · ')
    : '—';
  const [kraPin, setKraPin]       = useState(profile.kraPin || '');
  const [preferredName, setPreferredName] = useState(profile.preferredName || '');
  const [gender, setGender]               = useState(profile.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(profile.maritalStatus || '');
  const [nationality, setNationality]     = useState(profile.nationality || '');
  const [passportNumber, setPassportNumber]         = useState(profile.passportNumber || '');
  const [passportExpiryDate, setPassportExpiryDate] = useState(profile.passportExpiryDate ? String(profile.passportExpiryDate).slice(0, 10) : '');
  const [addressStreet, setAddressStreet]         = useState(profile.address?.street || '');
  const [addressCity, setAddressCity]             = useState(profile.address?.city || '');
  const [addressState, setAddressState]           = useState(profile.address?.state || '');
  const [addressCountry, setAddressCountry]       = useState(profile.address?.country || '');
  const [addressPostalCode, setAddressPostalCode] = useState(profile.address?.postalCode || '');
  const [saving, setSaving]       = useState(false);
  const [contactedTopics, setContactedTopics] = useState<Set<string>>(new Set());
  const [myNotes, setMyNotes]     = useState<any[]>([]);

  const emergencyContacts: { id: string; name: string; relationship?: string | null; phone: string; email?: string | null }[] = profile.emergencyContacts ?? [];
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '', email: '' });
  const [savingContact, setSavingContact] = useState(false);

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
  if (!profile.kraPin)                                      gaps.push({ label: 'KRA PIN',          critical: false, action: 'edit' });
  if (!profile.bankAccountNumber && !profile.mpesaNumber)   gaps.push({ label: 'Payment Details',  critical: false, action: 'payment' });

  // Profile completeness — everything the employee can actually fill in themselves
  // (deliberately excludes Gross Pay / Job Group above, which only HR can set, and
  // passport, which is genuinely optional for anyone who doesn't have one).
  const hasPaymentDetails = !!(profile.bankAccountNumber || profile.mpesaNumber || profile.paypalEmail || profile.cryptoWalletAddress);
  const completenessChecklist: { label: string; done: boolean; section: Section }[] = [
    { label: 'Preferred name',           done: !!profile.preferredName,                       section: 'profile' },
    { label: 'Phone number',              done: !!profile.phone,                               section: 'profile' },
    { label: 'Gender',                    done: !!profile.gender,                              section: 'profile' },
    { label: 'Marital status',            done: !!profile.maritalStatus,                       section: 'profile' },
    { label: 'Nationality',               done: !!profile.nationality,                         section: 'profile' },
    { label: 'Address',                   done: !!(profile.address?.street && profile.address?.city), section: 'profile' },
    { label: 'Emergency contact',         done: (profile.emergencyContacts ?? []).length > 0,  section: 'profile' },
    { label: 'KRA PIN',                   done: !!profile.kraPin,                              section: 'profile' },
    { label: 'Payment details',           done: hasPaymentDetails,                             section: 'payment' },
    { label: 'Skills & qualifications',   done: (profile.skills ?? []).length > 0 || (profile.certifications ?? []).length > 0 || (profile.educationHistory ?? []).length > 0, section: 'skills' },
  ];
  const completedCount = completenessChecklist.filter(c => c.done).length;
  const completenessPct = Math.round((completedCount / completenessChecklist.length) * 100);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        email, phone, kraPin,
        nextOfKin: (nokName || nokRelationship || nokPhone)
          ? { ...nokRecord, name: nokName, relationship: nokRelationship || null, phone: nokPhone }
          : null,
        preferredName, gender: gender || undefined, maritalStatus: maritalStatus || undefined, nationality,
        passportNumber, passportExpiryDate: passportExpiryDate || undefined,
        address: (addressStreet || addressCity || addressState || addressCountry || addressPostalCode)
          ? { street: addressStreet, city: addressCity, state: addressState, country: addressCountry, postalCode: addressPostalCode }
          : null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const saveEmergencyContacts = async (next: typeof emergencyContacts) => {
    setSavingContact(true);
    try {
      await onSave({ emergencyContacts: next });
    } finally {
      setSavingContact(false);
    }
  };
  const addEmergencyContact = () => {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    saveEmergencyContacts([...emergencyContacts, { id: '', name: contactForm.name, relationship: contactForm.relationship || null, phone: contactForm.phone, email: contactForm.email || null }]);
    setContactForm({ name: '', relationship: '', phone: '', email: '' });
    setShowContactForm(false);
  };
  const removeEmergencyContact = (id: string) => saveEmergencyContacts(emergencyContacts.filter(c => c.id !== id));

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
      {/* Profile completeness meter */}
      {completenessPct < 100 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Your profile is {completenessPct}% complete</p>
            <span className="text-xs text-brand-text-muted">{completedCount}/{completenessChecklist.length}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2.5">
            <div
              className={cn('h-full rounded-full transition-all duration-500', completenessPct >= 80 ? 'bg-emerald-500' : completenessPct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
              style={{ width: `${completenessPct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {completenessChecklist.filter(c => !c.done).map(c => (
              <button
                key={c.label}
                onClick={() => c.section === 'profile' ? setEditing(true) : onNavigate?.(c.section)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200 text-brand-text-muted hover:border-indigo-300 hover:text-brand-primary-hover transition-colors"
              >
                + {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
              <div key={g.label} className={cn(
                'inline-flex items-center gap-2 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full',
                g.critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
              )}>
                <span>{g.label}</span>
                {g.action === 'payment' && onEditPayment && (
                  <button onClick={onEditPayment} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 hover:bg-white transition-colors">Fix →</button>
                )}
                {g.action === 'edit' && (
                  <button onClick={() => setEditing(true)} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 hover:bg-white transition-colors">Fix →</button>
                )}
                {!g.action && (
                  contactedTopics.has(g.label)
                    ? <span className="text-[11px] opacity-70 px-2 py-0.5">HR notified ✓</span>
                    : onContactHR
                      ? <button onClick={() => { onContactHR(g.label); setContactedTopics(prev => new Set(prev).add(g.label)); }}
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 hover:bg-white transition-colors">Contact HR →</button>
                      : <span className="text-[11px] opacity-70 px-2 py-0.5">Contact HR</span>
                )}
              </div>
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
        <InfoRow icon={Briefcase}    label="Designation"  value={profile.designation || '—'}   color="text-brand-primary" />
        <InfoRow icon={CalendarDays} label="Date of Hire" value={profile.dateOfHire ? new Date(profile.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-rose-600" />
        {editing ? <EditField icon={User} label="Next of Kin Name"         value={nokName}         onChange={setNokName}         color="text-brand-primary" />
                 : <InfoRow  icon={User} label="Next of Kin"              value={nokDisplay}                                     color="text-brand-primary" />}
        {editing && <EditField icon={User} label="Next of Kin Relationship" value={nokRelationship} onChange={setNokRelationship} color="text-brand-primary" />}
        {editing && <EditField icon={Phone} label="Next of Kin Phone"       value={nokPhone}         onChange={setNokPhone}        color="text-brand-primary" />}
        {editing ? <EditField icon={FileText}  label="KRA PIN"     value={kraPin}    onChange={setKraPin}    color="text-orange-600" />
                 : <InfoRow  icon={FileText}   label="KRA PIN"     value={profile.kraPin || '—'}              color="text-orange-600" />}
        {editing ? <EditField icon={User} label="Preferred Name" value={preferredName} onChange={setPreferredName} color="text-primary" />
                 : profile.preferredName ? <InfoRow icon={User} label="Preferred Name" value={profile.preferredName} color="text-primary" /> : null}
        {editing
          ? <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0 text-primary"><User className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide mb-1">Gender</p>
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full text-sm font-semibold bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="preferNotToSay">Prefer not to say</option>
                </select>
              </div>
            </div>
          : profile.gender ? <InfoRow icon={User} label="Gender" value={({ male: 'Male', female: 'Female', preferNotToSay: 'Prefer not to say' } as Record<string, string>)[profile.gender] ?? profile.gender} color="text-primary" /> : null}
        {editing
          ? <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0 text-primary"><Heart className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide mb-1">Marital Status</p>
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="w-full text-sm font-semibold bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                  <option value="">Not specified</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
          : profile.maritalStatus ? <InfoRow icon={Heart} label="Marital Status" value={({ single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed' } as Record<string, string>)[profile.maritalStatus] ?? profile.maritalStatus} color="text-primary" /> : null}
        {editing ? <EditField icon={User} label="Nationality" value={nationality} onChange={setNationality} color="text-primary" />
                 : profile.nationality ? <InfoRow icon={User} label="Nationality" value={profile.nationality} color="text-primary" /> : null}
        {editing ? <EditField icon={FileText} label="Passport Number" value={passportNumber} onChange={setPassportNumber} color="text-orange-600" />
                 : profile.passportNumber ? <InfoRow icon={FileText} label="Passport Number" value={profile.passportNumber} color="text-orange-600" /> : null}
        {editing && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0 text-orange-600"><CalendarDays className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide mb-1">Passport Expiry</p>
              <input type="date" value={passportExpiryDate} onChange={e => setPassportExpiryDate(e.target.value)} className="w-full text-sm font-semibold bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
          </div>
        )}
        {!editing && profile.passportExpiryDate && <InfoRow icon={CalendarDays} label="Passport Expiry" value={new Date(profile.passportExpiryDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })} color="text-orange-600" />}
      </div>
      {editing && <p className="text-xs text-foreground/40 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">You can update your personal details, KRA PIN and next of kin. For salary or job group changes, contact HR.</p>}

      {/* Address */}
      <div className="border-t pt-5">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Address</p>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditField icon={MapPin} label="Street" value={addressStreet} onChange={setAddressStreet} color="text-teal-600" />
            <EditField icon={MapPin} label="City" value={addressCity} onChange={setAddressCity} color="text-teal-600" />
            <EditField icon={MapPin} label="State / County" value={addressState} onChange={setAddressState} color="text-teal-600" />
            <EditField icon={MapPin} label="Country" value={addressCountry} onChange={setAddressCountry} color="text-teal-600" />
            <EditField icon={MapPin} label="Postal Code" value={addressPostalCode} onChange={setAddressPostalCode} color="text-teal-600" />
          </div>
        ) : profile.address && (profile.address.street || profile.address.city || profile.address.state || profile.address.country || profile.address.postalCode) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={MapPin} label="Street" value={profile.address.street || '—'} color="text-teal-600" />
            <InfoRow icon={MapPin} label="City" value={profile.address.city || '—'} color="text-teal-600" />
            <InfoRow icon={MapPin} label="State / County" value={profile.address.state || '—'} color="text-teal-600" />
            <InfoRow icon={MapPin} label="Country" value={profile.address.country || '—'} color="text-teal-600" />
            <InfoRow icon={MapPin} label="Postal Code" value={profile.address.postalCode || '—'} color="text-teal-600" />
          </div>
        ) : (
          <p className="text-sm text-foreground/30 italic">No address on file.</p>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="border-t pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Emergency Contacts</p>
          <button onClick={() => setShowContactForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-primary text-white font-semibold rounded-lg hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {showContactForm && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" className="h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <input value={contactForm.relationship} onChange={e => setContactForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Relationship" className="h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone *" className="h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex gap-2">
              <button onClick={addEmergencyContact} disabled={savingContact} className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                {savingContact && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
              </button>
              <button onClick={() => setShowContactForm(false)} className="text-xs text-foreground/40 hover:text-foreground px-2">Cancel</button>
            </div>
          </div>
        )}
        {emergencyContacts.length === 0 ? (
          <p className="text-sm text-foreground/30 italic">No emergency contacts on file.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyContacts.map(c => (
              <div key={c.id} className="relative rounded-xl border p-4">
                <button onClick={() => removeEmergencyContact(c.id)} disabled={savingContact} className="absolute top-2 right-2 h-6 w-6 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-sm font-semibold pr-6">{c.name}</p>
                <p className="text-xs text-foreground/50">{c.relationship || '—'}</p>
                <p className="text-xs text-foreground/50">{c.phone}</p>
                {c.email && <p className="text-xs text-foreground/50">{c.email}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employment details */}
      <div className="border-t pt-5">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Employment Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Briefcase}    label="Employment Type"  value={profile.employmentType || '—'}                  color="text-amber-600" />
          <InfoRow icon={User}         label="Staff Number"     value={profile.staffNumber || '—'}                        color="text-brand-text-muted" />
          <InfoRow icon={CalendarDays} label="Probation End"    value={profile.probationEndDate ? new Date(profile.probationEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-orange-600" />
          {profile.location && <InfoRow icon={MapPin} label="Location" value={profile.location} color="text-teal-600" />}
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
                  NOTE_COLORS[n.category] ?? 'bg-slate-100 text-brand-text-muted border-slate-200',
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
                    method === m.value ? 'bg-primary text-white border-primary' : 'border-brand-border text-foreground/60 hover:border-primary/40 hover:text-primary')}>
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
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full text-sm font-semibold bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
      </div>
    </div>
  );
}


// ── Documents panel ────────────────────────────────────────────────────────────
const DOC_TYPES = ['Degree Certificate', 'Diploma Certificate', 'Professional Certificate', 'KRA PIN Certificate', 'NHIF Card', 'NSSF Card', 'Other'];

// Identity documents are mutually exclusive — an employee has exactly one type on
// file (National ID, Driving License, or Passport), each requiring specific pages/sides.
const IDENTITY_DOC_CONFIG: { label: string; parts: string[] }[] = [
  { label: 'National ID', parts: ['Front', 'Back'] },
  { label: 'Driving License', parts: ['Front', 'Back'] },
  { label: 'Passport', parts: ['Bio Data Page'] },
];

async function uploadIdentityFile(docType: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('docType', docType);
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  await fetch(`${API_BASE_URL}/me/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

function IdentityDocumentSection({ docs, onUploaded, onDeleted }: {
  docs: MyDocument[]; onUploaded: () => void; onDeleted: (id: string) => void;
}) {
  const existing = IDENTITY_DOC_CONFIG.find(cfg => docs.some(d => d.docType.startsWith(`${cfg.label} (`)));
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);

  const chosenConfig = IDENTITY_DOC_CONFIG.find(c => c.label === chosenLabel) ?? null;
  const allPartsSelected = chosenConfig ? chosenConfig.parts.every(p => !!files[p]) : false;

  const handleSubmit = async () => {
    if (!chosenConfig || !allPartsSelected) return;
    setUploading(true);
    try {
      for (const part of chosenConfig.parts) {
        const file = files[part];
        if (file) await uploadIdentityFile(`${chosenConfig.label} (${part})`, file);
      }
      setFiles({});
      setChosenLabel(null);
      onUploaded();
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = () => {
    if (!existing) return;
    docs.filter(d => d.docType.startsWith(`${existing.label} (`)).forEach(d => onDeleted(d.docId));
  };

  return (
    <div className="rounded-xl border bg-gray-50 p-5 space-y-4">
      <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5" /> Identity Document
      </p>

      {existing ? (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{existing.label}</p>
            <p className="text-xs text-foreground/40">On file — {existing.parts.length} file{existing.parts.length !== 1 ? 's' : ''} uploaded</p>
          </div>
          <button onClick={handleReplace} className="text-xs font-semibold text-primary hover:underline">Replace</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {IDENTITY_DOC_CONFIG.map(cfg => (
              <button key={cfg.label} type="button" onClick={() => { setChosenLabel(cfg.label); setFiles({}); }}
                className={cn('rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors',
                  chosenLabel === cfg.label ? 'border-primary bg-primary/5 text-primary' : 'border-brand-border bg-white text-foreground/70 hover:border-primary/30')}>
                {cfg.label}
              </button>
            ))}
          </div>

          {chosenConfig && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chosenConfig.parts.map(part => (
                <div key={part}>
                  <label className="text-xs font-medium text-foreground/60 block mb-1">{part}</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setFiles(prev => ({ ...prev, [part]: e.target.files?.[0] ?? null }))}
                    className="w-full h-9 text-sm border rounded-xl bg-white px-2 py-1.5 focus:outline-none file:mr-2 file:text-xs file:font-medium file:border-0 file:bg-primary/10 file:text-primary file:rounded-lg file:px-2 file:py-1" />
                </div>
              ))}
            </div>
          )}

          {chosenConfig && (
            <button onClick={handleSubmit} disabled={!allPartsSelected || uploading}
              className={cn('flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors',
                allPartsSelected && !uploading ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : `Upload ${chosenConfig.label}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

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
      <IdentityDocumentSection docs={docs} onUploaded={onUploaded} onDeleted={onDeleted} />

      {/* Upload card */}
      <div className="rounded-xl border bg-gray-50 p-5 space-y-4">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Upload a Document</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground/60 block mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
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
      {[1,2,3,4,5].map(s => <Star key={s} className={cn('h-4 w-4', s <= rating ? 'fill-amber-400 text-status-warning-text' : 'fill-gray-100 text-gray-200')} />)}
    </div>
  );
}

// ── My Projects panel ──────────────────────────────────────────────────────────
const PROJECT_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  active:    { status: 'active',    label: 'Active' },
  on_hold:   { status: 'pending',   label: 'On Hold' },
  completed: { status: 'completed', label: 'Completed' },
  cancelled: { status: 'cancelled', label: 'Cancelled' },
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
        const st = PROJECT_STATUS_MAP[p.status] ?? PROJECT_STATUS_MAP.active;
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
                  <StatusBadge status={st.status} label={st.label} className="text-[11px]" />
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
                        className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground/50 block mb-1">Date *</label>
                      <input
                        type="date"
                        value={logForm.date}
                        onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground/50 block mb-1">Task / Activity</label>
                    <input
                      value={logForm.task}
                      onChange={e => setLogForm(f => ({ ...f, task: e.target.value }))}
                      placeholder="e.g. Frontend design, Client meeting"
                      className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground/50 block mb-1">Description</label>
                    <textarea
                      value={logForm.description}
                      onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="What did you work on?"
                      className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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

function PerformancePanel({ appraisals, reviewResults }: {
  appraisals: AppraisalRecord[];
  reviewResults: ReviewResult[];
}) {
  const avg = appraisals.length > 0 ? appraisals.reduce((s, r) => s + r.rating, 0) / appraisals.length : null;
  const trend = appraisals.length >= 2 ? appraisals[0].rating - appraisals[1].rating : null;

  return (
    <div className="space-y-6">
      {appraisals.length === 0 && reviewResults.length === 0 && (
        <EmptyState icon={BarChart3} text="No performance data yet." sub="Set your first goal below or wait for HR to run appraisals." />
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

      {/* ── Goals — canonical implementation shared with the HR Performance page, instead
           of the staff portal's own separate create-goal modal + read-only list ── */}
      <div className="rounded-2xl overflow-hidden bg-white p-5">
        <GoalsTab />
      </div>

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
                  <p className="text-xs text-foreground/60 border-l-2 border-brand-border pl-3 italic">{r.recommendation}</p>
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
                {r.comments && <p className="text-sm text-foreground/70 italic border-l-2 border-brand-border pl-3">"{r.comments}"</p>}
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

// ── Skills & Qualifications panel (self-service) ──────────────────────────────
interface MyCertification { id: string; name: string; issuingOrganization: string; issueDate: string; expiryDate?: string | null; }
interface MyEducation { id: string; institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear?: number | null; }

const fmtMonthYear = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—';

function SkillsPanel({ initialSkills, initialCertifications, initialEducation }: {
  initialSkills?: string[]; initialCertifications?: MyCertification[]; initialEducation?: MyEducation[];
}) {
  const [skills, setSkills] = useState<string[]>(initialSkills ?? []);
  const [certifications, setCertifications] = useState<MyCertification[]>(initialCertifications ?? []);
  const [education, setEducation] = useState<MyEducation[]>(initialEducation ?? []);
  const [savingSkill, setSavingSkill] = useState(false);

  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', issuingOrganization: '', issueDate: '', expiryDate: '' });
  const [savingCert, setSavingCert] = useState(false);

  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' });
  const [savingEdu, setSavingEdu] = useState(false);

  const saveSkills = (next: string[]) => {
    setSavingSkill(true);
    apiCallFunction({
      url: `${API_BASE_URL}/me/skills`, method: 'PATCH', data: { skills: next }, showToast: false,
      thenFn: () => setSkills(next), finallyFn: () => setSavingSkill(false),
    });
  };
  const addSkill = (skill: string) => saveSkills([...skills, skill]);
  const removeSkill = (s: string) => saveSkills(skills.filter(x => x !== s));

  const addCert = () => {
    if (!certForm.name.trim() || !certForm.issuingOrganization.trim() || !certForm.issueDate) return;
    setSavingCert(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/me/certifications`, method: 'POST', data: certForm, showToast: false,
      thenFn: (r) => { setCertifications(c => [...c, r.data]); setCertForm({ name: '', issuingOrganization: '', issueDate: '', expiryDate: '' }); setShowCertForm(false); },
      finallyFn: () => setSavingCert(false),
    });
  };
  const removeCert = (id: string) => {
    if (!confirm('Remove this certification?')) return;
    apiCallFunction({ url: `${API_BASE_URL}/me/certifications/${id}`, method: 'DELETE', showToast: false,
      thenFn: () => setCertifications(c => c.filter(x => x.id !== id)) });
  };

  const addEdu = () => {
    if (!eduForm.institution.trim() || !eduForm.degree.trim() || !eduForm.fieldOfStudy.trim() || !eduForm.startYear) return;
    setSavingEdu(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/me/education`, method: 'POST', data: eduForm, showToast: false,
      thenFn: (r) => { setEducation(e => [...e, r.data]); setEduForm({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }); setShowEduForm(false); },
      finallyFn: () => setSavingEdu(false),
    });
  };
  const removeEdu = (id: string) => {
    if (!confirm('Remove this education entry?')) return;
    apiCallFunction({ url: `${API_BASE_URL}/me/education/${id}`, method: 'DELETE', showToast: false,
      thenFn: () => setEducation(e => e.filter(x => x.id !== id)) });
  };

  const inp = 'h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30';

  return (
    <div className="space-y-4">
      {/* Skills */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5 mb-3"><Sparkles className="h-4 w-4 text-brand-primary" /> Skills</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.length === 0 && <p className="text-sm text-foreground/40">No skills added yet.</p>}
          {skills.map(s => (
            <span key={s} className="flex items-center gap-1.5 text-xs font-medium bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
              {s}
              <button onClick={() => removeSkill(s)} disabled={savingSkill} className="hover:text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <SkillPicker
          existing={skills}
          saving={savingSkill}
          onAdd={addSkill}
          selectClassName={inp}
          inputClassName={cn(inp, 'flex-1')}
          buttonClassName="flex items-center gap-1 h-9 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50"
        />
      </div>

      {/* Certifications */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> Certifications</h3>
          <button onClick={() => setShowCertForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-primary text-white font-semibold rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {showCertForm && (
          <div className="rounded-lg border bg-gray-50 p-3 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} placeholder="Certification name *" className={inp} />
              <input value={certForm.issuingOrganization} onChange={e => setCertForm(f => ({ ...f, issuingOrganization: e.target.value }))} placeholder="Issuing organization *" className={inp} />
              <input type="date" value={certForm.issueDate} onChange={e => setCertForm(f => ({ ...f, issueDate: e.target.value }))} className={inp} />
              <input type="date" value={certForm.expiryDate} onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))} placeholder="Expiry (optional)" className={inp} />
            </div>
            <div className="flex gap-2">
              <button onClick={addCert} disabled={savingCert} className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                {savingCert && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
              </button>
              <button onClick={() => setShowCertForm(false)} className="text-xs text-foreground/50 hover:text-foreground px-2">Cancel</button>
            </div>
          </div>
        )}
        {certifications.length === 0 ? (
          <p className="text-sm text-foreground/40">No certifications added yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {certifications.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-foreground/40">{c.issuingOrganization} · {fmtMonthYear(c.issueDate)}{c.expiryDate ? ` – ${fmtMonthYear(c.expiryDate)}` : ''}</p>
                </div>
                <button onClick={() => removeCert(c.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-emerald-500" /> Education</h3>
          <button onClick={() => setShowEduForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-primary text-white font-semibold rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {showEduForm && (
          <div className="rounded-lg border bg-gray-50 p-3 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={eduForm.institution} onChange={e => setEduForm(f => ({ ...f, institution: e.target.value }))} placeholder="Institution *" className={inp} />
              <input value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} placeholder="Degree *" className={inp} />
              <input value={eduForm.fieldOfStudy} onChange={e => setEduForm(f => ({ ...f, fieldOfStudy: e.target.value }))} placeholder="Field of study *" className={inp} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={eduForm.startYear} onChange={e => setEduForm(f => ({ ...f, startYear: e.target.value }))} placeholder="Start year *" className={inp} />
                <input type="number" value={eduForm.endYear} onChange={e => setEduForm(f => ({ ...f, endYear: e.target.value }))} placeholder="End year" className={inp} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addEdu} disabled={savingEdu} className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                {savingEdu && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
              </button>
              <button onClick={() => setShowEduForm(false)} className="text-xs text-foreground/50 hover:text-foreground px-2">Cancel</button>
            </div>
          </div>
        )}
        {education.length === 0 ? (
          <p className="text-sm text-foreground/40">No education history added yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {education.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.degree} in {e.fieldOfStudy}</p>
                  <p className="text-xs text-foreground/40">{e.institution} · {e.startYear}{e.endYear ? ` – ${e.endYear}` : ' – present'}</p>
                </div>
                <button onClick={() => removeEdu(e.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
  low:    'bg-brand-bg-muted text-brand-text-secondary',
  medium: 'bg-status-warning-bg text-status-warning-text',
  high:   'bg-status-danger-bg text-status-danger-text',
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
        isDone     ? 'bg-status-success-bg border-status-success-text/20' :
        isTaskOverdue ? 'bg-status-danger-bg border-status-danger-text/20' :
        isBlocked  ? 'bg-brand-bg-soft/60 border-brand-border' :
        'bg-white border-brand-border/60 hover:border-brand-border-strong'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            isDone ? 'bg-status-success-bg' : isTaskOverdue ? 'bg-status-danger-bg' : isBlocked ? 'bg-brand-bg-muted' : 'bg-brand-primary/10')}>
            {isDone
              ? <CheckCircle2 className="h-4 w-4 text-status-success-text" />
              : task.status === 'in_progress'
                ? <Clock className="h-4 w-4 text-brand-primary" />
                : isTaskOverdue
                  ? <AlertTriangle className="h-4 w-4 text-status-danger-text" />
                  : <Circle className="h-4 w-4 text-brand-text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-sm', isDone ? 'line-through text-brand-text-muted' : 'text-brand-text')}>{task.title}</p>
            {task.description && <p className="text-xs text-brand-text-secondary mt-0.5 leading-snug">{task.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize', TASK_PRIORITY_STYLE[task.priority] ?? TASK_PRIORITY_STYLE.medium)}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className={cn('text-xs flex items-center gap-0.5', isTaskOverdue && !isDone ? 'text-status-danger-text font-semibold' : 'text-brand-text-muted')}>
                  {isTaskOverdue && !isDone && <AlertTriangle className="h-3 w-3" />}
                  Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </span>
              )}
              {task.module && <span className="text-[10px] text-brand-text-muted bg-brand-bg-soft px-2 py-0.5 rounded capitalize">{task.module}</span>}
            </div>
          </div>
        </div>
        {isBlocked && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-brand-text-muted font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
            Blocked — waiting on prerequisite tasks
          </div>
        )}
        {!isDone && !isBlocked && (
          <div className="flex gap-2 pt-1">
            {isStartable && (
              <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'in_progress')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50 flex items-center gap-1 border border-brand-primary/20">
                <Clock className="h-3 w-3" /> Start
              </button>
            )}
            <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'completed')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-status-success-bg text-status-success-text hover:bg-status-success-bg disabled:opacity-50 flex items-center gap-1 border border-status-success-text/20">
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
          <p className="text-xs font-bold text-status-danger-text uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Overdue ({overdue.length})</p>
          {overdue.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest">Pending ({pending.length})</p>
          {pending.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {inProg.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> In Progress ({inProg.length})</p>
          {inProg.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {blocked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Blocked ({blocked.length})</p>
          {blocked.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-status-success-text uppercase tracking-widest">Completed ({completed.length})</p>
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
            <Dumbbell className="h-3.5 w-3.5 text-status-success-text" /> Team Building ({teamBuilding.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamBuilding.map(e => <EventCard key={e._id} e={e} />)}
          </div>
        </div>
      )}
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

const EXPENSE_CATEGORIES = ['Meals', 'Transport', 'Accommodation', 'Office Supplies', 'Communication', 'Training', 'Other'];

function ExpensesPanel() {
  const [claims, setClaims]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [type, setType]           = useState<'regular' | 'per_diem' | 'mileage' | 'itemized'>('regular');
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
  const [items, setItems] = useState<{ category: string; description: string; amount: string; expenseDate: string }[]>([
    { category: '', description: '', amount: '', expenseDate: new Date().toISOString().slice(0, 10) },
  ]);

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

  const addItem    = () => setItems(prev => [...prev, { category: '', description: '', amount: '', expenseDate: new Date().toISOString().slice(0, 10) }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  const itemsTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const resetForm = () => {
    setType('regular'); setCategory(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10));
    setDesc(''); setDest(''); setStartDate(''); setEndDate(''); setDist(''); setRound(false);
    setReceiptFile(null);
    setItems([{ category: '', description: '', amount: '', expenseDate: new Date().toISOString().slice(0, 10) }]);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'itemized') {
      const validItems = items.filter(it => it.category && Number(it.amount) > 0);
      if (!validItems.length) return;
      setSaving(true);
      apiCallFunction({
        url: `${API_BASE_URL}/expense-claims`,
        method: 'POST',
        data: {
          type: 'itemized', currency: 'KES', notes: description || undefined,
          items: validItems.map(it => ({
            categoryId: it.category,
            categoryName: EXPENSE_CATEGORIES.find(c => c.toLowerCase() === it.category) ?? it.category,
            description: it.description, amount: Number(it.amount), expenseDate: it.expenseDate,
          })),
        },
        thenFn: () => { resetForm(); fetchClaims(); },
        finallyFn: () => setSaving(false),
      });
      return;
    }
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
              {(['regular', 'per_diem', 'mileage', 'itemized'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn('flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all',
                    type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/40 hover:border-foreground/20')}>
                  {t === 'per_diem' ? 'Per Diem' : t === 'mileage' ? 'Mileage' : t === 'itemized' ? 'Itemized' : 'Regular'}
                </button>
              ))}
            </div>
          </div>

          {/* Itemized fields */}
          {type === 'itemized' && (
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={it.category} onChange={e => updateItem(i, 'category', e.target.value)}
                      className="h-9 px-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary">
                      <option value="">Category…</option>
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                    </select>
                    <input type="number" value={it.amount} onChange={e => updateItem(i, 'amount', e.target.value)} placeholder="Amount (KES)"
                      className="h-9 px-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description"
                      className="h-9 px-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
                    <input type="date" value={it.expenseDate} onChange={e => updateItem(i, 'expenseDate', e.target.value)}
                      className="h-9 px-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
                    <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                      className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 disabled:opacity-30 flex items-center justify-center">×</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
              {itemsTotal > 0 && <p className="text-sm font-bold text-foreground">Total: KES {itemsTotal.toLocaleString()}</p>}
            </div>
          )}

          {/* Regular fields */}
          {type === 'regular' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary">
                  <option value="">Select…</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Amount (KES)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
          )}

          {/* Per diem fields */}
          {type === 'per_diem' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/50 mb-1">Destination</label>
                <input value={destination} onChange={e => setDest(e.target.value)} placeholder="e.g. Mombasa" required
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-foreground/50 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs text-foreground/50 mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
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
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
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
          {type !== 'itemized' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Description</label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="What was this for?"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          )}
          {type === 'itemized' && (
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Notes for approver (optional)</label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Add context…"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
            </div>
          )}

          {/* Receipt */}
          {type !== 'itemized' && (
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
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-foreground/50 border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving || (type !== 'itemized' && !receiptFile)}
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
            <div key={c._id} className="bg-muted/30 border rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.description || (c.type === 'itemized' ? `${c.items?.length ?? 0} line items` : `${c.type} expense`)}
                  </p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {c.category && <span className="capitalize mr-2">{c.category}</span>}
                    {new Date(c.date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground">KES {(c.amount || 0).toLocaleString()}</span>
                  <StatusBadge status={(['submitted', 'approved', 'rejected', 'draft'].includes(c.status) ? c.status : 'draft') as Status} className="text-[11px]" />
                </div>
              </div>
              {c.approvalChain?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.approvalChain.map((a: any) => (
                    <span key={a.level} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : a.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                      L{a.level} {a.approverName || a.approverRole || '—'} · {a.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── My Requests Panel (procurement self-service) ───────────────────────────────
const REQUEST_STATUS_MAP: Record<string, Status> = {
  pending: 'pending', approved: 'approved', rejected: 'rejected', converted: 'info',
};

function RequestsPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [vendors, setVendors]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [justification, setJustification] = useState('');
  const [estimatedCost, setEstimatedCost]  = useState('');
  const [priority, setPriority] = useState('normal');
  const [vendorId, setVendorId] = useState('');
  const [neededBy, setNeededBy] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/spending/procurement`,
      showToast: false,
      thenFn: r => setRequests(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  };

  useEffect(() => {
    fetchRequests();
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement/vendors?status=active`, showToast: false,
      thenFn: r => setVendors(r?.data ?? []) });
  }, []);

  const resetForm = () => {
    setTitle(''); setDesc(''); setJustification(''); setEstimatedCost(''); setPriority('normal'); setVendorId(''); setNeededBy('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !estimatedCost) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement`,
      method: 'POST',
      data: { title, description, justification, estimatedCost: Number(estimatedCost), priority, vendorId: vendorId || undefined, neededBy: neededBy || undefined },
      thenFn: () => { resetForm(); fetchRequests(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">My Purchase Requests</h2>
          <p className="text-xs text-foreground/50 mt-0.5">Request approval to purchase goods or services</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Request
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/40 border rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">New Purchase Request</p>
          <div>
            <label className="block text-xs text-foreground/50 mb-1">Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you need?" required
              className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs text-foreground/50 mb-1">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs text-foreground/50 mb-1">Justification</label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder="Why is this needed?"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Estimated Cost (KES) <span className="text-red-500">*</span></label>
              <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0.00" required
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary">
                {['urgent', 'high', 'normal', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Vendor</label>
              <select value={vendorId} onChange={e => setVendorId(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary">
                <option value="">No preferred vendor</option>
                {vendors.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Needed By</label>
              <input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-foreground/50 border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !title || !estimatedCost}
              className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={ShoppingCart} text="No purchase requests yet." sub="Submit a request to purchase goods or services." />
      ) : (
        <div className="space-y-2">
          {requests.map((r: any) => (
            <div key={r._id} className="bg-muted/30 border rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {r.priority && <span className="capitalize mr-2">{r.priority} priority</span>}
                    {r.neededBy && `Needed by ${new Date(r.neededBy).toLocaleDateString('en-KE', { dateStyle: 'medium' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground">KES {(r.estimatedCost || 0).toLocaleString()}</span>
                  <StatusBadge status={REQUEST_STATUS_MAP[r.status] ?? 'pending'} label={r.status} className="text-[11px]" />
                </div>
              </div>
              {r.approvalChain?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.approvalChain.map((a: any) => (
                    <span key={a.level} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : a.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                      L{a.level} {a.approverName || a.approverRole || '—'} · {a.status}
                    </span>
                  ))}
                </div>
              )}
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

const APP_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  active:    { status: 'info',      label: 'In Progress' },
  hired:     { status: 'completed', label: 'Hired' },
  rejected:  { status: 'rejected',  label: 'Not Proceeding' },
  withdrawn: { status: 'cancelled', label: 'Withdrawn' },
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
                          <span className="text-[11px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full font-medium">{pos.department}</span>
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
                const statusCfg = APP_STATUS_MAP[app.status] ?? { status: 'inactive' as Status, label: app.status };
                return (
                  <div key={app._id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{app.positionTitle}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {app.stageName ? `${app.stageName} · ` : ''}{new Date(app.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <StatusBadge status={statusCfg.status} label={statusCfg.label} className="text-[11px] px-2.5 py-1 shrink-0" />
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}

