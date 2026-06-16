'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import {
  User, CalendarDays, DollarSign, Clock, ClipboardList, Loader2,
  Mail, Phone, Briefcase, Building2, MessageSquare, Plus,
  CheckCircle2, Circle, ChevronRight, Pencil, X, Save,
  CreditCard, Landmark, Smartphone, AlertTriangle, Bell,
  CheckCheck, FileText, BarChart3, FolderOpen, Shield,
  Upload, Trash2, Download, Printer, Star, TrendingUp, TrendingDown,
  Trophy, BookOpen, Dumbbell, MapPin, BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { useMyPortal, type OnboardingTask, type MyDocument, type AppraisalRecord, type EmpAward, type ScheduledEvent, type EmployeeTask } from '../Hooks/useMyPortal';
import { ChatPanel } from './ChatPanel';
import { LeaveBalanceCard } from '@/features/leave/Components/LeaveBalanceCard';
import { PayrollTable } from '@/features/payroll/Components/PayrollTable';
import { AttendanceGrid } from '@/features/attendance/Components/AttendanceGrid';
import { ClockInWidget } from '@/features/attendance/Components/ClockInWidget';
import { LogLeaveModal } from '@/features/leave/Components/LogLeaveModal';
import type { LeaveRequest } from '@/features/leave/Hooks/useLeave';

type Section = 'profile' | 'leave' | 'payslips' | 'attendance' | 'onboarding' | 'tasks' | 'payment' | 'messages' | 'documents' | 'performance' | 'awards' | 'events' | 'jd' | 'terms';

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
  general:      'bg-gray-100 text-gray-600',
};

const NAV: { key: Section; label: string; icon: typeof User; description: string }[] = [
  { key: 'profile',     label: 'My Profile',     icon: User,           description: 'Personal & contact info' },
  { key: 'leave',       label: 'Leave',           icon: CalendarDays,   description: 'Balance & requests' },
  { key: 'payslips',    label: 'Payslips',        icon: DollarSign,     description: 'Monthly payroll history' },
  { key: 'attendance',  label: 'Attendance',      icon: Clock,          description: 'Daily records' },
  { key: 'onboarding',  label: 'Onboarding',      icon: ClipboardList,  description: 'Tasks & checklist' },
  { key: 'tasks',       label: 'My Tasks',        icon: CheckCircle2,   description: 'Tasks assigned by HR' },
  { key: 'documents',   label: 'My Documents',    icon: FolderOpen,     description: 'Certificates & files' },
  { key: 'performance', label: 'My Performance',  icon: BarChart3,      description: 'Appraisal history' },
  { key: 'awards',      label: 'My Awards',       icon: Trophy,         description: 'Certifications & recognition' },
  { key: 'events',      label: 'Events & Schedule', icon: CalendarDays, description: 'Upcoming training & team building' },
  { key: 'jd',          label: 'Job Description', icon: FileText,       description: 'Your role & responsibilities' },
  { key: 'payment',     label: 'Payment Methods', icon: CreditCard,     description: 'Bank & M-Pesa details' },
  { key: 'messages',    label: 'Communication',   icon: MessageSquare,  description: 'Chat & announcements' },
  { key: 'terms',       label: 'Terms & Conditions', icon: Shield,      description: 'Policies & agreements' },
];

