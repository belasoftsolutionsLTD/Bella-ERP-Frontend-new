'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, TrendingUp, Clock, CheckCircle2, Download,
  RefreshCw, Loader2, ChevronUp, ChevronDown, DollarSign,
  Calendar, UserPlus, ClipboardList, AlertCircle, Search, X,
} from 'lucide-react';
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
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4', wide && 'col-span-2')}>
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="h-5 w-5"/>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-foreground/40 uppercase tracking-widest font-medium">{label}</p>
        <p className="text-2xl font-black text-foreground mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-foreground/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Th({ children, k, toggle, Icon }: { children: React.ReactNode; k: string; toggle:(k:string)=>void; Icon: React.ComponentType<{k:string}> }) {
  return (
    <th onClick={() => toggle(k)}
      className="px-4 py-3 text-left text-[11px] font-semibold text-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap">
      <div className="flex items-center gap-1">{children}<Icon k={k}/></div>
    </th>
  );
}

function ScoreBadge({ score, max=5 }: { score: number|null; max?: number }) {
  if (score == null) return <span className="text-foreground/30 text-xs">—</span>;
  const ratio = score / max;
  const color = ratio >= 0.8 ? 'text-emerald-600 bg-emerald-50' : ratio >= 0.6 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
  return <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', color)}>{score.toFixed(1)} / {max}</span>;
}

