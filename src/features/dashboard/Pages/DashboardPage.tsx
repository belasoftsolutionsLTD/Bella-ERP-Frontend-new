'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Play, Square, Coffee, MapPin, Users, Calendar, TrendingUp,
  Briefcase, Bell, ChevronRight, Target, Clock, RefreshCw,
  UserPlus, ClipboardList, CheckCircle, AlertTriangle, Star,
  Building2, Home, Globe2, HardHat, PartyPopper, Cake,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClockIn } from '@/contexts/ClockInContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Summary {
  role: string;
  // staff
  leaveBalance?: number;
  pendingExpenses?: number;
  goalsAtRisk?: number;
  // dept_head
  teamSize?: number;
  onLeaveToday?: number;
  pendingApprovals?: number;
  missingClockIn?: number;
  // hr
  totalHeadcount?: number;
  newHires?: number;
  openPositions?: number;
  payrollStatus?: string;
}

interface TodaySchedule {
  type: 'work' | 'leave' | 'holiday';
  scheduleName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  expectedHours?: number;
  leaveType?: string;
  name?: string;
}

interface PendingActions {
  total: number;
  byType: Record<string, number>;
}

interface FeedPost {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
  comments?: unknown[];
}

interface Event {
  _id: string;
  title: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  type?: string;
}

interface Celebration {
  type: 'birthday' | 'anniversary';
  employee: { _id: string; fullName: string };
  date: string;
  years?: number;
}

interface GoalsSummary {
  total: number;
  onTrack: number;
  overallProgress: number;
  goals: Array<{ _id: string; title: string; status: string; progress?: number }>;
}