export function MyPortalView() {
  const {
    profile, leaveBalance, leaveRequests, payslips, attendance, onboardingTasks,
    notifications, announcements, documents, appraisals, awards, events, myTasks, loading,
    refreshLeave, refreshOnboarding, updateProfile, disputeLeave,
    markNotifRead, markAllNotifsRead, markAnnouncementRead,
    refreshDocuments, deleteDocument,
  } = useMyPortal();

  const [active, setActive]           = useState<Section>('profile');
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
    <div className="flex flex-col items-center justify-center h-64 text-foreground/40 gap-3">
      <User className="h-12 w-12 opacity-30" />
      <p className="text-sm font-medium">No employee record linked to your account.</p>
      <p className="text-xs">Contact HR to link your account to an employee record.</p>
    </div>
  );

  const pendingOnboarding  = onboardingTasks.filter(t => t.status !== 'completed').length;
  const unreadAnnouncements = announcements.filter(a => !a.isRead).length;
  const unreadNotifs = notifications.length;
  const totalUnread  = unreadNotifs + unreadAnnouncements;

  const pendingTasks = myTasks.filter(t => t.status !== 'completed').length;

  const navBadge = (key: Section) => {
    if (key === 'onboarding') return pendingOnboarding || null;
    if (key === 'messages')   return unreadAnnouncements || null;
    if (key === 'tasks')      return pendingTasks || null;
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

      <div className="flex gap-5 h-[calc(100vh-5rem)] min-h-0">

        {/* ── Left sidebar ── */}
        <aside className="w-64 shrink-0 flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-[#1a3461] p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-bold text-white shrink-0', avatarColor(profile.fullName))}>
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{profile.fullName}</p>
                <p className="text-white/60 text-xs truncate">{profile.designation}</p>
              </div>
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
                <button key={key} onClick={() => setActive(key)}
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
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">{item.label}</h2>
                    <p className="text-xs text-foreground/40">{item.description}</p>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
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
                            ) : notifications.map(n => (
                              <div key={n._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 capitalize', NOTIF_COLORS[n.type] ?? NOTIF_COLORS.general)}>
                                  {n.type}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground leading-tight">{n.title}</p>
                                  <p className="text-xs text-foreground/50 mt-0.5 leading-snug">{n.body}</p>
                                  <p className="text-xs text-foreground/30 mt-1">{new Date(n.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                                </div>
                                <button onClick={() => markNotifRead(n._id)} className="text-foreground/20 hover:text-foreground shrink-0">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
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
            {active === 'profile'    && <ProfilePanel profile={profile} onSave={updateProfile} />}
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
            {active === 'onboarding'  && <OnboardingTasksPanel tasks={onboardingTasks} onComplete={() => refreshOnboarding()} />}
            {active === 'tasks'       && <MyTasksPanel tasks={myTasks} />}
            {active === 'documents'   && <DocumentsPanel docs={documents} onDeleted={deleteDocument} onUploaded={refreshDocuments} employeeId={profile._id} />}
            {active === 'performance' && <PerformancePanel appraisals={appraisals} />}
            {active === 'awards'      && <MyAwardsPanel awards={awards} />}
            {active === 'events'      && <MyEventsPanel events={events} />}
            {active === 'jd'          && <JobDescriptionPanel jd={(profile as any).jobDescription} />}
            {active === 'terms'       && <TermsPanel />}
            {active === 'messages'    && <ChatPanel announcements={announcements} onReadAnnouncement={markAnnouncementRead} />}
          </div>
        </main>
      </div>
    </>
  );
}

// ── Profile panel ──────────────────────────────────────────────────────────────
function ProfilePanel({ profile, onSave }: { profile: any; onSave: (d: Record<string, string>) => void }) {
  const [editing, setEditing]     = useState(false);
  const [email, setEmail]         = useState(profile.email || '');
  const [phone, setPhone]         = useState(profile.phone || '');
  const [nextOfKin, setNextOfKin] = useState(profile.nextOfKin || '');
  const [saving, setSaving]       = useState(false);

  const save = () => {
    setSaving(true);
    onSave({ email, phone, nextOfKin });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-5">
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
        {editing ? <EditField icon={Mail} label="Email" value={email} onChange={setEmail} color="text-blue-600" />
                 : <InfoRow  icon={Mail}  label="Email" value={profile.email || '—'}      color="text-blue-600" />}
        {editing ? <EditField icon={Phone} label="Phone" value={phone} onChange={setPhone} color="text-green-600" />
                 : <InfoRow  icon={Phone}  label="Phone" value={profile.phone || '—'}      color="text-green-600" />}
        <InfoRow icon={Building2}    label="Department"      value={profile.department || '—'}    color="text-violet-600" />
        <InfoRow icon={Briefcase}    label="Employment Type" value={profile.staffCategory || '—'} color="text-amber-600" />
        <InfoRow icon={CalendarDays} label="Date of Hire"    value={profile.dateOfHire ? new Date(profile.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'} color="text-rose-600" />
        {editing ? <EditField icon={User} label="Next of Kin" value={nextOfKin} onChange={setNextOfKin} color="text-primary" />
                 : <InfoRow  icon={User}  label="Next of Kin" value={profile.nextOfKin || '—'}              color="text-primary" />}
      </div>
      {editing && <p className="text-xs text-foreground/40 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">You can update your email, phone number and next of kin. For other changes, contact HR.</p>}
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

  const save = () => {
    setSaving(true);
    onSave({ paymentMethod: method, bankName, bankAccountNumber: bankAcct, mpesaNumber: mpesa, paypalEmail: paypal, cryptoWalletAddress: wallet, cryptoNetwork: network });
    setSaving(false);
    setEditing(false);
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

  const submitDispute = (id: string) => {
    if (!disputeReason.trim()) return;
    setSubmitting(true);
    onDispute(id, disputeReason);
    setDisputingId(null); setDisputeReason(''); setSubmitting(false);
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
                          <a
                            href={`${API_BASE_URL}/me/leave/requests/${r._id}/pdf`}
                            download={`leave-${r._id}.pdf`}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            target="_blank" rel="noreferrer"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                          <button
                            onClick={() => window.open(`${API_BASE_URL}/me/leave/requests/${r._id}/pdf`, '_blank')}
                            className="flex items-center gap-1 text-xs font-medium text-foreground/50 hover:text-foreground hover:underline"
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
  if (tasks.length === 0) return <EmptyState icon={ClipboardList} text="No onboarding tasks assigned." />;
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

// ── Documents panel ────────────────────────────────────────────────────────────
const DOC_TYPES = ['National ID', 'Passport', 'Driving License', 'Degree Certificate', 'Diploma Certificate', 'Professional Certificate', 'KRA PIN', 'NHIF Card', 'NSSF Card', 'Other'];

function DocumentsPanel({ docs, onDeleted, onUploaded, employeeId: _employeeId }: {
  docs: MyDocument[]; onDeleted: (id: string) => void; onUploaded: () => void; employeeId: string;
}) {
  const [docType, setDocType]   = useState(DOC_TYPES[0]);
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { API_BASE_URL } = require('@/configs/constants');

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
                  <a href={`${API_BASE_URL}/me/documents/${d.docId}/download`}
                    target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-primary/10 flex items-center justify-center text-foreground/40 hover:text-primary transition-colors">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {confirmId === d.docId ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { onDeleted(d.docId); setConfirmId(null); }} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                      <span className="text-foreground/20">/</span>
                      <button onClick={() => setConfirmId(null)} className="text-xs text-foreground/40 hover:underline">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(d.docId)}
                      className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center text-foreground/30 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
      }
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

function PerformancePanel({ appraisals }: { appraisals: AppraisalRecord[] }) {
  if (appraisals.length === 0)
    return <EmptyState icon={BarChart3} text="No appraisals recorded yet." sub="Your performance reviews will appear here once HR or your manager submits one." />;

  const avg = appraisals.reduce((s, r) => s + r.rating, 0) / appraisals.length;
  const trend = appraisals.length >= 2 ? appraisals[0].rating - appraisals[1].rating : null;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
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

      {/* Appraisal cards */}
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
const TASK_PRIORITY: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
};

function MyTasksPanel({ tasks }: { tasks: EmployeeTask[] }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const updateStatus = (id: string, status: EmployeeTask['status']) => {
    setUpdating(id);
    setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    apiCallFunction({
      url: `${API_BASE_URL}/tasks/${id}/status`,
      method: 'PATCH',
      data: { status },
      showToast: false,
      finallyFn: () => setUpdating(null),
    });
  };

  const pending   = localTasks.filter(t => t.status === 'pending');
  const inProg    = localTasks.filter(t => t.status === 'in_progress');
  const completed = localTasks.filter(t => t.status === 'completed');

  if (localTasks.length === 0)
    return <EmptyState icon={CheckCircle2} text="No tasks assigned." sub="Tasks assigned by HR will appear here." />;

  const TaskCard = ({ task }: { task: EmployeeTask }) => {
    const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
    return (
      <div className={cn('rounded-xl border bg-white p-4 space-y-3', overdue && 'border-red-200 bg-red-50/30')}>
        <div className="flex items-start gap-3">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
            task.status === 'completed' ? 'bg-emerald-50' : overdue ? 'bg-red-50' : 'bg-primary/10')}>
            {task.status === 'completed'
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              : task.status === 'in_progress'
                ? <Clock className="h-4 w-4 text-violet-500" />
                : <Circle className="h-4 w-4 text-primary/60" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-sm', task.status === 'completed' && 'line-through text-foreground/40')}>{task.title}</p>
            {task.description && <p className="text-xs text-foreground/50 mt-0.5">{task.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize', TASK_PRIORITY[task.priority])}>
                {task.priority}
              </span>
              <span className={cn('text-xs', overdue ? 'text-red-600 font-semibold' : 'text-foreground/40')}>
                {overdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                Due {new Date(task.dueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
              </span>
              {task.assignedBy && <span className="text-xs text-foreground/30">· from {task.assignedBy}</span>}
            </div>
          </div>
        </div>
        {task.status !== 'completed' && (
          <div className="flex gap-2 pt-1">
            {task.status === 'pending' && (
              <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'in_progress')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Start
              </button>
            )}
            <button disabled={updating === task._id} onClick={() => updateStatus(task._id, 'completed')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Mark Done
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Pending ({pending.length})</p>
          {pending.map(t => <TaskCard key={t._id} task={t} />)}
        </div>
      )}
      {inProg.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">In Progress ({inProg.length})</p>
          {inProg.map(t => <TaskCard key={t._id} task={t} />)}
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
    return `<html><head><title>Terms & Conditions</title><style>body{font-family:sans-serif;padding:2rem;font-size:13px;color:#333;max-width:800px;margin:0 auto}h3{font-size:14px;margin:16px 0 4px;font-weight:600}p{margin-bottom:12px;line-height:1.6;color:#555}</style></head><body><h2 style="margin-bottom:4px">Terms & Conditions</h2><p style="color:#999;font-size:11px;margin-bottom:24px">Last updated: June 2026</p>${sections}</body></html>`;
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
          <p className="text-xs text-foreground/30 border-t pt-4 mt-2">Last updated: June 2026 · For queries contact HR at hr@school.ac.ke</p>
        </div>
      )}
    </div>
  );
}