function ProgressBar({ pct, color='bg-primary' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, pct)}%` }}/>
      </div>
      <span className="text-[10px] text-foreground/40 w-7 text-right">{pct}%</span>
    </div>
  );
}

function TableWrap({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="px-4 py-3 border-t bg-gray-50 text-xs text-foreground/40 flex items-center justify-between">{footer}</div>}
    </div>
  );
}

function Loading() {
  return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary/40"/></div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center py-20 text-foreground/30 text-sm">{msg}</div>;
}

// ── Month/Year picker ─────────────────────────────────────────────────────────

function MonthYearPicker({ month, year, onMonth, onYear, onRefresh, children }:
  { month:number; year:number; onMonth:(n:number)=>void; onYear:(n:number)=>void; onRefresh:()=>void; children?: React.ReactNode }) {
  const now = new Date();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select value={month} onChange={e => onMonth(+e.target.value)}
        className="text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
        {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
      <select value={year} onChange={e => onYear(+e.target.value)}
        className="text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
        {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
        <input value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or staff ID…"
          className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      {depts.length > 0 && (
        <select value={filterDept} onChange={e => onDept(e.target.value)}
          className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {extra}
      {active && (
        <button onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground border border-gray-200 rounded-xl px-3 h-9 bg-white">
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',     label: 'Overview'     },
  { key: 'attendance',   label: 'Attendance'   },
  { key: 'payroll',      label: 'Payroll'      },
  { key: 'leave',        label: 'Leave'        },
  { key: 'recruitment',  label: 'Recruitment'  },
  { key: 'onboarding',   label: 'Onboarding'   },
  { key: 'performance',  label: 'Performance'  },
] as const;
type Tab = typeof TABS[number]['key'];

export default function ReportsPage() {
  const now = new Date();
  const [tab,   setTab]   = useState<Tab>('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const [overview,    setOverview]    = useState<Overview|null>(null);
  const [attendance,  setAttendance]  = useState<AttReport|null>(null);
  const [payroll,     setPayroll]     = useState<PayReport|null>(null);
  const [leave,       setLeave]       = useState<LeaveReport|null>(null);
  const [recruitment, setRecruitment] = useState<RecruitReport|null>(null);
  const [onboarding,  setOnboarding]  = useState<OnboardEmp[]>([]);
  const [performance, setPerformance] = useState<PerfEmp[]>([]);

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
    if (tab === 'attendance')  load('attendance',  d => setAttendance(d as AttReport),     mp);
    if (tab === 'payroll')     load('payroll',     d => setPayroll(d as PayReport),         mp);
    if (tab === 'leave')       load('leave',       d => setLeave(d as LeaveReport),         `?year=${year}`);
    if (tab === 'recruitment') load('recruitment', d => setRecruitment(d as RecruitReport), '');
    if (tab === 'onboarding')  load('onboarding',  d => setOnboarding(d as OnboardEmp[]),   '');
    if (tab === 'performance') load('performance', d => setPerformance(d as PerfEmp[]),     '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, month, year]);
  useEffect(() => { if (tab !== 'overview') fetchTab(); }, [tab, fetchTab]);

  // ── Overview ────────────────────────────────────────────────────────────────
  const ov = overview;

  // ── Shared filter state (reset on tab change) ────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [filterDept,      setFilterDept]      = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [recStatusFilter, setRecStatusFilter] = useState('');
  const [leaveView, setLeaveView]             = useState<'summary' | 'requests'>('requests');

  useEffect(() => {
    setSearch(''); setFilterDept('');
    setPayStatusFilter(''); setLeaveStatusFilter(''); setLeaveTypeFilter(''); setRecStatusFilter('');
  }, [tab]);

  // ── Unique departments from current tab data ──────────────────────────────────
  const depts = useMemo(() => {
    const all: string[] = [];
    if (tab === 'attendance' && attendance) all.push(...attendance.employees.map(e => e.department));
    if (tab === 'payroll'    && payroll)    all.push(...payroll.employees.map(e => e.department));
    if (tab === 'leave'      && leave)      { all.push(...leave.employees.map(e => e.department)); all.push(...(leave.requests ?? []).map(r => r.department)); }
    if (tab === 'recruitment' && recruitment) all.push(...recruitment.byPosition.map(p => p.department));
    if (tab === 'onboarding') all.push(...onboarding.map(e => e.department));
    if (tab === 'performance') all.push(...performance.map(e => e.department));
    return [...new Set(all.filter(Boolean))].sort();
  }, [tab, attendance, payroll, leave, recruitment, onboarding, performance]);

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

  const hasFilters = !!(search || filterDept || payStatusFilter || leaveStatusFilter || leaveTypeFilter || recStatusFilter);
  const clearFilters = () => { setSearch(''); setFilterDept(''); setPayStatusFilter(''); setLeaveStatusFilter(''); setLeaveTypeFilter(''); setRecStatusFilter(''); };

  // ── Sortable tables ─────────────────────────────────────────────────────────
  const attSort      = useSortable(attFiltered);
  const paySort      = useSortable(payFiltered);
  const leaveEmpSort = useSortable(leaveEmpFiltered);
  const leaveReqSort = useSortable(leaveReqFiltered);
  const recSort      = useSortable(recFiltered);
  const obSort       = useSortable(obFiltered);
  const perfSort     = useSortable(perfFiltered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Reports</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Analytics and exports across all HR modules</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto w-full">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0',
              tab === key ? 'bg-white text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Users}        color="bg-primary/10 text-primary"       label="Total Employees"    value={ov?.employees.total ?? '—'}         sub={`${ov?.employees.active ?? 0} active`} />
            <StatCard icon={CheckCircle2} color="bg-emerald-100 text-emerald-600"  label="Attendance Rate"    value={ov ? `${ov.attendance.rate}%` : '—'} sub={`${MONTHS[(ov?.month??1)-1]} ${ov?.year}`} />
            <StatCard icon={Clock}        color="bg-sky-100 text-sky-600"          label="Avg Hours / Day"    value={ov ? `${ov.attendance.avgHoursPerDay}h` : '—'} sub="from clocked records" />
            <StatCard icon={DollarSign}   color="bg-amber-100 text-amber-600"      label="Payroll This Month" value={ov ? KES(ov.payroll.totalNet) : '—'}  sub={`${ov?.payroll.headcount ?? 0} paid`} />
            <StatCard icon={Calendar}     color="bg-rose-100 text-rose-500"        label="Pending Leave"      value={ov?.leave.pendingRequests ?? '—'}     sub="requests awaiting approval" />
            <StatCard icon={TrendingUp}   color="bg-violet-100 text-violet-600"    label="Avg Performance"    value={ov ? `${ov.appraisals.avgRating} / 5` : '—'} sub={`${ov?.appraisals.total ?? 0} appraisals`} />
            <StatCard icon={UserPlus}     color="bg-teal-100 text-teal-600"        label="Open Positions"     value={ov?.recruitment.openPositions ?? '—'} sub={`${ov?.recruitment.totalApplicants ?? 0} applicants`} />
            <StatCard icon={ClipboardList} color="bg-orange-100 text-orange-600"   label="Onboarding Tasks"   value={ov ? `${ov.onboarding.completed} / ${ov.onboarding.total}` : '—'} sub="completed tasks" />
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-sm text-foreground/60 leading-relaxed">
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
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </MonthYearPicker>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : (attendance?.employees.length ?? 0) === 0 ? <Empty msg={`No records for ${MONTHS[month-1]} ${year}.`}/> : attFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<><span>{attSort.sorted.length} employees</span><span>Total: <strong className="text-foreground">{attSort.sorted.reduce((s,e)=>s+e.totalHours,0).toFixed(1)}h</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
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
                <tbody className="divide-y divide-gray-50">
                  {attSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold">{e.employeeName}</td>
                      <td className="px-4 py-3 text-foreground/50 text-xs">{e.staffNumber}</td>
                      <td className="px-4 py-3 text-foreground/60">{e.department}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{e.present}</td>
                      <td className="px-4 py-3"><span className={e.absent>0?'font-bold text-rose-500':'text-foreground/30'}>{e.absent}</span></td>
                      <td className="px-4 py-3"><span className={e.late>0?'font-bold text-amber-500':'text-foreground/30'}>{e.late}</span></td>
                      <td className="px-4 py-3 text-foreground/50">{e.halfDay}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-bold">{e.totalHours}h</span>
                          <ProgressBar pct={Math.round((e.totalHours/(8*Math.max(e.present,1)))*100)} color={e.avgHours>=8?'bg-emerald-400':'bg-amber-400'}/>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={e.avgHours>=8?'text-emerald-600':e.avgHours>=6?'text-amber-500':'text-rose-500'}>{e.avgHours>0?`${e.avgHours}h`:'—'}</span>
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
              )} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
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
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={
              <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            } />
          {loading ? <Loading/> : (payroll?.employees.length ?? 0) === 0 ? <Empty msg={`No payroll for ${MONTHS[month-1]} ${year}.`}/> : payFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<><span>{paySort.sorted.length} employees</span><span>Net total: <strong className="text-foreground">{KES(paySort.sorted.reduce((s,e)=>s+e.netPay,0))}</strong></span></>}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
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
                <tbody className="divide-y divide-gray-50">
                  {paySort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-foreground/40">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{e.department}</td>
                      <td className="px-4 py-3 font-medium">{KES(e.grossPay)}</td>
                      <td className="px-4 py-3 text-rose-500">{KES(e.paye)}</td>
                      <td className="px-4 py-3 text-rose-400">{KES(e.sha)}</td>
                      <td className="px-4 py-3 text-rose-400">{KES(e.nssf)}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{KES(e.netPay)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                          e.paymentStatus==='paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
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
              className="text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {/* View toggle */}
            <div className="flex rounded-xl border overflow-hidden text-sm font-semibold">
              {(['requests','summary'] as const).map(v => (
                <button key={v} onClick={() => setLeaveView(v)}
                  className={cn('px-4 py-2 transition-colors capitalize',
                    leaveView === v ? 'bg-primary text-white' : 'text-foreground/50 hover:text-foreground')}>
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
            }} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
              <Download className="h-3.5 w-3.5"/> Export CSV
            </button>
          </div>

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={<>
              <select value={leaveStatusFilter} onChange={e => setLeaveStatusFilter(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              {leaveTypes.length > 0 && (
                <select value={leaveTypeFilter} onChange={e => setLeaveTypeFilter(e.target.value)}
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">All leave types</option>
                  {leaveTypes.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
              )}
            </>} />

          {/* By-type summary cards */}
          {leave && Object.keys(leave.byType).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(leave.byType).map(([type, d]) => (
                <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-foreground/40 tracking-wider capitalize mb-2">{type.replace('_',' ')} Leave</p>
                  <p className="text-2xl font-black text-foreground">{d.days} <span className="text-sm font-normal text-foreground/40">days</span></p>
                  <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <span className="text-emerald-600 font-semibold">{d.approved} approved</span>
                    {d.pending   > 0 && <span className="text-amber-500 font-semibold">{d.pending} pending</span>}
                    {d.rejected  > 0 && <span className="text-rose-500 font-semibold">{d.rejected} rejected</span>}
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
                      <div className="flex items-center gap-2 text-xs text-foreground/40 px-1">
                        <span>{leaveReqSort.sorted.length} request{leaveReqSort.sorted.length !== 1 ? 's' : ''}</span>
                        <span>· Sort by:</span>
                        {(['employeeName','department','leaveType','startDate','numberOfDays','status'] as const).map(k => (
                          <button key={k} onClick={() => leaveReqSort.toggle(k)}
                            className="flex items-center gap-0.5 hover:text-foreground capitalize">
                            {k === 'employeeName' ? 'Name' : k === 'numberOfDays' ? 'Days' : k === 'startDate' ? 'Date' : k}
                            <leaveReqSort.Icon k={k}/>
                          </button>
                        ))}
                      </div>
                      {leaveReqSort.sorted.map((r) => {
                        const isApproved = r.status === 'approved';
                        const isPending  = r.status === 'pending';
                        const borderCol  = isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';
                        const bgCol      = isApproved ? '#f0fdf4' : isPending ? '#fffbeb' : '#fff1f2';
                        const textCol    = isApproved ? '#065f46' : isPending ? '#92400e' : '#9f1239';
                        const badgeBg    = isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#ffe4e6';
                        return (
                          <div key={r._id} className="flex items-stretch rounded-xl border overflow-hidden bg-white shadow-sm">
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
                                <p className="font-bold text-sm text-foreground truncate">{r.employeeName}</p>
                                <p className="text-xs text-foreground/40">{[r.staffNumber, r.department].filter(Boolean).join(' · ')}</p>
                              </div>
                              {/* Leave type badge */}
                              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-foreground/60 capitalize shrink-0">
                                {r.leaveType.replace(/_/g,' ')}
                              </span>
                              {/* Date range */}
                              <div className="hidden md:block text-xs text-foreground/50 shrink-0 text-right">
                                <p>{new Date(r.startDate).toLocaleDateString('en-KE',{dateStyle:'medium'})}</p>
                                <p>→ {new Date(r.endDate).toLocaleDateString('en-KE',{dateStyle:'medium'})}</p>
                              </div>
                              {/* Days */}
                              <div className="text-center shrink-0 hidden sm:block">
                                <p className="text-lg font-black leading-none" style={{ color: borderCol }}>{r.numberOfDays}</p>
                                <p className="text-[10px] text-foreground/40">day{r.numberOfDays !== 1 ? 's' : ''}</p>
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
                        <thead className="bg-gray-50 border-b">
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
                        <tbody className="divide-y divide-gray-50">
                          {leaveEmpSort.sorted.map((e,i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3">
                                <p className="font-semibold">{e.employeeName}</p>
                                <p className="text-[10px] text-foreground/40">{e.staffNumber}</p>
                              </td>
                              <td className="px-4 py-3 text-foreground/60">{e.department}</td>
                              <td className="px-4 py-3 text-foreground/60">{e.totalRequests}</td>
                              <td className="px-4 py-3 font-bold text-emerald-600">{e.approved}</td>
                              <td className="px-4 py-3"><span className={e.pending>0?'font-bold text-amber-500':'text-foreground/30'}>{e.pending}</span></td>
                              <td className="px-4 py-3 font-semibold">{e.totalDaysTaken} days</td>
                              <td className="px-4 py-3">{e.annualRemaining != null ? <span className={e.annualRemaining<5?'text-rose-500 font-bold':'text-foreground'}>{e.annualRemaining} days</span> : '—'}</td>
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
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {(recruitment?.byPosition.length ?? 0) > 0 && (
              <button onClick={() => exportCSV('recruitment_report.csv',
                ['Job Title','Department','Status','Openings','Filled','Applications','Shortlisted','Hired'],
                recruitment!.byPosition.map(p=>[p.jobTitle,p.department,p.status,p.openings,p.filled,p.applications,p.shortlisted,p.hired]) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
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
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {recruitment && Object.keys(recruitment.byStage).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">Pipeline by Stage</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(recruitment.byStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-foreground capitalize">{stage.replace(/_/g,' ')}</span>
                    <span className="text-xs font-black text-primary bg-primary/10 rounded-full px-2 py-0.5">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters}
            extra={
              <select value={recStatusFilter} onChange={e => setRecStatusFilter(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="frozen">Frozen</option>
              </select>
            } />
          {loading ? <Loading/> : (recruitment?.byPosition.length ?? 0) === 0 ? <Empty msg="No positions found."/> : recFiltered.length === 0 ? <Empty msg="No positions match the current filters."/> : (
            <TableWrap footer={<span>{recSort.sorted.length} positions</span>}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
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
                <tbody className="divide-y divide-gray-50">
                  {recSort.sorted.map((p,i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold">{p.jobTitle}</td>
                      <td className="px-4 py-3 text-foreground/60">{p.department}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                          p.status==='open'?'bg-emerald-100 text-emerald-600':p.status==='filled'?'bg-primary/10 text-primary':'bg-gray-100 text-gray-500')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{p.openings}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{p.applications}</td>
                      <td className="px-4 py-3 text-amber-600 font-semibold">{p.shortlisted}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{p.hired}</td>
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
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {onboarding.length > 0 && (
              <button onClick={() => exportCSV('onboarding_report.csv',
                ['Name','Staff No','Department','Completed','Total','Overdue','% Complete'],
                onboarding.map(e=>[e.employeeName,e.staffNumber,e.department,e.completed,e.total,e.overdue,e.pct]) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : onboarding.length === 0 ? <Empty msg="No onboarding tasks found."/> : obFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<span>{obSort.sorted.length} employees</span>}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <Th k="employeeName" toggle={obSort.toggle} Icon={obSort.Icon}>Employee</Th>
                    <Th k="department"   toggle={obSort.toggle} Icon={obSort.Icon}>Department</Th>
                    <Th k="completed"    toggle={obSort.toggle} Icon={obSort.Icon}>Completed</Th>
                    <Th k="total"        toggle={obSort.toggle} Icon={obSort.Icon}>Total</Th>
                    <Th k="overdue"      toggle={obSort.toggle} Icon={obSort.Icon}>Overdue</Th>
                    <Th k="pct"          toggle={obSort.toggle} Icon={obSort.Icon}>Progress</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {obSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-foreground/40">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{e.department}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{e.completed}</td>
                      <td className="px-4 py-3 text-foreground/50">{e.total}</td>
                      <td className="px-4 py-3">{e.overdue > 0 ? <span className="flex items-center gap-1 text-rose-500 font-bold"><AlertCircle className="h-3.5 w-3.5"/>{e.overdue}</span> : <span className="text-foreground/30">0</span>}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <ProgressBar pct={e.pct} color={e.pct===100?'bg-emerald-400':e.pct>=50?'bg-primary':'bg-amber-400'}/>
                      </td>
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
            <button onClick={fetchTab} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">
              <RefreshCw className="h-3.5 w-3.5"/> Refresh
            </button>
            {performance.length > 0 && (
              <button onClick={() => exportCSV('performance_report.csv',
                ['Name','Staff No','Department','Reviews','Avg Score','Latest Score','Period'],
                performance.map(e=>[e.employeeName,e.staffNumber,e.department,e.reviewCount,e.avgScore??'',e.latestScore??'',e.reviewPeriod??'']) as unknown as (string|number|null)[]
              )} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50">
                <Download className="h-3.5 w-3.5"/> Export CSV
              </button>
            )}
          </div>
          <FilterBar search={search} onSearch={setSearch} depts={depts} filterDept={filterDept} onDept={setFilterDept}
            onClear={clearFilters} active={hasFilters} />
          {loading ? <Loading/> : performance.length === 0 ? <Empty msg="No appraisal records found."/> : perfFiltered.length === 0 ? <Empty msg="No employees match the current filters."/> : (
            <TableWrap footer={<span>{perfSort.sorted.length} employees</span>}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
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
                <tbody className="divide-y divide-gray-50">
                  {perfSort.sorted.map((e,i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{e.employeeName}</p>
                        <p className="text-[10px] text-foreground/40">{e.staffNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{e.department}</td>
                      <td className="px-4 py-3 text-foreground/50">{e.reviewCount}</td>
                      <td className="px-4 py-3"><ScoreBadge score={e.avgScore}/></td>
                      <td className="px-4 py-3"><ScoreBadge score={e.latestScore}/></td>
                      <td className="px-4 py-3 text-foreground/50">{e.reviewPeriod ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground/40 text-xs">{e.latestReview ? new Date(e.latestReview).toLocaleDateString('en-KE',{dateStyle:'medium'}) : '—'}</td>
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
