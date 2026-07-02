'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, TrendingUp, Clock, CheckCircle2, Download,
  RefreshCw, Loader2, ChevronUp, ChevronDown, DollarSign,
  Calendar, UserPlus, ClipboardList, AlertCircle, Search, X,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Overview {
  month: number; year: number;
  employees:   { total: number; active: number };
  attendance:  { rate: number; avgHoursPerDay: number };
  appraisals:  { avgRating: number; total: number };
  recruitment: { openPositions: number; totalApplicants: number };
  leave:       { pendingRequests: number };
  onboarding:  { completed: number; total: number };
  payroll:     { totalGross: number; totalNet: number; headcount: number };
}

interface AttEmp { employeeName:string; staffNumber:string; department:string; present:number; absent:number; late:number; halfDay:number; totalHours:number; avgHours:number }
interface AttReport { month:number; year:number; employees: AttEmp[] }

interface PayEmp { employeeName:string; staffNumber:string; department:string; grossPay:number; netPay:number; paye:number; sha:number; nssf:number; paymentStatus:string; paidAt:string|null }
interface PayReport { month:number; year:number; employees:PayEmp[]; totals:{ gross:number; net:number; paye:number; headcount:number }; byDepartment:Record<string,{gross:number;net:number;count:number}> }

interface LeaveByType { total:number; approved:number; pending:number; rejected:number; days:number }
interface LeaveEmp { employeeName:string; staffNumber:string; department:string; totalRequests:number; approved:number; pending:number; totalDaysTaken:number; annualRemaining:number|null; sickRemaining:number|null }
interface LeaveReq { _id:string; employeeName:string; staffNumber:string; department:string; leaveType:string; startDate:string; endDate:string; numberOfDays:number; status:string; reason:string; createdAt:string }
interface LeaveReport { year:number; byType:Record<string,LeaveByType>; employees:LeaveEmp[]; requests:LeaveReq[] }

interface RecruitPos { jobTitle:string; department:string; status:string; openings:number; filled:number; applications:number; shortlisted:number; hired:number }
interface RecruitReport { summary:{ totalPositions:number; openPositions:number; filledPositions:number; totalApplicants:number }; byStage:Record<string,number>; byPosition:RecruitPos[] }

interface OnboardEmp { employeeName:string; staffNumber:string; department:string; completed:number; total:number; overdue:number; pct:number }

interface PerfEmp { employeeName:string; staffNumber:string; department:string; reviewCount:number; avgScore:number|null; latestScore:number|null; latestReview:string|null; reviewPeriod:string|null }

interface ExpClaimEmp { employeeName:string; staffNumber:string; department:string; totalClaims:number; approvedCount:number; pendingCount:number; rejectedCount:number; totalApproved:number; totalSubmitted:number; violations:number }
interface ExpClaimReport { year:number; month:number|null; summary:{ total:number; totalAmount:number; approvedAmount:number; violations:number; byStatus:Record<string,{count:number;amount:number}> }; byCategory:Record<string,{count:number;amount:number}>; employees:ExpClaimEmp[] }

interface AwardEmp { employeeName:string; staffNumber:string; department:string; count:number; awards:string[] }
interface AwardsReport { year:number; summary:{ total:number; uniqueRecipients:number }; byType:Record<string,number>; byDepartment:Record<string,number>; employees:AwardEmp[] }

interface DeviceItem { name:string; type:string; brand:string; serialNumber:string; status:string; condition:string; assigneeName:string; assigneeDepartment:string; purchaseDate:string|null; purchasePrice:number|null; warrantyExpiry:string|null }
interface SoftwareItem { name:string; category:string; vendor:string; licenseType:string; totalLicenses:number; assignedLicenses:number; costPerLicense:number; billingCycle:string; renewalDate:string|null; status:string }
interface ITReport { devices:{ total:number; assigned:number; unassigned:number; byCategory:Record<string,{total:number;assigned:number;unassigned:number}>; byStatus:Record<string,number>; list:DeviceItem[] }; software:{ totalApps:number; totalLicenses:number; usedLicenses:number; list:SoftwareItem[] } }

