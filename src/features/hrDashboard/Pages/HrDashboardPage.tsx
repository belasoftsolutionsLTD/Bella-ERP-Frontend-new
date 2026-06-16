'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useHrDashboard } from '../Hooks/useHrDashboard';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { cn } from '@/lib/utils';
import {
  Users, Calendar, CheckSquare, Briefcase,
  ClipboardList, AlertTriangle, UserPlus, TrendingUp, ChevronDown,
} from 'lucide-react';

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316'];
const FONT   = 'system-ui, -apple-system, sans-serif';

// Criticality colour: red <50 %, orange 50-79 %, green 80-100 %
function critColor(pct: number): string {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

// ── Vertical bar chart (X = categories, Y = values) ──────────────────────────
function BarChart({
  data, width = 500, height = 240,
  barColor = '#6366f1', multiColor = false, criticalityMax,
}: {
  data: { label: string; value: number }[];
  width?: number; height?: number;
  barColor?: string; multiColor?: boolean;
  /** When set, each bar is coloured by critColor(value/criticalityMax*100) */
  criticalityMax?: number;
}) {
  if (!data.length) return <p className="text-xs text-center text-foreground/40 py-6">No data</p>;

  const mt = 20, mb = 52, ml = 44, mr = 16;
  const cw = width - ml - mr;
  const ch = height - mt - mb;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const yMax = Math.ceil(maxVal / 5) * 5 || 5;
  const yTicks = 5;
  const barW = Math.max(10, (cw / data.length) * 0.55);
  const gap  = cw / data.length;

  const yPx = (v: number) => ch - (v / yMax) * ch;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ overflow: 'visible' }}>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (yMax / yTicks) * i;
        const y = mt + yPx(v);
        return (
          <g key={i}>
            <line x1={ml} y1={y} x2={ml + cw} y2={y}
              stroke={i === 0 ? '#9ca3af' : '#e5e7eb'} strokeWidth={i === 0 ? 1.5 : 1} />
            <text x={ml - 6} y={y + 4} textAnchor="end"
              fontSize={10} fill="#9ca3af" fontFamily={FONT}>{v}</text>
          </g>
        );
      })}

      <line x1={ml} y1={mt} x2={ml} y2={mt + ch + 1} stroke="#d1d5db" strokeWidth={1.5} />

      {data.map((d, i) => {
        const x  = ml + i * gap + gap / 2 - barW / 2;
        const bh = (d.value / yMax) * ch;
        const by = mt + ch - bh;
        const col = criticalityMax != null
          ? critColor((d.value / criticalityMax) * 100)
          : multiColor ? COLORS[i % COLORS.length] : barColor;
        const labelAngle = data.length > 6 ? -38 : 0;
        const labelX = ml + i * gap + gap / 2;
        const labelY = mt + ch + 16;
        return (
          <g key={d.label}>
            <rect x={x} y={by} width={barW} height={bh} rx={4} fill={col}>
              <animate attributeName="height" from="0" to={bh} dur="0.5s" fill="freeze" />
              <animate attributeName="y" from={mt + ch} to={by} dur="0.5s" fill="freeze" />
            </rect>
            {bh > 12 && (
              <text x={x + barW / 2} y={by - 4} textAnchor="middle"
                fontSize={10} fontWeight="700" fill={col} fontFamily={FONT}>{d.value}</text>
            )}
            <text
              x={labelX} y={labelY}
              textAnchor={labelAngle ? 'end' : 'middle'}
              fontSize={10} fill="#6b7280" fontFamily={FONT}
              transform={labelAngle ? `rotate(${labelAngle}, ${labelX}, ${labelY})` : undefined}
            >
              {d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}


// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-5 flex items-center gap-4">
      <div className="rounded-xl p-3 shrink-0" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground leading-none">{value}</p>
        <p className="text-xs font-semibold text-foreground/60 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-foreground/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; color: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="font-bold text-sm text-foreground flex-1 text-left">{title}</span>
        <ChevronDown className={cn('h-4 w-4 text-foreground/30 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="px-5 pb-5 border-t pt-4 space-y-4">{children}</div>}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function HrDashboardPage() {
  const t = useTranslations('HrDashboard');
  const { data, loading, error, refetch } = useHrDashboard();

  return (
    <Wrapper loading={loading} error={error} onRetry={refetch}>
      {data && (
        <div className="space-y-4 pb-6">

          <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>

          {/* ── KPI strip (always visible) ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users}       label={t('totalHeadcount')}  value={data.totalHeadcount}
              sub={`${data.teachingVsNonTeaching.teaching}T · ${data.teachingVsNonTeaching.nonTeaching}NT`}
              color="#6366f1" />
            <KpiCard icon={Calendar}    label={t('pendingLeave')}    value={data.pendingLeaveRequests.count}
              sub={t('awaitingApproval')} color="#f59e0b" />
            <KpiCard icon={CheckSquare} label={t('attendanceRate')}  value={`${data.attendanceRateThisWeek}%`}
              sub={t('thisWeek')} color={critColor(data.attendanceRateThisWeek)} />
            <KpiCard icon={Briefcase}   label={t('openPositions')}   value={data.positionsSummary.open}
              sub={`${data.positionsSummary.filled} filled · ${data.positionsSummary.frozen} frozen`}
              color="#8b5cf6" />
          </div>

          {/* ── WORKFORCE ──────────────────────────────────────────────── */}
          <Section title="Workforce" icon={Users} color="#6366f1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">{t('byDepartment')} — {t('employeesPerDept')}</p>
                <BarChart multiColor
                  data={data.headcountByDepartment.map(d => ({ label: d.department, value: d.count }))}
                  width={520} height={220} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">{t('staffComposition')}</p>
                <BarChart multiColor
                  data={[
                    { label: t('teaching'),    value: data.teachingVsNonTeaching.teaching },
                    { label: t('nonTeaching'), value: data.teachingVsNonTeaching.nonTeaching },
                  ]}
                  width={200} height={180} />
              </div>
            </div>

            {/* New hires inside workforce */}
            <div>
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5 text-emerald-500" /> {t('newHires')} this month
              </p>
              {(data.newHiresThisMonth as any[]).length === 0
                ? <p className="text-xs text-foreground/40 py-2">{t('noNewHires')}</p>
                : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(data.newHiresThisMonth as any[]).map((h: any, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                        <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-xs font-black text-emerald-700">
                          {(h.fullName ?? '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{h.fullName}</p>
                          <p className="text-[10px] text-foreground/40">{h.designation || h.department || 'Staff'}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">{t('newBadge')}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </Section>

          {/* ── ATTENDANCE & LEAVE ──────────────────────────────────────── */}
          <Section title="Attendance & Leave" icon={Calendar} color="#f59e0b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">{t('attendanceRate')} — {t('thisWeekVsTarget')}</p>
                <BarChart width={280} height={200} criticalityMax={100}
                  data={[
                    { label: t('thisWeek'), value: data.attendanceRateThisWeek },
                    { label: 'Target',      value: 100 },
                  ]} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">
                  Pending Leave Requests — {data.pendingLeaveRequests.count} awaiting approval
                </p>
                {(data.pendingLeaveRequests as any).requests?.length > 0
                  ? <div className="space-y-2">
                      {(data.pendingLeaveRequests as any).requests.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-100 bg-amber-50">
                          <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-xs font-black text-amber-700">
                            {(r.employeeName ?? '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{r.employeeName}</p>
                            <p className="text-[10px] text-foreground/40 capitalize">{(r.leaveType ?? '').replace('_',' ')} · {r.numberOfDays ?? ''} day{r.numberOfDays !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 bg-white border border-amber-200 px-2 py-0.5 rounded-full shrink-0">Pending</span>
                        </div>
                      ))}
                    </div>
                  : <p className="text-xs text-foreground/40 py-2">No pending leave requests.</p>
                }
              </div>
            </div>
          </Section>

          {/* ── RECRUITMENT & ONBOARDING ────────────────────────────────── */}
          <Section title="Recruitment & Onboarding" icon={Briefcase} color="#8b5cf6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">{t('positionsSummary')} — {t('openFilledFrozen')}</p>
                <BarChart multiColor width={280} height={200}
                  data={[
                    { label: t('openPositions'),   value: data.positionsSummary.open   },
                    { label: t('filledPositions'), value: data.positionsSummary.filled },
                    { label: t('frozenPositions'), value: data.positionsSummary.frozen },
                  ]} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-500" /> {t('onboardingProgress')}
                </p>
                {data.onboardingProgress.length === 0
                  ? <p className="text-xs text-foreground/40 py-2">{t('noActiveOnboarding')}</p>
                  : <BarChart width={280} height={200} criticalityMax={100}
                      data={data.onboardingProgress.slice(0, 6).map(e => ({
                        label: `…${String(e.employeeId).slice(-5)}`,
                        value: e.percentage,
                      }))} />
                }
              </div>
            </div>
          </Section>

          {/* ── PERFORMANCE & COMPLIANCE ────────────────────────────────── */}
          <Section title="Performance & Compliance" icon={TrendingUp} color="#ef4444" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-500" /> {t('performanceConcerns')}
                </p>
                {(data.performanceConcerns as any[]).length === 0
                  ? <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">{t('allOnTrack')}</p>
                    </div>
                  : <div className="space-y-2">
                      {(data.performanceConcerns as any[]).map((c: any, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-700">{c.fullName ?? c.employeeId}</p>
                            <p className="text-[10px] text-red-400">{c.concern ?? t('flaggedForReview')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> {t('expiringContracts')}
                </p>
                {data.expiringContracts.length === 0
                  ? <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">{t('noExpiringContracts')}</p>
                    </div>
                  : <div className="space-y-2">
                      {data.expiringContracts.map(c => {
                        const col = c.daysRemaining <= 14 ? '#ef4444' : c.daysRemaining <= 30 ? '#f59e0b' : '#6366f1';
                        return (
                          <div key={c.staffNumber} className="flex items-center gap-3 p-2.5 rounded-xl"
                            style={{ background: `${col}08`, border: `1px solid ${col}20` }}>
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                              style={{ background: `${col}15`, color: col }}>
                              {(c.fullName ?? '?').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{c.fullName}</p>
                              <p className="text-[10px] text-foreground/40">{c.staffNumber}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: `${col}15`, color: col }}>{c.daysRemaining}d left</span>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            </div>
          </Section>

        </div>
      )}
    </Wrapper>
  );
}
