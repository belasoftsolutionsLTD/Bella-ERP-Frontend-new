'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Users, Calendar, CheckSquare, Briefcase, AlertTriangle,
  UserPlus, Clock, TrendingUp, ChevronRight, FileText, Building2,
  ClipboardList, BarChart2, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { useHrDashboard } from '../Hooks/useHrDashboard';
import { useAuth } from '@/hooks/useAuth';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Ring({ pct, size = 92, stroke = 7, color = '#6366f1' }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ - (Math.min(100, Math.max(0, pct)) / 100) * circ}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function KpiTile({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}22` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-100 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionLabel({ icon: Icon, title, color = 'text-slate-400' }: {
  icon: React.ElementType;
  title: string;
  color?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', color)}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[11px] font-bold uppercase tracking-widest">{title}</span>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function HrDashboardPage() {
  const { userData } = useAuth();
  const locale = useLocale();
  const { data, loading, error, refetch } = useHrDashboard();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const workStart = 8 * 60;
  const workEnd   = 17 * 60;
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const workPct   = Math.min(100, Math.max(0, Math.round(((nowMins - workStart) / (workEnd - workStart)) * 100)));
  const timeStr   = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  const dateStr   = now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });

  const firstName = userData?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-5 pb-6">

      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{getGreeting()}, {firstName}!</h1>
        <p className="text-sm text-slate-400 mt-0.5">{dateStr}</p>
      </div>

      <Wrapper loading={loading} error={error} onRetry={refetch}>
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr_240px] gap-5 items-start">

            {/* ══ LEFT ════════════════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* Time & Attendance */}
              <div className="space-y-2">
                <SectionLabel icon={Clock} title="Time & Attendance" color="text-indigo-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm p-5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <Ring pct={workPct} size={96} stroke={7} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold text-slate-100 tabular-nums leading-tight">{timeStr}</span>
                        <span className="text-[10px] text-slate-400">{workPct}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">{dateStr}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>08:00</span>
                      <span className="text-indigo-400 font-semibold">Workday</span>
                      <span>17:00</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${workPct}%` }}
                      />
                    </div>
                    <Link
                      href={`/${locale}/attendance`}
                      className="mt-2 w-full flex items-center justify-center gap-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-900/50"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Manage Attendance
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              <div className="space-y-2">
                <SectionLabel icon={ChevronRight} title="Quick Access" color="text-slate-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm p-2">
                  {[
                    { label: 'People',         href: `/${locale}/employees`,  icon: Users },
                    { label: 'Leave Requests', href: `/${locale}/leave`,       icon: Calendar },
                    { label: 'Attendance',     href: `/${locale}/attendance`,  icon: Clock },
                    { label: 'Payroll',        href: `/${locale}/payroll`,     icon: FileText },
                    { label: 'Recruitment',    href: `/${locale}/recruitment`, icon: Briefcase },
                    { label: 'Onboarding',     href: `/${locale}/onboarding`,  icon: ClipboardList },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label} href={href}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors group"
                    >
                      <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                      <span className="flex-1">{label}</span>
                      <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-indigo-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ CENTER ══════════════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* Workforce Overview */}
              <div className="space-y-2">
                <SectionLabel icon={Users} title="Workforce Overview" color="text-indigo-400" />
                <div className="grid grid-cols-2 gap-4">
                  <KpiTile
                    icon={Users} label="Headcount" color="#6366f1"
                    value={data.totalHeadcount}
                    sub={`${data.teachingVsNonTeaching.teaching}T · ${data.teachingVsNonTeaching.nonTeaching}NT`}
                  />
                  <KpiTile
                    icon={CheckSquare} label="Attendance Rate"
                    color={data.attendanceRateThisWeek >= 80 ? '#10b981' : data.attendanceRateThisWeek >= 50 ? '#f59e0b' : '#ef4444'}
                    value={`${data.attendanceRateThisWeek}%`}
                    sub="this week"
                  />
                  <KpiTile
                    icon={Calendar} label="Pending Leave" color="#f59e0b"
                    value={data.pendingLeaveRequests.count}
                    sub="awaiting approval"
                  />
                  <KpiTile
                    icon={Briefcase} label="Open Positions" color="#8b5cf6"
                    value={data.positionsSummary.open}
                    sub={`${data.positionsSummary.filled} filled · ${data.positionsSummary.frozen} frozen`}
                  />
                </div>
              </div>

              {/* Leave Management */}
              <div className="space-y-2">
                <SectionLabel icon={Calendar} title="Leave Management" color="text-amber-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
                    <p className="text-sm font-bold text-slate-100">Pending Leave Requests</p>
                    <Link
                      href={`/${locale}/leave`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
                    >
                      View all <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  {(data.pendingLeaveRequests as any).requests?.length > 0 ? (
                    <div className="divide-y divide-slate-700/40">
                      {(data.pendingLeaveRequests as any).requests.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                          <div className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                            avatarColor(r.employeeName ?? ''),
                          )}>
                            {(r.employeeName ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100 truncate">{r.employeeName}</p>
                            <p className="text-xs text-slate-400 capitalize">
                              {(r.leaveType ?? '').replace('_', ' ')} · {r.numberOfDays ?? ''} day{r.numberOfDays !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-semibold border border-amber-500/30 shrink-0">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <CheckSquare className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-300">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-0.5">No pending leave requests.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recruitment & Onboarding */}
              <div className="space-y-2">
                <SectionLabel icon={UserPlus} title="Recruitment & Onboarding" color="text-emerald-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/40">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-sm font-bold text-slate-100">New Hires This Month</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      {(data.newHiresThisMonth as any[]).length}
                    </span>
                  </div>
                  {(data.newHiresThisMonth as any[]).length === 0 ? (
                    <div className="px-5 py-6 text-center">
                      <p className="text-sm text-slate-400">No new hires this month.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/40">
                      {(data.newHiresThisMonth as any[]).slice(0, 4).map((h: any, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                          <div className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                            avatarColor(h.fullName ?? ''),
                          )}>
                            {(h.fullName ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100 truncate">{h.fullName}</p>
                            <p className="text-xs text-slate-400">{h.designation || h.department || 'New staff'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 shrink-0">
                            New
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ RIGHT ═══════════════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* HR Snapshot */}
              <div className="space-y-2">
                <SectionLabel icon={BarChart2} title="HR Snapshot" color="text-violet-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'On Leave',   value: data.pendingLeaveRequests.count,  cls: 'bg-blue-500/15 text-blue-400' },
                      { label: 'Headcount',  value: data.totalHeadcount,              cls: 'bg-violet-500/15 text-violet-400' },
                      { label: 'Attendance', value: `${data.attendanceRateThisWeek}%`, cls: 'bg-emerald-500/15 text-emerald-400' },
                      { label: 'Open Roles', value: data.positionsSummary.open,        cls: 'bg-orange-500/15 text-orange-400' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={cn('rounded-lg px-3 py-3 text-center', cls)}>
                        <p className="text-xl font-black leading-none">{value}</p>
                        <p className="text-[10px] font-semibold mt-1 opacity-80">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alerts & Actions */}
              <div className="space-y-2">
                <SectionLabel icon={Bell} title="Alerts & Actions" color="text-red-400" />

                {/* Expiring contracts */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/40">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    <p className="text-xs font-bold text-slate-300">Expiring Contracts</p>
                  </div>
                  {data.expiringContracts.length === 0 ? (
                    <div className="px-4 py-4 text-center">
                      <CheckSquare className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">None expiring soon.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/40">
                      {data.expiringContracts.slice(0, 4).map(c => (
                        <div key={c.staffNumber} className="flex items-center gap-2.5 px-4 py-2.5">
                          <div className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                            avatarColor(c.fullName ?? ''),
                          )}>
                            {(c.fullName ?? '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-100 truncate">{c.fullName}</p>
                            <p className="text-[10px] text-slate-400">{c.staffNumber}</p>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                            c.daysRemaining <= 14 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400',
                          )}>
                            {c.daysRemaining}d
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance flags */}
                {(data.performanceConcerns as any[]).length > 0 && (
                  <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/40">
                      <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                      <p className="text-xs font-bold text-slate-300">Performance Flags</p>
                    </div>
                    <div className="divide-y divide-slate-700/40">
                      {(data.performanceConcerns as any[]).slice(0, 3).map((c: any, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{c.fullName ?? c.employeeId}</p>
                            <p className="text-[10px] text-slate-400 truncate">{c.concern ?? 'Flagged for review'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <SectionLabel icon={Building2} title="By Department" color="text-indigo-400" />
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/60 shadow-sm">
                  <div className="px-4 py-3 space-y-2.5">
                    {data.headcountByDepartment.slice(0, 6).map(d => {
                      const pct = data.totalHeadcount > 0
                        ? Math.round((d.count / data.totalHeadcount) * 100) : 0;
                      return (
                        <div key={d.department} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">{d.department}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{d.count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </Wrapper>
    </div>
  );
}
