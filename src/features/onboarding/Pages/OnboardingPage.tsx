'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ClipboardList, Users, Plus, Search, X, Loader2, ChevronRight,
  Briefcase, DollarSign, FileText, CalendarDays, Upload, Clock, BookOpen,
  Trash2, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useOnboarding, OnboardingEntry } from '../Hooks/useOnboarding';
import { TemplatesPanel } from '../Components/TemplatesPanel';

type Tab = 'active' | 'templates';

interface Employee {
  _id: string; fullName: string; staffNumber: string;
  department: string; designation?: string; grossPay?: number;
}
interface JobGroup    { _id: string; name: string; salaryMin?: number; salaryMax?: number }
interface Designation { _id: string; name: string; departmentIds?: string[] }
interface JdTemplate  { _id: string; name: string; roles?: string; description?: string }

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-600 rounded-xl bg-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';

const AVATAR_COLORS = [
  'bg-orange-500/20 text-orange-400',
  'bg-blue-500/20 text-blue-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-violet-500/20 text-violet-400',
  'bg-rose-500/20 text-rose-400',
  'bg-amber-500/20 text-amber-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-pink-500/20 text-pink-400',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const DEPARTMENTS = [
  'Lower Primary','Upper Primary','Junior Secondary','Senior Secondary',
  'Administration','Finance','ICT','Library','Games and Sports','Guidance and Counselling',
];

// ── Onboarding Card ────────────────────────────────────────────────────────────
function OnboardingCard({ entry, locale, onRemove }: {
  entry: OnboardingEntry;
  locale: string;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const color    = avatarColor(entry.employee.fullName);
  const initials = entry.employee.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const pct      = entry.percentage;
  const done     = pct === 100;

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl hover:border-slate-600 transition-all flex flex-col">
      <div className="p-5 flex-1 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3.5">
          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold', color)}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100 text-sm leading-tight truncate">{entry.employee.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {entry.employee.designation || entry.employee.department}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-400">
                {entry.employee.department}
              </span>
              {done && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{entry.completed} of {entry.total} tasks completed</span>
            <span className={cn('font-bold', done ? 'text-emerald-400' : 'text-indigo-400')}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', done ? 'bg-emerald-500' : 'bg-indigo-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Staff number */}
        <p className="text-xs text-slate-500">{entry.employee.staffNumber}</p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/40 flex items-center justify-between">
        <Link
          href={`/${locale}/onboarding/${entry.employee._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View checklist <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {confirmRemove ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-400 font-medium">Remove?</span>
            <button onClick={onRemove} className="text-xs font-bold text-red-400 hover:underline">Yes</button>
            <button onClick={() => setConfirmRemove(false)} className="text-xs text-slate-400 hover:text-slate-300">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRemove(true)}
            title="Remove from onboarding"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Start Onboarding Modal ─────────────────────────────────────────────────────
function StartOnboardingModal({ onClose, onStarted, activeIds }: {
  onClose: () => void;
  onStarted: (employeeId: string) => void;
  activeIds: Set<string>;
}) {
  const [step, setStep]                   = useState<1 | 2>(1);
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [jobGroups, setJobGroups]         = useState<JobGroup[]>([]);
  const [designations, setDesignations]   = useState<Designation[]>([]);
  const [jdTemplates, setJdTemplates]     = useState<JdTemplate[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<Employee | null>(null);
  const [starting, setStarting]           = useState(false);

  const [designationId, setDesignationId]   = useState('');
  const [jobTitleFreeText, setJobTitleFreeText] = useState('');
  const [grossPay, setGrossPay]             = useState('');
  const [startDate, setStartDate]           = useState('');
  const [jobGroupId, setJobGroupId]         = useState('');
  const [probationMonths, setProbationMonths] = useState('0');
  const [jdMode, setJdMode]                 = useState<'template' | 'custom'>('template');
  const [jdTemplateId, setJdTemplateId]     = useState('');
  const [jdFile, setJdFile]                 = useState<File | null>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      thenFn: (r) => setEmployees(r.data?.data ?? r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => {
    fetchEmployees();
    apiCallFunction<any>({ url: `${API_BASE_URL}/config/job-groups`,   showToast: false, thenFn: (r) => setJobGroups(r.data?.data   ?? r.data ?? []) });
    apiCallFunction<any>({ url: `${API_BASE_URL}/config/designations`,  showToast: false, thenFn: (r) => setDesignations(r.data?.data ?? r.data ?? []) });
    apiCallFunction<any>({ url: `${API_BASE_URL}/config/jd-templates`,  showToast: false, thenFn: (r) => setJdTemplates(r.data?.data  ?? r.data ?? []) });
  }, [fetchEmployees]);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (e.staffNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedDesignation = designations.find(d => d._id === designationId) ?? null;

  const selectEmployee = (e: Employee) => {
    setSelected(e);
    setDesignationId('');
    setJobTitleFreeText('');
    setGrossPay(e.grossPay ? String(e.grossPay) : '');
    setStartDate('');
    setJobGroupId('');
    setProbationMonths('0');
    setJdMode('template');
    setJdTemplateId('');
    setJdFile(null);
  };

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true);
    const fd = new FormData();
    const jobTitle = selectedDesignation?.name ?? jobTitleFreeText ?? designationId;
    fd.append('jobTitle', jobTitle);
    fd.append('grossPay', grossPay);
    fd.append('startDate', startDate);
    fd.append('jobGroupId', jobGroupId);
    fd.append('designationId', designationId);
    fd.append('probationMonths', probationMonths);
    if (jdMode === 'template' && jdTemplateId) {
      fd.append('jdTemplateId', jdTemplateId);
      fd.append('jdType', 'template');
    } else if (jdMode === 'custom' && jdFile) {
      fd.append('jdPdf', jdFile);
      fd.append('jdType', 'custom');
    }
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/${selected._id}/assign-defaults`,
      method: 'POST',
      data: fd,
      thenFn: () => {
        toast.success(`Onboarding started for ${selected.fullName}.`);
        onStarted(String(selected._id));
        onClose();
      },
    });
    setStarting(false);
  };

  const STEPS = ['Select Employee', 'Offer Details'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <p className="font-semibold text-sm text-slate-100">Start Onboarding</p>
            <div className="flex items-center gap-1.5 mt-1">
              {STEPS.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-medium', step === i + 1 ? 'text-indigo-400' : 'text-slate-500')}>
                    {i + 1}. {s}
                  </span>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 && (<>
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or staff number…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-600 rounded-xl bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div className="px-5 pb-3 max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No employees found.</p>
            ) : filtered.map(e => {
              const isActive = activeIds.has(String(e._id));
              return (
                <button key={e._id}
                  onClick={() => !isActive && selectEmployee(e)}
                  disabled={isActive}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-sm',
                    isActive
                      ? 'border-amber-500/30 bg-amber-500/10 cursor-not-allowed opacity-70'
                      : selected?._id === e._id
                        ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-medium'
                        : 'border-transparent hover:bg-slate-700/50 text-slate-200'
                  )}>
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isActive ? 'bg-amber-500/20' : 'bg-indigo-500/15')}>
                    <span className={cn('text-xs font-bold', isActive ? 'text-amber-400' : 'text-indigo-400')}>{e.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{e.fullName}</p>
                    <p className="text-xs text-slate-500">{e.staffNumber} · {e.department}</p>
                  </div>
                  {isActive
                    ? <span className="text-xs font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0">In onboarding</span>
                    : selected?._id === e._id && <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0" />
                  }
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-700 bg-slate-800/60">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={() => setStep(2)} disabled={!selected}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
              Next: Offer Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>)}

        {step === 2 && selected && (<>
          <div className="px-5 pt-4">
            <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-400">{selected.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-300 truncate">{selected.fullName}</p>
                <p className="text-xs text-slate-500">{selected.staffNumber} · {selected.department}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-indigo-300 underline shrink-0">Change</button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Details</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Briefcase className="h-3.5 w-3.5" /> Designation
                </label>
                {designations.length > 0 ? (
                  <select value={designationId} onChange={e => setDesignationId(e.target.value)} className={inputCls}>
                    <option value="">Select designation…</option>
                    {designations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={jobTitleFreeText}
                    onChange={e => setJobTitleFreeText(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className={inputCls}
                  />
                )}
                {designations.length === 0 && (
                  <p className="text-[10px] text-amber-500">No designations configured. Go to Settings → Designations to add them, or type a job title above.</p>
                )}
                {selectedDesignation && (selectedDesignation.departmentIds ?? []).length > 0 && (
                  <p className="text-xs text-blue-600">
                    Related departments: {selectedDesignation.departmentIds!.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <DollarSign className="h-3.5 w-3.5" /> Gross Monthly Pay (KES)
                </label>
                <input type="number" value={grossPay} onChange={e => setGrossPay(e.target.value)}
                  placeholder="e.g. 85000" className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Users className="h-3.5 w-3.5" /> Job Group / Salary Band
                </label>
                <select value={jobGroupId} onChange={e => setJobGroupId(e.target.value)} className={inputCls}>
                  <option value="">Select job group…</option>
                  {jobGroups.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.name}{g.salaryMin != null && g.salaryMax != null ? ` — KES ${g.salaryMin.toLocaleString()} – ${g.salaryMax.toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Start Date
                </label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> Probation Period
                </label>
                <select value={probationMonths} onChange={e => setProbationMonths(e.target.value)} className={inputCls}>
                  <option value="0">No probation</option>
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="4">4 months</option>
                  <option value="5">5 months</option>
                  <option value="6">6 months (max)</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> Job Description
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 w-fit">
                  <button type="button" onClick={() => { setJdMode('template'); setJdFile(null); }}
                    className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                      jdMode === 'template' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                    <BookOpen className="h-3.5 w-3.5 inline mr-1" />Use Template
                  </button>
                  <button type="button" onClick={() => { setJdMode('custom'); setJdTemplateId(''); }}
                    className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                      jdMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                    <Upload className="h-3.5 w-3.5 inline mr-1" />Upload Custom
                  </button>
                </div>

                {jdMode === 'template' && (
                  <select value={jdTemplateId} onChange={e => setJdTemplateId(e.target.value)} className={inputCls}>
                    <option value="">Select a JD template…</option>
                    {jdTemplates.length === 0
                      ? <option disabled>No templates available — add them in HR Config</option>
                      : jdTemplates.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.name}{t.roles ? ` (${t.roles})` : ''}
                          </option>
                        ))
                    }
                  </select>
                )}

                {jdMode === 'custom' && (
                  <>
                    <input ref={jdFileRef} type="file" accept=".pdf,application/pdf" className="hidden"
                      onChange={e => setJdFile(e.target.files?.[0] ?? null)} />
                    <button type="button" onClick={() => jdFileRef.current?.click()}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left',
                        jdFile ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-600 text-slate-400'
                      )}>
                      <Upload className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{jdFile ? jdFile.name : 'Click to upload JD PDF…'}</span>
                      {jdFile && (
                        <span onClick={e => { e.stopPropagation(); setJdFile(null); }}
                          className="p-0.5 text-foreground/30 hover:text-red-500 shrink-0 cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                    <p className="text-xs text-slate-500">PDF only, max 10 MB.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-slate-700 bg-slate-800/60">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">← Back</button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleStart} disabled={starting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {starting ? 'Starting…' : 'Start Onboarding'}
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const locale = useLocale();
  const [tab, setTab]             = useState<Tab>('active');
  const [showStart, setShowStart] = useState(false);
  const [search, setSearch]       = useState('');
  const [filterDept, setFilterDept] = useState('');
  const { entries, loading, refetch, removeOnboarding } = useOnboarding();

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterDept && e.employee.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.employee.fullName.toLowerCase().includes(q) &&
          !e.employee.staffNumber.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [entries, search, filterDept]);

  const stats = useMemo(() => ({
    total: entries.length,
    completed: entries.filter(e => e.percentage === 100).length,
    inProgress: entries.filter(e => e.percentage > 0 && e.percentage < 100).length,
  }), [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Onboarding</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage new employee onboarding journeys
          </p>
        </div>
        <button
          onClick={() => setShowStart(true)}
          className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Start Onboarding
        </button>
      </div>

      {/* Summary tiles */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total in progress', value: stats.total,       color: 'text-slate-300' },
            { label: 'In progress',       value: stats.inProgress,  color: 'text-indigo-400' },
            { label: 'Completed',         value: stats.completed,   color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-4 text-center">
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {([
          { key: 'active' as Tab,    label: 'Active Onboarding', icon: Users },
          { key: 'templates' as Tab, label: 'Task Templates',    icon: ClipboardList },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && <TemplatesPanel />}

      {tab === 'active' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1 max-w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or staff ID…"
                className="w-full h-9 pl-9 pr-3 border border-slate-700 rounded-xl text-sm bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="h-9 border border-slate-700 rounded-xl px-3 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(search || filterDept) && (
              <button
                onClick={() => { setSearch(''); setFilterDept(''); }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            {(search || filterDept) && (
              <span className="text-xs text-slate-500">
                {filteredEntries.length} of {entries.length} shown
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4 border border-dashed border-slate-700/60 rounded-2xl bg-[#1e293b]">
              <Users className="h-12 w-12" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400">No active onboarding in progress</p>
                <p className="text-xs text-slate-500 mt-1">Click "Start Onboarding" to assign tasks to an employee.</p>
              </div>
              <button
                onClick={() => setShowStart(true)}
                className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> Start Onboarding
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2 border border-slate-700/60 rounded-2xl bg-[#1e293b]">
              <Search className="h-8 w-8" />
              <p className="text-sm text-slate-400">No results match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEntries.map(e => (
                <OnboardingCard
                  key={String(e.employee._id)}
                  entry={e}
                  locale={locale}
                  onRemove={() => removeOnboarding(String(e.employee._id))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showStart && (
        <StartOnboardingModal
          activeIds={new Set(entries.map(e => String(e.employee._id)))}
          onClose={() => setShowStart(false)}
          onStarted={() => { refetch(); setTab('active'); }}
        />
      )}
    </div>
  );
}