interface LiveAttendance {
  clockedIn: number;
  onBreak: number;
  clockedOut: number;
  onLeave: number;
  notIn: number;
  totalActive: number;
  recentClockIns: Array<{ name: string; checkInTime: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

const LOCATION_ICONS: Record<string, React.ElementType> = {
  office: Building2, home: Home, remote: Globe2, client_site: HardHat,
};
const LOCATION_LABELS: Record<string, string> = {
  office: 'Office', home: 'Home', remote: 'Remote', client_site: 'Client Site',
};

// ── Circular SVG ring ─────────────────────────────────────────────────────────

function Ring({ pct, size = 160, stroke = 10, color = '#22c55e', label, sublabel }: {
  pct: number; size?: number; stroke?: number; color?: string; label: string; sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10">
        <span className="font-mono font-bold text-[22px] text-brand-text leading-none">{label}</span>
        {sublabel && <span className="text-[11px] mt-0.5" style={{ color }}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ── Small progress ring ───────────────────────────────────────────────────────

function SmallRing({ pct, size = 80, color = '#6366f1' }: { pct: number; size?: number; color?: string }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="z-10 font-bold text-[15px] text-brand-text">{pct}%</span>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl p-4 border border-brand-border/60 bg-brand-bg-soft ${className}`} style={style}>
      {children}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, action, actionLabel }: { title: string; action?: string; actionLabel?: string }) {
  const locale = useLocale();
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-text-secondary">{title}</span>
      {action && (
        <Link href={`/${locale}${action}`} className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
          {actionLabel || 'View all'} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLOCK IN WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function ClockInWidget() {
  const { state, clockedInAt, elapsedSeconds, breakSeconds, location, clockIn, clockOut, startBreak, endBreak, loading } = useClockIn();
  const [selectedLocation, setSelectedLocation] = useState<'office' | 'home' | 'remote' | 'client_site'>('office');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const workPct = state === 'working' ? Math.min(100, (elapsedSeconds / (8 * 3600)) * 100) : 0;
  const breakPct = state === 'on_break' ? Math.min(100, (breakSeconds / 3600) * 100) : 0;

  const borderColor = state === 'working' ? '#22c55e' : state === 'on_break' ? '#f59e0b' : '#334155';

  return (
    <Card className="relative overflow-hidden" style={{ borderTop: `3px solid ${borderColor}` }}>
      {state === 'idle' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="font-mono text-[28px] font-bold text-brand-text leading-none">
              {now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[13px] text-brand-text-secondary mt-1">
              {now.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="text-[12px] text-brand-text-secondary">Not clocked in</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-brand-text-secondary uppercase tracking-wider block mb-1.5">Working from</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['office', 'home', 'remote', 'client_site'] as const).map(loc => {
                const Icon = LOCATION_ICONS[loc];
                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] transition-colors ${
                      selectedLocation === loc
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-bg-muted/50 text-brand-text-secondary hover:bg-brand-bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {LOCATION_LABELS[loc]}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={loading}
            onClick={() => clockIn(selectedLocation)}
            className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-white" />
            Clock In
          </button>
        </div>
      )}

      {(state === 'working' || state === 'on_break') && (
        <div className="space-y-4">
          <div className="flex justify-center">
            {state === 'working' ? (
              <Ring
                pct={workPct}
                label={formatSeconds(elapsedSeconds)}
                sublabel="working"
                color="#22c55e"
              />
            ) : (
              <Ring
                pct={breakPct}
                label={formatSeconds(breakSeconds)}
                sublabel="on break"
                color="#f59e0b"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="h-2 w-2 rounded-full" style={{ background: state === 'working' ? '#22c55e' : '#f59e0b' }} />
              <span className="text-brand-text-secondary">
                {state === 'working' ? `Working from ${LOCATION_LABELS[location]}` : 'On a break'}
              </span>
            </div>
            {clockedInAt && (
              <div className="text-[12px] text-brand-text-muted">
                Clocked in at {clockedInAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {state === 'working' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={loading}
                onClick={startBreak}
                className="h-10 rounded-xl border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Coffee className="h-3.5 w-3.5" /> Break
              </button>
              <button
                disabled={loading}
                onClick={clockOut}
                className="h-10 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Square className="h-3.5 w-3.5 fill-red-400" /> Clock Out
              </button>
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={endBreak}
              className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" /> Resume
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Today's Schedule ──────────────────────────────────────────────────────────

function TodayScheduleCard({ schedule }: { schedule: TodaySchedule | null }) {
  if (!schedule) return null;
  return (
    <Card className="mt-3">
      <SectionHeader title="Today's Schedule" />
      {schedule.type === 'leave' && (
        <div className="flex items-center gap-2 text-green-400 text-[13px]">
          <span className="text-lg">🌴</span> Annual Leave
        </div>
      )}
      {schedule.type === 'holiday' && (
        <div className="flex items-center gap-2 text-teal-400 text-[13px]">
          <span className="text-lg">🎉</span> {schedule.name || 'Public Holiday'}
        </div>
      )}
      {schedule.type === 'work' && (
        <div className="space-y-1.5 text-[13px]">
          <div className="font-medium text-brand-text">{schedule.scheduleName}</div>
          <div className="text-brand-text-secondary">Shift: {schedule.shiftStart} → {schedule.shiftEnd}</div>
          <div className="text-brand-text-secondary">Break: {schedule.breakStart} → {schedule.breakEnd}</div>
          <div className="text-brand-text-muted">Expected: {schedule.expectedHours}h 00m</div>
        </div>
      )}
    </Card>
  );
}

// ── Quick Stats ───────────────────────────────────────────────────────────────

function QuickStatsCard({ summary }: { summary: Summary | null }) {
  const locale = useLocale();
  if (!summary) return null;

  const items: Array<{ label: string; value: string; icon: React.ElementType; color: string; href?: string; alert?: boolean }> = [];

  if (summary.role === 'staff') {
    items.push(
      { label: 'Leave balance', value: `Annual: ${summary.leaveBalance ?? 0} days`, icon: Calendar, color: '#6366f1', href: `/${locale}/leave` },
      { label: 'Pending expenses', value: `KES pending: ${summary.pendingExpenses ?? 0}`, icon: Briefcase, color: '#f59e0b', href: `/${locale}/expenses` },
      { label: 'Goals at risk', value: `${summary.goalsAtRisk ?? 0} goals`, icon: Target, color: '#ef4444', alert: (summary.goalsAtRisk ?? 0) > 0, href: `/${locale}/performance` },
    );
  } else if (summary.role === 'department_head') {
    items.push(
      { label: 'Team size', value: `${summary.teamSize ?? 0} members`, icon: Users, color: '#6366f1' },
      { label: 'On leave today', value: `${summary.onLeaveToday ?? 0} members`, icon: Calendar, color: '#22c55e' },
      { label: 'Pending approvals', value: `${summary.pendingApprovals ?? 0} requests`, icon: ClipboardList, color: '#f59e0b', href: `/${locale}/inbox` },
      { label: 'Missing clock-in', value: `${summary.missingClockIn ?? 0} member${(summary.missingClockIn ?? 0) !== 1 ? 's' : ''}`, icon: AlertTriangle, color: '#ef4444', alert: (summary.missingClockIn ?? 0) > 0 },
    );
  } else {
    items.push(
      { label: 'Total headcount', value: `${summary.totalHeadcount ?? 0} employees`, icon: Users, color: '#6366f1' },
      { label: 'New hires', value: `${summary.newHires ?? 0} this month`, icon: UserPlus, color: '#22c55e' },
      { label: 'Open positions', value: `${summary.openPositions ?? 0} positions`, icon: Briefcase, color: '#f59e0b', href: `/${locale}/recruitment` },
      { label: 'Payroll', value: summary.payrollStatus ?? '—', icon: TrendingUp, color: '#a78bfa', href: `/${locale}/payroll` },
    );
  }

  return (
    <Card className="mt-3">
      <SectionHeader title={summary.role === 'department_head' ? "Team Quick Stats" : "Quick Stats"} />
      <div className="space-y-2.5">
        {items.map(({ label, value, icon: Icon, color, href, alert }) => {
          const content = (
            <div className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-brand-text-muted">{label}</div>
                <div className={`text-[13px] font-semibold truncate ${alert ? 'text-red-400' : 'text-brand-text'}`}>{value}</div>
              </div>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{content}</Link>
          ) : (
            <div key={label}>{content}</div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Pending Actions Banner ────────────────────────────────────────────────────

function PendingActionsBanner({ pending, locale }: { pending: PendingActions | null; locale: string }) {
  if (!pending || pending.total === 0) return null;
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: '#1e293b', borderLeft: '4px solid #f59e0b', border: '1px solid #f59e0b40' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-amber-400 font-semibold text-[13px]">⚡ You have {pending.total} action{pending.total !== 1 ? 's' : ''} waiting</span>
          {Object.entries(pending.byType).map(([type, count]) => (
            <Link key={type} href={`/${locale}/inbox?type=${type}`}
              className="px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary text-[11px] hover:bg-brand-border-strong transition-colors">
              {count} {type}
            </Link>
          ))}
        </div>
        <Link href={`/${locale}/inbox`} className="text-[11px] text-amber-400 hover:text-amber-300 whitespace-nowrap flex items-center gap-0.5">
          View all in Inbox <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ── Inbox Preview ─────────────────────────────────────────────────────────────

interface InboxItem {
  _id: string;
  type: string;
  title: string;
  subtitle: string;
  createdAt: string;
  status: string;
  requiresAction: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  leave: '#3b82f6', expense: '#22c55e', timesheet: '#f59e0b',
  document: '#8b5cf6', performance: '#ec4899', recruitment: '#f97316',
  onboarding: '#10b981', payroll: '#16a34a', survey: '#6366f1', general: '#64748b',
};

function InboxPreviewCard({ locale }: { locale: string }) {
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    apiCallFunction<{ data: { records: InboxItem[] } }>({
      url: `${API_BASE_URL}/inbox?limit=3`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => setItems(res?.data?.records || []),
    });
  }, []);

  return (
    <Card>
      <SectionHeader title="Inbox" action="/inbox" actionLabel="View all" />
      {items.length === 0 ? (
        <p className="text-[12px] text-brand-text-muted py-2">No pending items.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Link key={item._id} href={`/${locale}/inbox`}
              className={`flex items-start gap-3 p-2.5 rounded-lg hover:bg-brand-bg-muted/50 transition-colors cursor-pointer ${item.status === 'unread' ? 'border-l-2 border-brand-primary bg-brand-bg-muted/30' : ''}`}>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${TYPE_COLORS[item.type] || '#64748b'}20` }}>
                <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[item.type] || '#64748b' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-brand-text truncate">{item.title}</div>
                <div className="text-[12px] text-brand-text-secondary truncate">{item.subtitle}</div>
                <div className="text-[11px] text-brand-text-muted mt-0.5">{timeAgo(item.createdAt)}</div>
              </div>
              {item.status === 'unread' && <span className="h-2 w-2 rounded-full bg-brand-primary shrink-0 mt-2" />}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Feed Preview ──────────────────────────────────────────────────────────────

function FeedPreviewCard({ posts, celebrations, locale }: {
  posts: FeedPost[]; celebrations: Celebration[]; locale: string;
}) {
  return (
    <Card className="mt-4">
      <SectionHeader title="Company Feed" action="/communications" actionLabel="View all" />

      <Link href={`/${locale}/communications`}
        className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-bg-muted/30 hover:bg-brand-bg-muted/50 transition-colors cursor-pointer mb-3">
        <div className="h-8 w-8 rounded-full bg-brand-primary/30 flex items-center justify-center shrink-0">
          <span className="text-indigo-400 text-sm">✏️</span>
        </div>
        <span className="text-[13px] text-brand-text-secondary">Share something with your team...</span>
      </Link>

      {celebrations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {celebrations.map((c, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl bg-brand-bg-muted/30 min-w-[72px]">
              <div className="h-9 w-9 rounded-full bg-brand-primary/30 flex items-center justify-center">
                {c.type === 'birthday' ? <Cake className="h-4 w-4 text-pink-400" /> : <PartyPopper className="h-4 w-4 text-amber-400" />}
              </div>
              <span className="text-[10px] text-brand-text-secondary text-center font-medium leading-tight truncate w-full text-center">{c.employee.fullName.split(' ')[0]}</span>
              <span className="text-[10px] text-brand-text-muted">{formatDate(c.date)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {posts.map(post => (
          <Link key={post._id} href={`/${locale}/communications`}
            className="block p-2.5 rounded-lg bg-brand-bg-muted/30 hover:bg-brand-bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-brand-primary/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                {post.authorName?.[0] || '?'}
              </div>
              <span className="text-[12px] font-medium text-brand-text-secondary">{post.authorName}</span>
              <span className="text-[11px] text-brand-text-muted ml-auto">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="text-[12px] text-brand-text-secondary line-clamp-2">{post.content}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ── Live Attendance ────────────────────────────────────────────────────────────

function LiveAttendanceCard({ data, onRefresh, locale }: { data: LiveAttendance | null; onRefresh: () => void; locale: string }) {
  if (!data) return null;
  const bubbles = [
    { label: 'Clocked In', count: data.clockedIn, color: '#22c55e', bg: '#022c22' },
    { label: 'On Break', count: data.onBreak, color: '#f59e0b', bg: '#2d2006' },
    { label: 'Not In', count: data.notIn, color: '#ef4444', bg: '#2d1515' },
    { label: 'On Leave', count: data.onLeave, color: '#6366f1', bg: '#0c1a3d' },
  ];
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-text-secondary">Live Attendance · Today</span>
        <button onClick={onRefresh} className="text-brand-text-muted hover:text-brand-text-secondary transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {bubbles.map(b => (
          <div key={b.label} className="rounded-xl p-2.5 text-center" style={{ background: b.bg }}>
            <div className="text-[22px] font-bold" style={{ color: b.color }}>{b.count}</div>
            <div className="text-[11px] text-brand-text-secondary">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {data.recentClockIns.slice(0, 4).map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-brand-text-secondary truncate">{r.name}</span>
            <span className="text-brand-text-muted ml-auto whitespace-nowrap">
              {new Date(r.checkInTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
      <Link href={`/${locale}/attendance`} className="mt-3 flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300">
        View full report <ChevronRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

// ── Events This Week ──────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  training: '#6366f1', meeting: '#3b82f6', holiday: '#22c55e',
  birthday: '#ec4899', company: '#f97316',
};

function EventsCard({ events, locale }: { events: Event[]; locale: string }) {
  return (
    <Card className="mt-3">
      <SectionHeader title="Upcoming Events" action="/events" actionLabel="View calendar" />
      {events.length === 0 ? (
        <p className="text-[12px] text-brand-text-muted py-2">No upcoming events.</p>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const d = new Date(ev.scheduledDate);
            const month = d.toLocaleDateString('en-KE', { month: 'short' }).toUpperCase();
            const day = d.getDate();
            const color = EVENT_COLORS[ev.type || 'company'] || '#6366f1';
            return (
              <div key={ev._id} className="flex items-center gap-3">
                <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[42px]" style={{ background: `${color}20` }}>
                  <div className="text-[10px] font-bold" style={{ color }}>{month}</div>
                  <div className="text-[16px] font-black" style={{ color }}>{day}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-brand-text truncate">{ev.title}</div>
                  <div className="text-[12px] text-brand-text-muted">
                    {ev.startTime ? `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ''}` : 'All day'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Goals Summary ─────────────────────────────────────────────────────────────

const GOAL_STATUS_COLORS: Record<string, string> = {
  on_track: '#22c55e', completed: '#6366f1', at_risk: '#f59e0b', behind: '#ef4444',
};

function GoalsSummaryCard({ goals, locale }: { goals: GoalsSummary | null; locale: string }) {
  if (!goals || goals.total === 0) return null;
  return (
    <Card className="mt-3">
      <SectionHeader title="My Goals · Q2 2026" action="/performance" actionLabel="View all goals" />
      <div className="flex items-center gap-4 mb-3">
        <SmallRing pct={goals.overallProgress} />
        <div>
          <div className="text-[13px] text-brand-text-secondary font-medium">{goals.onTrack} of {goals.total} on track</div>
          <div className="text-[12px] text-brand-text-muted">{goals.overallProgress}% overall progress</div>
        </div>
      </div>
      <div className="space-y-2">
        {goals.goals.map(g => (
          <div key={g._id}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[12px] text-brand-text-secondary truncate max-w-[160px]">{g.title}</span>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: GOAL_STATUS_COLORS[g.status] || '#64748b' }} />
            </div>
            <div className="h-1.5 rounded-full bg-brand-bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${g.progress || 0}%`, background: GOAL_STATUS_COLORS[g.status] || '#6366f1' }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Open Positions ────────────────────────────────────────────────────────────

interface OpenPosition { location: string; count: number; }

function OpenPositionsCard({ locale }: { locale: string }) {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);

  useEffect(() => {
    apiCallFunction<{ data: unknown[] }>({
      url: `${API_BASE_URL}/hr/jobs`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => {
        const jobs = res?.data || [];
        const byLocation: Record<string, number> = {};
        jobs.forEach((j: unknown) => {
          const loc = (j as { location?: string }).location || 'Other';
          byLocation[loc] = (byLocation[loc] || 0) + 1;
        });
        setPositions(Object.entries(byLocation).map(([location, count]) => ({ location, count })));
        setTotalApplicants(jobs.length * 3); // placeholder
      },
    });
  }, []);

  return (
    <Card className="mt-3">
      <SectionHeader title="Open Positions" action="/recruitment" actionLabel="View recruitment" />
      {positions.length === 0 ? (
        <p className="text-[12px] text-brand-text-muted py-2">No open positions.</p>
      ) : (
        <div className="space-y-2">
          {positions.map(p => (
            <div key={p.location} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-1.5 text-brand-text-secondary">
                <MapPin className="h-3.5 w-3.5 text-brand-text-muted" /> {p.location}
              </div>
              <span className="font-semibold text-indigo-400">{p.count}</span>
            </div>
          ))}
          <div className="text-[12px] text-brand-text-muted pt-1 border-t border-brand-border">
            {totalApplicants} applicants this month
          </div>
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WELCOME OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

function WelcomeOverlay({ name, locale, onDismiss }: { name: string; locale: string; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.95)' }}>
      {/* Confetti dots */}
      {[...Array(20)].map((_, i) => (
        <span key={i} className="absolute h-2 w-2 rounded-full opacity-70 animate-bounce"
          style={{
            background: ['#6366f1','#22c55e','#f59e0b','#ec4899','#3b82f6'][i % 5],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${1 + Math.random()}s`,
          }} />
      ))}
      <div className="w-full max-w-[560px] rounded-2xl p-8 text-center space-y-4 relative z-10" style={{ background: '#1e293b' }}>
        <div className="h-16 w-16 rounded-2xl bg-brand-primary flex items-center justify-center mx-auto text-3xl">
          🎉
        </div>
        <h1 className="text-[28px] font-bold text-brand-text">Welcome to Bela ERP, {name}!</h1>
        <p className="text-brand-text-secondary text-[14px]">Your account is set up and ready to go. Let&apos;s get started.</p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href={`/${locale}/onboarding`} onClick={onDismiss}
            className="h-12 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
            <CheckCircle className="h-4 w-4" /> View Onboarding
          </Link>
          <button onClick={onDismiss}
            className="h-12 rounded-xl border border-brand-border-strong text-brand-text-secondary hover:bg-brand-bg-muted font-medium text-[14px] flex items-center justify-center gap-2 transition-colors">
            <Star className="h-4 w-4" /> Explore Platform
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const { userData, isHR, isDeptHead } = useAuth();
  const locale = useLocale();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [schedule, setSchedule] = useState<TodaySchedule | null>(null);
  const [pending, setPending] = useState<PendingActions | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<LiveAttendance | null>(null);
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const liveRefTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(<T,>(path: string, setter: (d: T) => void) => {
    apiCallFunction<{ data: T }>({
      url: `${API_BASE_URL}/dashboard/${path}`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => { if (res?.data != null) setter(res.data); },
    });
  }, []);

  const loadLive = useCallback(() => {
    load<LiveAttendance>('attendance-live', setLiveAttendance);
  }, [load]);

  useEffect(() => {
    load<Summary>('summary', setSummary);
    load<TodaySchedule>('today-schedule', setSchedule);
    load<PendingActions>('pending-actions', setPending);
    load<FeedPost[]>('feed-preview', setPosts);
    load<Event[]>('upcoming-events', setEvents);
    load<Celebration[]>('celebrations', setCelebrations);
    load<GoalsSummary>('goals-summary', setGoalsSummary);

    if (isHR) {
      loadLive();
      liveRefTimer.current = setInterval(loadLive, 30000);
    }

    // Show welcome overlay for new employees (first time)
    if (userData && !localStorage.getItem('hasSeenWelcome')) {
      const role = userData.role;
      if (role === 'staff') {
        setShowWelcome(true);
        localStorage.setItem('hasSeenWelcome', 'true');
      }
    }

    return () => { if (liveRefTimer.current) clearInterval(liveRefTimer.current); };
  }, [isHR, load, loadLive, userData]);

  const firstName = userData?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-full" style={{ background: '#0f172a' }}>
      {showWelcome && (
        <WelcomeOverlay name={firstName} locale={locale} onDismiss={() => setShowWelcome(false)} />
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-brand-text">
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {firstName} 👋
        </h1>
        <p className="text-[13px] text-brand-text-secondary mt-0.5">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '280px 1fr 300px' }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          <ClockInWidget />
          <TodayScheduleCard schedule={schedule} />
          <QuickStatsCard summary={summary} />
        </div>

        {/* ── CENTER COLUMN ── */}
        <div>
          <PendingActionsBanner pending={pending} locale={locale} />
          <InboxPreviewCard locale={locale} />
          <FeedPreviewCard posts={posts} celebrations={celebrations} locale={locale} />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          {isHR && <LiveAttendanceCard data={liveAttendance} onRefresh={loadLive} locale={locale} />}
          <EventsCard events={events} locale={locale} />
          {!isHR && <GoalsSummaryCard goals={goalsSummary} locale={locale} />}
          {isHR && <OpenPositionsCard locale={locale} />}
        </div>
      </div>
    </div>
  );
}