interface SpendItem { _id:string; description:string; category:string; amount:number; currency:string; date:string; vendor:string; paymentMethod:string; recordedBy:string }
interface SpendReport { year:number; month:number|null; summary:{ total:number; totalAmount:number; byCategory:Record<string,{count:number;amount:number}> }; expenses:SpendItem[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const KES = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

function exportCSV(filename: string, headers: string[], rows: (string|number|null)[]) {
  const lines = [headers.join(','), ...rows.map((r: unknown) =>
    (r as (string|number|null)[]).map(v => `"${v ?? ''}"`).join(',')
  )];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function useSortable<T>(items: T[]) {
  const [key, setKey] = useState('');
  const [asc, setAsc] = useState(true);
  const toggle = (k: string) => { if (key === k) setAsc(a => !a); else { setKey(k); setAsc(true); } };
  const sorted = [...items].sort((a, b) => {
    const va = (a as Record<string,unknown>)[key] ?? '';
    const vb = (b as Record<string,unknown>)[key] ?? '';
    return asc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
  });
  const Icon = ({ k }: { k: string }) => key === k
    ? (asc ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>)
    : <ChevronUp className="h-3 w-3 opacity-20"/>;
  return { sorted, toggle, Icon };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, wide }: {
  icon: React.ElementType; label: string; value: string|number; sub?: string; color: string; wide?: boolean;
}) {
  return (
    <div className={cn('bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 flex items-start gap-4', wide && 'col-span-2')}>
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="h-5 w-5"/>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{label}</p>
        <p className="text-2xl font-black text-slate-100 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Th({ children, k, toggle, Icon }: { children: React.ReactNode; k: string; toggle:(k:string)=>void; Icon: React.ComponentType<{k:string}> }) {
  return (
    <th onClick={() => toggle(k)}
      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 select-none whitespace-nowrap">
      <div className="flex items-center gap-1">{children}<Icon k={k}/></div>
    </th>
  );
}

function ScoreBadge({ score, max=5 }: { score: number|null; max?: number }) {
  if (score == null) return <span className="text-slate-600 text-xs">—</span>;
  const ratio = score / max;
  const color = ratio >= 0.8 ? 'text-emerald-400 bg-emerald-500/20' : ratio >= 0.6 ? 'text-amber-400 bg-amber-500/20' : 'text-rose-400 bg-rose-500/20';
  return <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', color)}>{score.toFixed(1)} / {max}</span>;
}

function ProgressBar({ pct, color='bg-indigo-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, pct)}%` }}/>
      </div>
      <span className="text-[10px] text-slate-500 w-7 text-right">{pct}%</span>
    </div>
  );
}

function TableWrap({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/60 text-xs text-slate-500 flex items-center justify-between">{footer}</div>}
    </div>
  );
}

function Loading() {
  return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500/40"/></div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center py-20 text-slate-600 text-sm">{msg}</div>;
}

// ── Month/Year picker ─────────────────────────────────────────────────────────

function MonthYearPicker({ month, year, onMonth, onYear, onRefresh, children }:
  { month:number; year:number; onMonth:(n:number)=>void; onYear:(n:number)=>void; onRefresh:()=>void; children?: React.ReactNode }) {
  const now = new Date();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select value={month} onChange={e => onMonth(+e.target.value)}
        className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
      <select value={year} onChange={e => onYear(+e.target.value)}
        className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
        <RefreshCw className="h-3.5 w-3.5"/> Refresh
      </button>
      {children}
    </div>
  );
}

// ── Filter bar (reused across all tabs) ──────────────────────────────────────

function FilterBar({ search, onSearch, depts, filterDept, onDept, extra, onClear, active }: {
  search: string; onSearch: (v: string) => void;
  depts: string[]; filterDept: string; onDept: (v: string) => void;
  extra?: React.ReactNode; onClear: () => void; active: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or staff ID…"
          className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      {depts.length > 0 && (
        <select value={filterDept} onChange={e => onDept(e.target.value)}
          className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {extra}
      {active && (
        <button onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl px-3 h-9 bg-slate-800 hover:bg-slate-700">
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'insights',       label: 'Insights'       },
  { key: 'overview',       label: 'Overview'       },
  { key: 'attendance',     label: 'Attendance'     },
  { key: 'payroll',        label: 'Payroll'        },
  { key: 'leave',          label: 'Leave'          },
  { key: 'recruitment',    label: 'Recruitment'    },
  { key: 'onboarding',     label: 'Onboarding'     },
  { key: 'performance',    label: 'Performance'    },
  { key: 'expense-claims', label: 'Expenses'       },
  { key: 'awards',         label: 'Awards'         },
  { key: 'it-assets',      label: 'IT Assets'      },
  { key: 'spending',       label: 'Spending'       },
] as const;
type Tab = typeof TABS[number]['key'];

export default function ReportsPage() {
  const now = new Date();
  const [tab,   setTab]   = useState<Tab>('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const [overview,      setOverview]      = useState<Overview|null>(null);
  const [attendance,    setAttendance]    = useState<AttReport|null>(null);
  const [payroll,       setPayroll]       = useState<PayReport|null>(null);
  const [leave,         setLeave]         = useState<LeaveReport|null>(null);
  const [recruitment,   setRecruitment]   = useState<RecruitReport|null>(null);
  const [onboarding,    setOnboarding]    = useState<OnboardEmp[]>([]);
  const [performance,   setPerformance]   = useState<PerfEmp[]>([]);
  const [expClaims,     setExpClaims]     = useState<ExpClaimReport|null>(null);
  const [awards,        setAwards]        = useState<AwardsReport|null>(null);
  const [itAssets,      setItAssets]      = useState<ITReport|null>(null);
  const [spending,      setSpending]      = useState<SpendReport|null>(null);

  const load = useCallback((endpoint: string, setter: (d: unknown) => void, params = '') => {
    setLoading(true);
    apiCallFunction<{ data: unknown }>({
      url: `${API_BASE_URL}/reports/${endpoint}${params}`,
      showToast: false,
      thenFn: r => setter(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load('overview', d => setOverview(d as Overview)); }, [load]);
  const mp = `?month=${month}&year=${year}`;
  const fetchTab = useCallback(() => {
    if (tab === 'insights') {
      load('payroll',     d => setPayroll(d as PayReport),         mp);
      load('leave',       d => setLeave(d as LeaveReport),         `?year=${year}`);
      load('recruitment', d => setRecruitment(d as RecruitReport), '');
      load('performance', d => setPerformance(d as PerfEmp[]),     '');
    }
    if (tab === 'attendance')     load('attendance',     d => setAttendance(d as AttReport),          mp);
    if (tab === 'payroll')        load('payroll',        d => setPayroll(d as PayReport),              mp);
    if (tab === 'leave')          load('leave',          d => setLeave(d as LeaveReport),              `?year=${year}`);
    if (tab === 'recruitment')    load('recruitment',    d => setRecruitment(d as RecruitReport),      '');
    if (tab === 'onboarding')     load('onboarding',     d => setOnboarding(d as OnboardEmp[]),        '');
    if (tab === 'performance')    load('performance',    d => setPerformance(d as PerfEmp[]),          '');
    if (tab === 'expense-claims') load('expense-claims', d => setExpClaims(d as ExpClaimReport),       `?year=${year}`);
    if (tab === 'awards')         load('awards',         d => setAwards(d as AwardsReport),            `?year=${year}`);
    if (tab === 'it-assets')      load('it-assets',      d => setItAssets(d as ITReport),              '');
    if (tab === 'spending')       load('spending',        d => setSpending(d as SpendReport),           `?year=${year}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, month, year]);
  useEffect(() => { if (tab !== 'overview') fetchTab(); }, [tab, fetchTab]);

  // ── Overview ────────────────────────────────────────────────────────────────
  const ov = overview;

  // ── Shared filter state (reset on tab change) ────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [filterDept,      setFilterDept]      = useState('');
  const [payStatusFilter,   setPayStatusFilter]   = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');
  const [leaveTypeFilter,   setLeaveTypeFilter]   = useState('');
  const [recStatusFilter,   setRecStatusFilter]   = useState('');
  const [expStatusFilter,   setExpStatusFilter]   = useState('');
  const [itView,            setItView]            = useState<'devices'|'software'>('devices');
  const [leaveView,         setLeaveView]         = useState<'summary' | 'requests'>('requests');

  useEffect(() => {
    setSearch(''); setFilterDept('');
    setPayStatusFilter(''); setLeaveStatusFilter(''); setLeaveTypeFilter(''); setRecStatusFilter('');
    setExpStatusFilter('');
  }, [tab]);

  // ── Unique departments from current tab data ──────────────────────────────────
  const depts = useMemo(() => {
    const all: string[] = [];
    if (tab === 'attendance'     && attendance)  all.push(...attendance.employees.map(e => e.department));
    if (tab === 'payroll'        && payroll)     all.push(...payroll.employees.map(e => e.department));
    if (tab === 'leave'          && leave)       { all.push(...leave.employees.map(e => e.department)); all.push(...(leave.requests ?? []).map(r => r.department)); }
    if (tab === 'recruitment'    && recruitment) all.push(...recruitment.byPosition.map(p => p.department));
    if (tab === 'onboarding')    all.push(...onboarding.map(e => e.department));
    if (tab === 'performance')   all.push(...performance.map(e => e.department));
    if (tab === 'expense-claims' && expClaims)  all.push(...expClaims.employees.map(e => e.department));
    if (tab === 'awards'         && awards)      all.push(...awards.employees.map(e => e.department));
    if (tab === 'it-assets'      && itAssets)    all.push(...itAssets.devices.list.map(d => d.assigneeDepartment).filter(d => d !== '—'));
    return [...new Set(all.filter(Boolean))].sort();
  }, [tab, attendance, payroll, leave, recruitment, onboarding, performance, expClaims, awards, itAssets]);

  // ── Unique leave types for leave filter ───────────────────────────────────────
  const leaveTypes = useMemo(() => [...new Set((leave?.requests ?? []).map(r => r.leaveType).filter(Boolean))].sort(), [leave]);

  const q = search.toLowerCase();
  const matchEmp  = (name: string, staffNo?: string) => !q || name.toLowerCase().includes(q) || (staffNo ?? '').toLowerCase().includes(q);
  const matchDept = (dept: string) => !filterDept || dept === filterDept;

  const attFiltered      = (attendance?.employees ?? []).filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber));
  const payFiltered      = (payroll?.employees ?? []).filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber) && (!payStatusFilter || e.paymentStatus === payStatusFilter));
  const leaveEmpFiltered = (leave?.employees ?? []).filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber));
  const leaveReqFiltered = (leave?.requests ?? []).filter(r => matchDept(r.department) && matchEmp(r.employeeName, r.staffNumber) && (!leaveStatusFilter || r.status === leaveStatusFilter) && (!leaveTypeFilter || r.leaveType === leaveTypeFilter));
  const recFiltered      = (recruitment?.byPosition ?? []).filter(p => matchDept(p.department) && (!recStatusFilter || p.status === recStatusFilter) && (!q || p.jobTitle.toLowerCase().includes(q)));
  const obFiltered       = onboarding.filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber));
  const perfFiltered     = performance.filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber));
  const expFiltered      = (expClaims?.employees ?? []).filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber) && (!expStatusFilter || (expStatusFilter === 'violations' ? e.violations > 0 : false)));
  const awardsFiltered   = (awards?.employees ?? []).filter(e => matchDept(e.department) && matchEmp(e.employeeName, e.staffNumber));
  const devFiltered      = (itAssets?.devices.list ?? []).filter(d => matchDept(d.assigneeDepartment) && (!q || d.name.toLowerCase().includes(q) || d.serialNumber.toLowerCase().includes(q) || d.assigneeName.toLowerCase().includes(q)));
  const swFiltered       = (itAssets?.software.list ?? []).filter(s => !q || s.name.toLowerCase().includes(q) || s.vendor.toLowerCase().includes(q));
  const spendFiltered    = (spending?.expenses ?? []).filter(e => !filterDept && (!q || e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)));

  const hasFilters = !!(search || filterDept || payStatusFilter || leaveStatusFilter || leaveTypeFilter || recStatusFilter || expStatusFilter);
  const clearFilters = () => { setSearch(''); setFilterDept(''); setPayStatusFilter(''); setLeaveStatusFilter(''); setLeaveTypeFilter(''); setRecStatusFilter(''); setExpStatusFilter(''); };

  // ── Sortable tables ─────────────────────────────────────────────────────────
  const attSort      = useSortable(attFiltered);
  const paySort      = useSortable(payFiltered);
  const leaveEmpSort = useSortable(leaveEmpFiltered);
  const leaveReqSort = useSortable(leaveReqFiltered);
  const recSort      = useSortable(recFiltered);
  const obSort       = useSortable(obFiltered);
  const perfSort     = useSortable(perfFiltered);
  const expSort      = useSortable(expFiltered);
  const awardsSort   = useSortable(awardsFiltered);
  const devSort      = useSortable(devFiltered);
  const swSort       = useSortable(swFiltered);
  const spendSort    = useSortable(spendFiltered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Analytics and exports across all HR modules</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-2xl overflow-x-auto w-full">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0',
              tab === key ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── INSIGHTS ──────────────────────────────────────────────────────────── */}
      {tab === 'insights' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}        color="bg-indigo-100 text-indigo-600"  label="Total Headcount"    value={ov?.employees.total ?? '—'}         sub={`${ov?.employees.active ?? 0} active`} />
            <StatCard icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" label="Attendance Rate"   value={ov ? `${ov.attendance.rate}%` : '—'} sub={`${MONTHS[(ov?.month??1)-1]} ${ov?.year}`} />
            <StatCard icon={Clock}        color="bg-sky-100 text-sky-600"         label="Avg Hours / Day"   value={ov ? `${ov.attendance.avgHoursPerDay}h` : '—'} sub="from clocked records" />
            <StatCard icon={DollarSign}   color="bg-amber-100 text-amber-600"     label="Net Payroll"       value={ov ? KES(ov.payroll.totalNet) : '—'} sub={`${ov?.payroll.headcount ?? 0} paid`} />
            <StatCard icon={Calendar}     color="bg-rose-100 text-rose-500"       label="Pending Leave"     value={ov?.leave.pendingRequests ?? '—'}    sub="awaiting approval" />
            <StatCard icon={TrendingUp}   color="bg-violet-100 text-violet-600"   label="Avg Performance"   value={ov ? `${ov.appraisals.avgRating} / 5` : '—'} sub={`${ov?.appraisals.total ?? 0} appraisals`} />
            <StatCard icon={UserPlus}     color="bg-teal-100 text-teal-600"       label="Open Positions"    value={ov?.recruitment.openPositions ?? '—'} sub={`${ov?.recruitment.totalApplicants ?? 0} applicants`} />
            <StatCard icon={ClipboardList} color="bg-orange-100 text-orange-600"  label="Onboarding"        value={ov ? `${ov.onboarding.completed}/${ov.onboarding.total}` : '—'} sub="tasks completed" />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading chart data…
            </div>
          )}

          {/* Charts row 1 */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Payroll by Department */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <p className="text-sm font-bold text-slate-100">Payroll by Department</p>
              {payroll?.byDepartment && Object.keys(payroll.byDepartment).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(payroll.byDepartment)
                      .map(([dept, v]) => ({ name: dept.length > 14 ? dept.slice(0, 14) + '…' : dept, value: Math.round(v.net) }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 8)}
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={90} axisLine={false} tickLine={false} />
                    <ReTooltip formatter={(v: unknown) => [`KES ${Number(v).toLocaleString('en-KE')}`, 'Net Pay'] as [string, string]} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-slate-600">
                  {loading ? 'Loading…' : 'No payroll data for this period.'}
                </div>
              )}
            </div>

            {/* Leave by Type */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <p className="text-sm font-bold text-slate-100">Leave by Type</p>
              {leave?.byType && Object.keys(leave.byType).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={Object.entries(leave.byType)
                      .map(([type, v]) => ({ name: type.length > 12 ? type.slice(0, 12) + '…' : type, approved: v.approved, pending: v.pending }))}
                    margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="pending"  name="Pending"  fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-slate-600">
                  {loading ? 'Loading…' : 'No leave data for this year.'}
                </div>
              )}
            </div>
          </div>

          {/* Recruitment Pipeline */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 space-y-4">
            <p className="text-sm font-bold text-slate-100">Recruitment Pipeline</p>
            {recruitment?.byStage && Object.keys(recruitment.byStage).length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={Object.entries(recruitment.byStage).map(([stage, count]) => ({ name: stage, value: count }))}
                  margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip formatter={(v: unknown) => [Number(v), 'Applicants'] as [number, string]} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="value" name="Applicants" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-600">
                {loading ? 'Loading…' : 'No recruitment stage data available.'}
              </div>
            )}
          </div>

          {/* Performance distribution */}
          {performance.length > 0 && (() => {
            const buckets = [
              { name: '< 2.0', count: 0 },
              { name: '2–3',   count: 0 },
              { name: '3–4',   count: 0 },
              { name: '4–5',   count: 0 },
            ];
            performance.forEach(e => {
              const s = e.avgScore ?? 0;
              if (s < 2)      buckets[0].count++;
              else if (s < 3) buckets[1].count++;
              else if (s < 4) buckets[2].count++;
              else            buckets[3].count++;
            });
            return (
              <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 space-y-4">
                <p className="text-sm font-bold text-slate-100">Performance Score Distribution</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={buckets} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip formatter={(v: unknown) => [Number(v), 'Employees'] as [number, string]} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Bar dataKey="count" name="Employees" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Users}        color="bg-indigo-500/10 text-indigo-400"  label="Total Employees"    value={ov?.employees.total ?? '—'}         sub={`${ov?.employees.active ?? 0} active`} />
            <StatCard icon={CheckCircle2} color="bg-emerald-100 text-emerald-600"  label="Attendance Rate"    value={ov ? `${ov.attendance.rate}%` : '—'} sub={`${MONTHS[(ov?.month??1)-1]} ${ov?.year}`} />
            <StatCard icon={Clock}        color="bg-sky-100 text-sky-600"          label="Avg Hours / Day"    value={ov ? `${ov.attendance.avgHoursPerDay}h` : '—'} sub="from clocked records" />
            <StatCard icon={DollarSign}   color="bg-amber-100 text-amber-600"      label="Payroll This Month" value={ov ? KES(ov.payroll.totalNet) : '—'}  sub={`${ov?.payroll.headcount ?? 0} paid`} />
            <StatCard icon={Calendar}     color="bg-rose-100 text-rose-500"        label="Pending Leave"      value={ov?.leave.pendingRequests ?? '—'}     sub="requests awaiting approval" />
            <StatCard icon={TrendingUp}   color="bg-violet-100 text-violet-600"    label="Avg Performance"    value={ov ? `${ov.appraisals.avgRating} / 5` : '—'} sub={`${ov?.appraisals.total ?? 0} appraisals`} />
            <StatCard icon={UserPlus}     color="bg-teal-100 text-teal-600"        label="Open Positions"     value={ov?.recruitment.openPositions ?? '—'} sub={`${ov?.recruitment.totalApplicants ?? 0} applicants`} />
            <StatCard icon={ClipboardList} color="bg-orange-100 text-orange-600"   label="Onboarding Tasks"   value={ov ? `${ov.onboarding.completed} / ${ov.onboarding.total}` : '—'} sub="completed tasks" />
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-sm text-slate-400 leading-relaxed">
            Select a tab above to drill into any module — each has a full breakdown table and a <strong>CSV export</strong> button for payroll processing, management review, or audit purposes.
          </div>
        </div>
      )}

      {/* ── ATTENDANCE ────────────────────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} onRefresh={fetchTab}>
            {(attendance?.employees.length ?? 0) > 0 && (
              <button onClick={() => exportCSV(`attendance_${MONTHS[month-1]}_${year}.csv`,
                ['Name','Staff No','Department','Present','Absent','Late','Half Day','Total Hrs','Avg Hrs/Day'],
                attendance!.employees.map(e => [e.employeeName,e.staffNumber,e.department,e.present,e.absent,e.late,e.halfDay,e.totalHours,e.avgHours]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </MonthYearPicker>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : (attendance?.employees.length ?? 0) === 0 ? <Empty msg={`No records for ${MONTHS[month-1]} ${year}.`}/> : attFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<><span>{attSort.sorted.length} employees</span><span>Total: <strong className="text-slate-200">{attSort.sorted.reduce((s,e)=>s+e.totalHours,0).toFixed(1)}h</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName" toggle={attSort.toggle} Icon={attSort.Icon}>Employee</Th>
                    <Th k="staffNumber"  toggle={attSort.toggle} Icon={attSort.Icon}>Staff No</Th>
                    <Th k="department"   toggle={attSort.toggle} Icon={attSort.Icon}>Department</Th>
                    <Th k="present"      toggle={attSort.toggle} Icon={attSort.Icon}>Present</Th>
                    <Th k="absent"       toggle={attSort.toggle} Icon={attSort.Icon}>Absent</Th>
                    <Th k="late"         toggle={attSort.toggle} Icon={attSort.Icon}>Late</Th>
                    <Th k="halfDay"      toggle={attSort.toggle} Icon={attSort.Icon}>½ Day</Th>
                    <Th k="totalHours"   toggle={attSort.toggle} Icon={attSort.Icon}>Total Hrs</Th>
                    <Th k="avgHours"     toggle={attSort.toggle} Icon={attSort.Icon}>Avg Hrs/Day</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {attSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold">{e.employeeName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.staffNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{e.present}</td>
                      <td className="px-4 py-3"><span className={e.absent>0?'font-bold text-rose-400':'text-slate-600'}>{e.absent}</span></td>
                      <td className="px-4 py-3"><span className={e.late>0?'font-bold text-amber-400':'text-slate-600'}>{e.late}</span></td>
                      <td className="px-4 py-3 text-slate-500">{e.halfDay}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-bold">{e.totalHours}h</span>
                          <ProgressBar pct={Math.round((e.totalHours/(8*Math.max(e.present,1)))*100)} color={e.avgHours>=8?'bg-emerald-400':'bg-amber-400'}/>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={e.avgHours>=8?'text-emerald-400':e.avgHours>=6?'text-amber-400':'text-rose-400'}>{e.avgHours>0?`${e.avgHours}h`:'—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── PAYROLL ───────────────────────────────────────────────────────────── */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} onRefresh={fetchTab}>
            {(payroll?.employees.length ?? 0) > 0 && (
              <button onClick={() => exportCSV(`payroll_${MONTHS[month-1]}_${year}.csv`,
                ['Name','Staff No','Department','Gross Pay','PAYE','SHA','NSSF','Net Pay','Status'],
                payroll!.employees.map(e=>[e.employeeName,e.staffNumber,e.department,e.grossPay,e.paye,e.sha,e.nssf,e.netPay,e.paymentStatus]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </MonthYearPicker>

          {payroll && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Gross Payroll', value: KES(payroll.totals.gross) },
                { label:'Net Payroll',   value: KES(payroll.totals.net)   },
                { label:'Total PAYE',    value: KES(payroll.totals.paye)  },
                { label:'Headcount',     value: payroll.totals.headcount  },
              ].map(s => (
                <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-slate-100 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={
              <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)}
                className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            } />
          {loading ? <Loading/> : (payroll?.employees.length ?? 0) === 0 ? <Empty msg={`No payroll for ${MONTHS[month-1]} ${year}.`}/> : payFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<><span>{paySort.sorted.length} employees</span><span>Net total: <strong className="text-slate-200">{KES(paySort.sorted.reduce((s,e)=>s+e.netPay,0))}</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName" toggle={paySort.toggle} Icon={paySort.Icon}>Employee</Th>
                    <Th k="department"   toggle={paySort.toggle} Icon={paySort.Icon}>Department</Th>
                    <Th k="grossPay"     toggle={paySort.toggle} Icon={paySort.Icon}>Gross</Th>
                    <Th k="paye"         toggle={paySort.toggle} Icon={paySort.Icon}>PAYE</Th>
                    <Th k="sha"          toggle={paySort.toggle} Icon={paySort.Icon}>SHA</Th>
                    <Th k="nssf"         toggle={paySort.toggle} Icon={paySort.Icon}>NSSF</Th>
                    <Th k="netPay"       toggle={paySort.toggle} Icon={paySort.Icon}>Net Pay</Th>
                    <Th k="paymentStatus" toggle={paySort.toggle} Icon={paySort.Icon}>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {paySort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 font-medium">{KES(e.grossPay)}</td>
                      <td className="px-4 py-3 text-rose-400">{KES(e.paye)}</td>
                      <td className="px-4 py-3 text-rose-400">{KES(e.sha)}</td>
                      <td className="px-4 py-3 text-rose-400">{KES(e.nssf)}</td>
                      <td className="px-4 py-3 font-bold text-slate-100">{KES(e.netPay)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                          e.paymentStatus==='paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                          {e.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── LEAVE ─────────────────────────────────────────────────────────────── */}
      {tab === 'leave' && (
        <div className="space-y-4">
          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {/* View toggle */}
            <div className="flex rounded-xl border border-slate-700 overflow-hidden text-sm font-semibold">
              {(['requests','summary'] as const).map(v => (
                <button key={v} onClick={() => setLeaveView(v)}
                  className={cn('px-4 py-2 transition-colors capitalize',
                    leaveView === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}>
                  {v === 'requests' ? 'All Requests' : 'By Employee'}
                </button>
              ))}
            </div>
            <button onClick={() => {
              if (leaveView === 'requests') {
                exportCSV(`leave_requests_${year}.csv`,
                  ['Employee','Staff No','Department','Leave Type','Start','End','Days','Status','Reason'],
                  leaveReqSort.sorted.map(r=>[r.employeeName,r.staffNumber,r.department,r.leaveType,r.startDate,r.endDate,r.numberOfDays,r.status,r.reason]) as unknown as (string|number|null)[]
                );
              } else {
                exportCSV(`leave_summary_${year}.csv`,
                  ['Name','Staff No','Department','Requests','Approved','Pending','Days Taken','Annual Remaining','Sick Remaining'],
                  leaveEmpSort.sorted.map(e=>[e.employeeName,e.staffNumber,e.department,e.totalRequests,e.approved,e.pending,e.totalDaysTaken,e.annualRemaining??'',e.sickRemaining??'']) as unknown as (string|number|null)[]
                );
              }
            }} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              <Download className="h-3.5 w-3.5"/> Export CSV
            </button>
          </div>

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={<>
              <select value={leaveStatusFilter} onChange={e => setLeaveStatusFilter(e.target.value)}
                className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              {leaveTypes.length > 0 && (
                <select value={leaveTypeFilter} onChange={e => setLeaveTypeFilter(e.target.value)}
                  className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">All leave types</option>
                  {leaveTypes.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
              )}
            </>} />

          {/* By-type summary cards */}
          {leave && Object.keys(leave.byType).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(leave.byType).map(([type, d]) => (
                <div key={type} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-4">
                  <p className="text-xs font-bold text-slate-500 tracking-wider capitalize mb-2">{type.replace('_',' ')} Leave</p>
                  <p className="text-2xl font-black text-slate-100">{d.days} <span className="text-sm font-normal text-slate-500">days</span></p>
                  <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <span className="text-emerald-400 font-semibold">{d.approved} approved</span>
                    {d.pending   > 0 && <span className="text-amber-400 font-semibold">{d.pending} pending</span>}
                    {d.rejected  > 0 && <span className="text-rose-400 font-semibold">{d.rejected} rejected</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? <Loading/> : !leave ? <Empty msg={`No leave data for ${year}.`}/> : (
            <>
              {/* ── Individual requests view — card layout ── */}
              {leaveView === 'requests' && (
                leaveReqSort.sorted.length === 0
                  ? <Empty msg="No requests match the selected filter."/>
                  : (
                    <div className="space-y-2">
                      {/* Sort controls strip */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                        <span>{leaveReqSort.sorted.length} request{leaveReqSort.sorted.length !== 1 ? 's' : ''}</span>
                        <span>· Sort by:</span>
                        {(['employeeName','department','leaveType','startDate','numberOfDays','status'] as const).map(k => (
                          <button key={k} onClick={() => leaveReqSort.toggle(k)}
                            className="flex items-center gap-0.5 hover:text-slate-200 capitalize">
                            {k === 'employeeName' ? 'Name' : k === 'numberOfDays' ? 'Days' : k === 'startDate' ? 'Date' : k}
                            <leaveReqSort.Icon k={k}/>
                          </button>
                        ))}
                      </div>
                      {leaveReqSort.sorted.map((r) => {
                        const isApproved = r.status === 'approved';
                        const isPending  = r.status === 'pending';
                        const borderCol  = isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';

                        const textCol    = isApproved ? '#065f46' : isPending ? '#92400e' : '#9f1239';
                        const badgeBg    = isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#ffe4e6';
                        return (
                          <div key={r._id} className="flex items-stretch rounded-xl border border-slate-700/60 overflow-hidden bg-[#1e293b]">
                            {/* Status stripe */}
                            <div className="w-1.5 shrink-0" style={{ backgroundColor: borderCol }} />
                            {/* Content */}
                            <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
                              {/* Avatar */}
                              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
                                style={{ backgroundColor: `${borderCol}20`, color: borderCol }}>
                                {r.employeeName.charAt(0)}
                              </div>
                              {/* Employee + dept */}
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-slate-100 truncate">{r.employeeName}</p>
                                <p className="text-xs text-slate-500">{[r.staffNumber, r.department].filter(Boolean).join(' · ')}</p>
                              </div>
                              {/* Leave type badge */}
                              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-400 capitalize shrink-0">
                                {r.leaveType.replace(/_/g,' ')}
                              </span>
                              {/* Date range */}
                              <div className="hidden md:block text-xs text-slate-500 shrink-0 text-right">
                                <p>{new Date(r.startDate).toLocaleDateString('en-KE',{dateStyle:'medium'})}</p>
                                <p>→ {new Date(r.endDate).toLocaleDateString('en-KE',{dateStyle:'medium'})}</p>
                              </div>
                              {/* Days */}
                              <div className="text-center shrink-0 hidden sm:block">
                                <p className="text-lg font-black leading-none" style={{ color: borderCol }}>{r.numberOfDays}</p>
                                <p className="text-[10px] text-slate-500">day{r.numberOfDays !== 1 ? 's' : ''}</p>
                              </div>
                              {/* Status badge */}
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0"
                                style={{ backgroundColor: badgeBg, color: textCol }}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
              )}

              {/* ── Per-employee summary view ── */}
              {leaveView === 'summary' && (
                leave.employees.length === 0
                  ? <Empty msg={`No leave data for ${year}.`}/>
                  : <TableWrap footer={<span>{leaveEmpSort.sorted.length} employees</span>}>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800/60 border-b border-slate-700">
                          <tr>
                            <Th k="employeeName"    toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Employee</Th>
                            <Th k="department"      toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Department</Th>
                            <Th k="totalRequests"   toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Requests</Th>
                            <Th k="approved"        toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Approved</Th>
                            <Th k="pending"         toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Pending</Th>
                            <Th k="totalDaysTaken"  toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Days Taken</Th>
                            <Th k="annualRemaining" toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Annual Left</Th>
                            <Th k="sickRemaining"   toggle={leaveEmpSort.toggle} Icon={leaveEmpSort.Icon}>Sick Left</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60">
                          {leaveEmpSort.sorted.map((e,i) => (
                            <tr key={i} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3">
                                <p className="font-semibold">{e.employeeName}</p>
                                <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-400">{e.department}</td>
                              <td className="px-4 py-3 text-slate-400">{e.totalRequests}</td>
                              <td className="px-4 py-3 font-bold text-emerald-400">{e.approved}</td>
                              <td className="px-4 py-3"><span className={e.pending>0?'font-bold text-amber-400':'text-slate-600'}>{e.pending}</span></td>
                              <td className="px-4 py-3 font-semibold">{e.totalDaysTaken} days</td>
                              <td className="px-4 py-3">{e.annualRemaining != null ? <span className={e.annualRemaining<5?'text-rose-400 font-bold':'text-slate-200'}>{e.annualRemaining} days</span> : '—'}</td>
                              <td className="px-4 py-3">{e.sickRemaining  != null ? `${e.sickRemaining} days` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableWrap>
              )}
            </>
          )}
        </div>
      )}

      {/* ── RECRUITMENT ───────────────────────────────────────────────────────── */}
      {tab === 'recruitment' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {(recruitment?.byPosition.length ?? 0) > 0 && (
              <button onClick={() => exportCSV('recruitment_report.csv',
                ['Job Title','Department','Status','Openings','Filled','Applications','Shortlisted','Hired'],
                recruitment!.byPosition.map(p=>[p.jobTitle,p.department,p.status,p.openings,p.filled,p.applications,p.shortlisted,p.hired]) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>

          {recruitment && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Total Positions',   value: recruitment.summary.totalPositions   },
                { label:'Open Positions',    value: recruitment.summary.openPositions    },
                { label:'Filled Positions',  value: recruitment.summary.filledPositions  },
                { label:'Total Applicants',  value: recruitment.summary.totalApplicants  },
              ].map(s => (
                <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-slate-100 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {recruitment && Object.keys(recruitment.byStage).length > 0 && (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pipeline by Stage</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(recruitment.byStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-slate-300 capitalize">{stage.replace(/_/g,' ')}</span>
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 rounded-full px-2 py-0.5">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={
              <select value={recStatusFilter} onChange={e => setRecStatusFilter(e.target.value)}
                className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="frozen">Frozen</option>
              </select>
            } />
          {loading ? <Loading/> : (recruitment?.byPosition.length ?? 0) === 0 ? <Empty msg="No positions found."/> : recFiltered.length === 0 ? <Empty msg="No positions match the current filters."/> : (
            <TableWrap footer={<span>{recSort.sorted.length} positions</span>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="jobTitle"      toggle={recSort.toggle} Icon={recSort.Icon}>Job Title</Th>
                    <Th k="department"    toggle={recSort.toggle} Icon={recSort.Icon}>Department</Th>
                    <Th k="status"        toggle={recSort.toggle} Icon={recSort.Icon}>Status</Th>
                    <Th k="openings"      toggle={recSort.toggle} Icon={recSort.Icon}>Openings</Th>
                    <Th k="applications"  toggle={recSort.toggle} Icon={recSort.Icon}>Applications</Th>
                    <Th k="shortlisted"   toggle={recSort.toggle} Icon={recSort.Icon}>Shortlisted</Th>
                    <Th k="hired"         toggle={recSort.toggle} Icon={recSort.Icon}>Hired</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {recSort.sorted.map((p,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold">{p.jobTitle}</td>
                      <td className="px-4 py-3 text-slate-400">{p.department}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                          p.status==='open'?'bg-emerald-500/20 text-emerald-400':p.status==='filled'?'bg-indigo-500/10 text-indigo-400':'bg-slate-700 text-slate-400')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{p.openings}</td>
                      <td className="px-4 py-3 font-bold text-slate-100">{p.applications}</td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">{p.shortlisted}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{p.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── ONBOARDING ────────────────────────────────────────────────────────── */}
      {tab === 'onboarding' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {onboarding.length > 0 && (
              <button onClick={() => exportCSV('onboarding_report.csv',
                ['Name','Staff No','Department','Completed','Total','Overdue','% Complete'],
                onboarding.map(e=>[e.employeeName,e.staffNumber,e.department,e.completed,e.total,e.overdue,e.pct]) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : onboarding.length === 0 ? <Empty msg="No onboarding tasks found."/> : obFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<span>{obSort.sorted.length} employees</span>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName" toggle={obSort.toggle} Icon={obSort.Icon}>Employee</Th>
                    <Th k="department"   toggle={obSort.toggle} Icon={obSort.Icon}>Department</Th>
                    <Th k="completed"    toggle={obSort.toggle} Icon={obSort.Icon}>Completed</Th>
                    <Th k="total"        toggle={obSort.toggle} Icon={obSort.Icon}>Total</Th>
                    <Th k="overdue"      toggle={obSort.toggle} Icon={obSort.Icon}>Overdue</Th>
                    <Th k="pct"          toggle={obSort.toggle} Icon={obSort.Icon}>Progress</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {obSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{e.completed}</td>
                      <td className="px-4 py-3 text-slate-500">{e.total}</td>
                      <td className="px-4 py-3">{e.overdue > 0 ? <span className="flex items-center gap-1 text-rose-400 font-bold"><AlertCircle className="h-3.5 w-3.5"/>{e.overdue}</span> : <span className="text-slate-600">0</span>}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <ProgressBar pct={e.pct} color={e.pct===100?'bg-emerald-400':e.pct>=50?'bg-indigo-500':'bg-amber-400'}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── EXPENSE CLAIMS ────────────────────────────────────────────────────── */}
      {tab === 'expense-claims' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {(expClaims?.employees.length ?? 0) > 0 && (
              <button onClick={() => exportCSV(`expense_claims_${year}.csv`,
                ['Name','Staff No','Department','Total Claims','Approved','Pending','Rejected','Approved Amount','Submitted Amount','Violations'],
                expClaims!.employees.map(e => [e.employeeName,e.staffNumber,e.department,e.totalClaims,e.approvedCount,e.pendingCount,e.rejectedCount,e.totalApproved,e.totalSubmitted,e.violations]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>

          {expClaims && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Claims',      value: expClaims.summary.total },
                { label: 'Total Submitted',   value: KES(expClaims.summary.totalAmount) },
                { label: 'Total Approved',    value: KES(expClaims.summary.approvedAmount) },
                { label: 'Policy Violations', value: expClaims.summary.violations },
              ].map(s => (
                <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-slate-100 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {expClaims && Object.keys(expClaims.byCategory).length > 0 && (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Spend by Category</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(expClaims.byCategory).sort((a,b) => b[1].amount - a[1].amount).map(([cat, d]) => (
                  <div key={cat} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-slate-300 capitalize">{cat.replace(/_/g,' ')}</span>
                    <span className="text-xs font-black text-indigo-400">{KES(d.amount)}</span>
                    <span className="text-[10px] text-slate-500">{d.count} claim{d.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={
              <select value={expStatusFilter} onChange={e => setExpStatusFilter(e.target.value)}
                className="h-9 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All employees</option>
                <option value="violations">With violations</option>
              </select>
            } />

          {loading ? <Loading/> : (expClaims?.employees.length ?? 0) === 0 ? <Empty msg={`No expense claims for ${year}.`}/> : expSort.sorted.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<><span>{expSort.sorted.length} employees</span><span>Total approved: <strong className="text-slate-200">{KES(expSort.sorted.reduce((s,e) => s+e.totalApproved, 0))}</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName"   toggle={expSort.toggle} Icon={expSort.Icon}>Employee</Th>
                    <Th k="department"     toggle={expSort.toggle} Icon={expSort.Icon}>Department</Th>
                    <Th k="totalClaims"    toggle={expSort.toggle} Icon={expSort.Icon}>Claims</Th>
                    <Th k="approvedCount"  toggle={expSort.toggle} Icon={expSort.Icon}>Approved</Th>
                    <Th k="pendingCount"   toggle={expSort.toggle} Icon={expSort.Icon}>Pending</Th>
                    <Th k="rejectedCount"  toggle={expSort.toggle} Icon={expSort.Icon}>Rejected</Th>
                    <Th k="totalApproved"  toggle={expSort.toggle} Icon={expSort.Icon}>Approved Amt</Th>
                    <Th k="violations"     toggle={expSort.toggle} Icon={expSort.Icon}>Violations</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {expSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 text-slate-400">{e.totalClaims}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{e.approvedCount}</td>
                      <td className="px-4 py-3"><span className={e.pendingCount>0?'font-bold text-amber-400':'text-slate-600'}>{e.pendingCount}</span></td>
                      <td className="px-4 py-3"><span className={e.rejectedCount>0?'font-bold text-rose-400':'text-slate-600'}>{e.rejectedCount}</span></td>
                      <td className="px-4 py-3 font-semibold">{KES(e.totalApproved)}</td>
                      <td className="px-4 py-3">
                        {e.violations > 0
                          ? <span className="flex items-center gap-1 text-rose-400 font-bold"><AlertCircle className="h-3.5 w-3.5"/>{e.violations}</span>
                          : <span className="text-slate-600">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── AWARDS ────────────────────────────────────────────────────────────── */}
      {tab === 'awards' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {(awards?.employees.length ?? 0) > 0 && (
              <button onClick={() => exportCSV(`awards_${year}.csv`,
                ['Name','Staff No','Department','Total Awards','Award Types'],
                awards!.employees.map(e => [e.employeeName,e.staffNumber,e.department,e.count,e.awards.join('; ')]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>

          {awards && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Awards Given', value: awards.summary.total },
                { label: 'Unique Recipients',  value: awards.summary.uniqueRecipients },
                { label: 'Award Types',        value: Object.keys(awards.byType).length },
                { label: 'Departments',        value: Object.keys(awards.byDepartment).length },
              ].map(s => (
                <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-slate-100 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {awards && Object.keys(awards.byType).length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">By Award Type</p>
                <div className="space-y-2">
                  {Object.entries(awards.byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm flex-1 text-slate-300">{type}</span>
                      <ProgressBar pct={Math.round((count / awards.summary.total) * 100)} color="bg-amber-400"/>
                      <span className="text-xs font-black text-slate-300 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">By Department</p>
                <div className="space-y-2">
                  {Object.entries(awards.byDepartment).sort((a,b) => b[1]-a[1]).map(([dept, count]) => (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-sm flex-1 text-slate-300 truncate">{dept}</span>
                      <ProgressBar pct={Math.round((count / awards.summary.total) * 100)} color="bg-violet-400"/>
                      <span className="text-xs font-black text-slate-300 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />

          {loading ? <Loading/> : (awards?.employees.length ?? 0) === 0 ? <Empty msg={`No awards given in ${year}.`}/> : awardsSort.sorted.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<span>{awardsSort.sorted.length} recipients</span>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName" toggle={awardsSort.toggle} Icon={awardsSort.Icon}>Employee</Th>
                    <Th k="department"   toggle={awardsSort.toggle} Icon={awardsSort.Icon}>Department</Th>
                    <Th k="count"        toggle={awardsSort.toggle} Icon={awardsSort.Icon}>Awards</Th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Award Types</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {awardsSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 font-black text-amber-400 text-lg">{e.count}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(e.awards)].map((a,j) => (
                            <span key={j} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">{a}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── IT ASSETS ─────────────────────────────────────────────────────────── */}
      {tab === 'it-assets' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            <div className="flex rounded-xl border border-slate-700 overflow-hidden text-sm font-semibold">
              {(['devices','software'] as const).map(v => (
                <button key={v} onClick={() => setItView(v)}
                  className={cn('px-4 py-2 transition-colors capitalize',
                    itView === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}>
                  {v === 'devices' ? 'Devices' : 'Software'}
                </button>
              ))}
            </div>
            {itView === 'devices' && (itAssets?.devices.list.length ?? 0) > 0 && (
              <button onClick={() => exportCSV('it_devices_report.csv',
                ['Name','Type','Brand','Serial No','Status','Condition','Assigned To','Department','Purchase Date'],
                itAssets!.devices.list.map(d => [d.name,d.type,d.brand,d.serialNumber,d.status,d.condition,d.assigneeName,d.assigneeDepartment,d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString('en-KE') : '']) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
            {itView === 'software' && (itAssets?.software.list.length ?? 0) > 0 && (
              <button onClick={() => exportCSV('it_software_report.csv',
                ['Name','Category','Vendor','License Type','Total Licenses','Assigned','Cost/License','Billing','Renewal Date','Status'],
                itAssets!.software.list.map(s => [s.name,s.category,s.vendor,s.licenseType,s.totalLicenses,s.assignedLicenses,s.costPerLicense,s.billingCycle,s.renewalDate ? new Date(s.renewalDate).toLocaleDateString('en-KE') : '',s.status]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>

          {itAssets && (() => {
            const itStats: { label: string; value: number }[] = itView === 'devices' ? [
              { label: 'Total Devices',     value: itAssets.devices.total },
              { label: 'Assigned',          value: itAssets.devices.assigned },
              { label: 'Unassigned',        value: itAssets.devices.unassigned },
              { label: 'Types',             value: Object.keys(itAssets.devices.byCategory).length },
            ] : [
              { label: 'Software Apps',     value: itAssets.software.totalApps },
              { label: 'Total Licenses',    value: itAssets.software.totalLicenses },
              { label: 'Assigned Licenses', value: itAssets.software.usedLicenses },
              { label: 'Available',         value: Math.max(0, itAssets.software.totalLicenses - itAssets.software.usedLicenses) },
            ];
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {itStats.map(s => (
                  <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {itView === 'devices' && (
            <>
              <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
                onClear={clearFilters} active={hasFilters} />
              {loading ? <Loading/> : (itAssets?.devices.list.length ?? 0) === 0 ? <Empty msg="No devices found."/> : devSort.sorted.length === 0 ? <Empty msg="No devices match the current filters."/> : (
                <TableWrap footer={<><span>{devSort.sorted.length} devices</span><span>Assigned: <strong className="text-slate-200">{devSort.sorted.filter(d=>d.assigneeName!=='Unassigned').length}</strong></span></>}>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/60 border-b border-slate-700">
                      <tr>
                        <Th k="name"              toggle={devSort.toggle} Icon={devSort.Icon}>Device</Th>
                        <Th k="type"              toggle={devSort.toggle} Icon={devSort.Icon}>Type</Th>
                        <Th k="serialNumber"      toggle={devSort.toggle} Icon={devSort.Icon}>Serial No</Th>
                        <Th k="status"            toggle={devSort.toggle} Icon={devSort.Icon}>Status</Th>
                        <Th k="condition"         toggle={devSort.toggle} Icon={devSort.Icon}>Condition</Th>
                        <Th k="assigneeName"      toggle={devSort.toggle} Icon={devSort.Icon}>Assigned To</Th>
                        <Th k="assigneeDepartment" toggle={devSort.toggle} Icon={devSort.Icon}>Department</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {devSort.sorted.map((d,i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-[10px] text-slate-500">{d.brand}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{d.type}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.serialNumber}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                              d.status==='assigned'?'bg-emerald-500/20 text-emerald-400':d.status==='unassigned'?'bg-slate-700 text-slate-400':'bg-amber-500/20 text-amber-400')}>
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{d.condition}</td>
                          <td className="px-4 py-3 font-medium">{d.assigneeName}</td>
                          <td className="px-4 py-3 text-slate-500">{d.assigneeDepartment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </>
          )}

          {itView === 'software' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search apps or vendors…"
                  className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {loading ? <Loading/> : (itAssets?.software.list.length ?? 0) === 0 ? <Empty msg="No software apps found."/> : swSort.sorted.length === 0 ? <Empty msg="No apps match the search."/> : (
                <TableWrap footer={<span>{swSort.sorted.length} apps</span>}>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/60 border-b border-slate-700">
                      <tr>
                        <Th k="name"             toggle={swSort.toggle} Icon={swSort.Icon}>App</Th>
                        <Th k="category"         toggle={swSort.toggle} Icon={swSort.Icon}>Category</Th>
                        <Th k="vendor"           toggle={swSort.toggle} Icon={swSort.Icon}>Vendor</Th>
                        <Th k="licenseType"      toggle={swSort.toggle} Icon={swSort.Icon}>License</Th>
                        <Th k="totalLicenses"    toggle={swSort.toggle} Icon={swSort.Icon}>Total</Th>
                        <Th k="assignedLicenses" toggle={swSort.toggle} Icon={swSort.Icon}>Assigned</Th>
                        <Th k="billingCycle"     toggle={swSort.toggle} Icon={swSort.Icon}>Billing</Th>
                        <Th k="status"           toggle={swSort.toggle} Icon={swSort.Icon}>Status</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {swSort.sorted.map((s,i) => {
                        const pct = s.totalLicenses > 0 ? Math.round((s.assignedLicenses / s.totalLicenses) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-semibold">{s.name}</td>
                            <td className="px-4 py-3 text-slate-400">{s.category}</td>
                            <td className="px-4 py-3 text-slate-400">{s.vendor}</td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{s.licenseType}</td>
                            <td className="px-4 py-3 text-slate-400">{s.totalLicenses}</td>
                            <td className="px-4 py-3 min-w-[120px]">
                              <div className="space-y-1">
                                <span className="text-xs font-semibold">{s.assignedLicenses} / {s.totalLicenses}</span>
                                <ProgressBar pct={pct} color={pct>=90?'bg-rose-400':pct>=70?'bg-amber-400':'bg-emerald-400'}/>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{s.billingCycle}</td>
                            <td className="px-4 py-3">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                                s.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-slate-700 text-slate-400')}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SPENDING ──────────────────────────────────────────────────────────── */}
      {tab === 'spending' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {(spending?.expenses.length ?? 0) > 0 && (
              <button onClick={() => exportCSV(`spending_${year}.csv`,
                ['Description','Category','Amount','Currency','Date','Vendor','Payment Method','Recorded By'],
                spending!.expenses.map(e => [e.description,e.category,e.amount,e.currency,e.date,e.vendor,e.paymentMethod,e.recordedBy]) as unknown as (string|number|null)[]
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>

          {spending && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Transactions', value: spending.summary.total },
                { label: 'Total Spend',        value: KES(spending.summary.totalAmount) },
                { label: 'Categories',         value: Object.keys(spending.summary.byCategory).length },
              ].map(s => (
                <div key={s.label} className="bg-[#1e293b] rounded-2xl border border-slate-700/60 px-4 py-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-slate-100 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {spending && Object.keys(spending.summary.byCategory).length > 0 && (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 space-y-4">
              <p className="text-sm font-bold text-slate-100">Spend by Category</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  layout="vertical"
                  data={Object.entries(spending.summary.byCategory).sort((a,b) => b[1].amount-a[1].amount).slice(0,8).map(([cat,d]) => ({ name: cat.length>16?cat.slice(0,16)+'…':cat, value: Math.round(d.amount) }))}
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(Number(v)/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} axisLine={false} tickLine={false} />
                  <ReTooltip formatter={(v: unknown) => [`KES ${Number(v).toLocaleString('en-KE')}`, 'Spend'] as [string, string]} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search description, vendor or category…"
              className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          {loading ? <Loading/> : (spending?.expenses.length ?? 0) === 0 ? <Empty msg={`No spending records for ${year}.`}/> : spendSort.sorted.length === 0 ? <Empty msg="No entries match the search."/> : (
            <TableWrap footer={<><span>{spendSort.sorted.length} transactions</span><span>Total: <strong className="text-slate-200">{KES(spendSort.sorted.reduce((s,e) => s+e.amount,0))}</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="date"          toggle={spendSort.toggle} Icon={spendSort.Icon}>Date</Th>
                    <Th k="description"   toggle={spendSort.toggle} Icon={spendSort.Icon}>Description</Th>
                    <Th k="category"      toggle={spendSort.toggle} Icon={spendSort.Icon}>Category</Th>
                    <Th k="vendor"        toggle={spendSort.toggle} Icon={spendSort.Icon}>Vendor</Th>
                    <Th k="amount"        toggle={spendSort.toggle} Icon={spendSort.Icon}>Amount</Th>
                    <Th k="paymentMethod" toggle={spendSort.toggle} Icon={spendSort.Icon}>Method</Th>
                    <Th k="recordedBy"    toggle={spendSort.toggle} Icon={spendSort.Icon}>Recorded By</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {spendSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{e.date}</td>
                      <td className="px-4 py-3 font-medium">{e.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-400 capitalize">{e.category.replace(/_/g,' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.vendor}</td>
                      <td className="px-4 py-3 font-bold text-slate-100">{KES(e.amount)}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{e.paymentMethod.replace(/_/g,' ')}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* ── PERFORMANCE ───────────────────────────────────────────────────────── */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {performance.length > 0 && (
              <button onClick={() => exportCSV('performance_report.csv',
                ['Name','Staff No','Department','Reviews','Avg Score','Latest Score','Period'],
                performance.map(e=>[e.employeeName,e.staffNumber,e.department,e.reviewCount,e.avgScore??'',e.latestScore??'',e.reviewPeriod??'']) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : performance.length === 0 ? <Empty msg="No appraisal records found."/> : perfFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<span>{perfSort.sorted.length} employees</span>}>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <Th k="employeeName" toggle={perfSort.toggle} Icon={perfSort.Icon}>Employee</Th>
                    <Th k="department"   toggle={perfSort.toggle} Icon={perfSort.Icon}>Department</Th>
                    <Th k="reviewCount"  toggle={perfSort.toggle} Icon={perfSort.Icon}>Reviews</Th>
                    <Th k="avgScore"     toggle={perfSort.toggle} Icon={perfSort.Icon}>Avg Score</Th>
                    <Th k="latestScore"  toggle={perfSort.toggle} Icon={perfSort.Icon}>Latest</Th>
                    <Th k="reviewPeriod" toggle={perfSort.toggle} Icon={perfSort.Icon}>Period</Th>
                    <Th k="latestReview" toggle={perfSort.toggle} Icon={perfSort.Icon}>Date</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {perfSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{e.department}</td>
                      <td className="px-4 py-3 text-slate-500">{e.reviewCount}</td>
                      <td className="px-4 py-3"><ScoreBadge score={e.avgScore}/></td>
                      <td className="px-4 py-3"><ScoreBadge score={e.latestScore}/></td>
                      <td className="px-4 py-3 text-slate-500">{e.reviewPeriod ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.latestReview ? new Date(e.latestReview).toLocaleDateString('en-KE',{dateStyle:'medium'}) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}
    </div>
  );
}
