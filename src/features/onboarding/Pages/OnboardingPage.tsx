'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Users, Plus, Search, X, Loader2, ChevronRight, Briefcase, DollarSign, FileText, CalendarDays, Upload, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useOnboarding } from '../Hooks/useOnboarding';
import { OnboardingEmployeeRow } from '../Components/OnboardingEmployeeRow';
import { TemplatesPanel } from '../Components/TemplatesPanel';

type Tab = 'active' | 'templates';

interface Employee {
  _id: string; fullName: string; staffNumber: string;
  department: string; designation?: string; grossPay?: number;
}
interface JobGroup    { _id: string; name: string; salaryMin?: number; salaryMax?: number }
interface Designation { _id: string; name: string; departmentIds?: string[] }
interface JdTemplate  { _id: string; name: string; roles?: string; description?: string }

const inputCls = 'w-full px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30';

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

  // Step 2 offer fields
  const [designationId, setDesignationId]   = useState('');
  const [grossPay, setGrossPay]             = useState('');
  const [startDate, setStartDate]           = useState('');
  const [jobGroupId, setJobGroupId]         = useState('');
  const [probationMonths, setProbationMonths] = useState('0');
  // JD — either pick a template or upload a custom file
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
    // derive job title from designation or free text
    const jobTitle = selectedDesignation?.name ?? designationId;
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold text-sm">Start Onboarding</p>
            {/* Step breadcrumb */}
            <div className="flex items-center gap-1.5 mt-1">
              {STEPS.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-medium', step === i + 1 ? 'text-primary' : 'text-foreground/30')}>
                    {i + 1}. {s}
                  </span>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-foreground/20" />}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-foreground/40 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step 1: Pick employee ── */}
        {step === 1 && (<>
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or staff number…"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="px-5 pb-3 max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-foreground/40 text-center py-8">No employees found.</p>
            ) : filtered.map(e => {
              const isActive = activeIds.has(String(e._id));
              return (
                <button key={e._id}
                  onClick={() => !isActive && selectEmployee(e)}
                  disabled={isActive}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-sm',
                    isActive
                      ? 'border-amber-200 bg-amber-50 cursor-not-allowed opacity-70'
                      : selected?._id === e._id
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent hover:bg-gray-50'
                  )}>
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isActive ? 'bg-amber-100' : 'bg-primary/10')}>
                    <span className={cn('text-xs font-bold', isActive ? 'text-amber-600' : 'text-primary')}>{e.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{e.fullName}</p>
                    <p className="text-xs text-foreground/40">{e.staffNumber} · {e.department}</p>
                  </div>
                  {isActive
                    ? <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">In onboarding</span>
                    : selected?._id === e._id && <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                  }
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button onClick={() => setStep(2)} disabled={!selected}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold">
              Next: Offer Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>)}

        {/* ── Step 2: Offer details ── */}
        {step === 2 && selected && (<>
          {/* Selected employee pill */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{selected.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{selected.fullName}</p>
                <p className="text-xs text-foreground/40">{selected.staffNumber} · {selected.department}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-primary/50 hover:text-primary underline shrink-0">Change</button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Offer Details</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Designation dropdown */}
              <div className="space-y-1 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                  <Briefcase className="h-3.5 w-3.5" /> Designation
                </label>
                <select value={designationId} onChange={e => setDesignationId(e.target.value)} className={inputCls}>
                  <option value="">Select designation…</option>
                  {designations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                {/* Department hint when designation selected */}
                {selectedDesignation && (selectedDesignation.departmentIds ?? []).length > 0 && (
                  <p className="text-xs text-blue-600">
                    Related departments: {selectedDesignation.departmentIds!.join(', ')}
                  </p>
                )}
              </div>

              {/* Gross Pay */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                  <DollarSign className="h-3.5 w-3.5" /> Gross Monthly Pay (KES)
                </label>
                <input type="number" value={grossPay} onChange={e => setGrossPay(e.target.value)}
                  placeholder="e.g. 85000" className={inputCls} />
              </div>

              {/* Job Group */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
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

              {/* Start Date */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                  <CalendarDays className="h-3.5 w-3.5" /> Start Date
                </label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>

              {/* Probation Period */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
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

              {/* JD section */}
              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                  <BookOpen className="h-3.5 w-3.5" /> Job Description
                </label>
                {/* Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
                  <button type="button" onClick={() => { setJdMode('template'); setJdFile(null); }}
                    className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                      jdMode === 'template' ? 'bg-primary text-white' : 'bg-white text-foreground/50 hover:bg-gray-50')}>
                    Use Template
                  </button>
                  <button type="button" onClick={() => { setJdMode('custom'); setJdTemplateId(''); }}
                    className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                      jdMode === 'custom' ? 'bg-primary text-white' : 'bg-white text-foreground/50 hover:bg-gray-50')}>
                    Upload Custom
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
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-xl bg-white hover:bg-gray-50 transition-colors text-left',
                        jdFile ? 'border-emerald-400 text-emerald-700' : 'border-gray-200 text-foreground/40'
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
                    <p className="text-xs text-foreground/30">PDF only, max 10 MB.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t bg-gray-50">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border rounded-xl hover:bg-white transition-colors">← Back</button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm border rounded-xl hover:bg-white transition-colors">Cancel</button>
              <button onClick={handleStart} disabled={starting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold">
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

const DEPARTMENTS = ['Lower Primary','Upper Primary','Junior Secondary','Senior Secondary','Administration','Finance','ICT','Library','Games and Sports','Guidance and Counselling'];

export default function OnboardingPage() {
  const [tab, setTab]               = useState<Tab>('active');
  const [showStart, setShowStart]   = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterDept, setFilterDept] = useState('');
  const { entries, loading, refetch, completeTask, removeOnboarding } = useOnboarding();

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterDept && e.employee.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.employee.fullName.toLowerCase().includes(q) && !e.employee.staffNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, filterDept]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-[#1a3461] p-5 text-white shadow-lg flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <ClipboardList className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Onboarding</h1>
          <p className="text-white/60 text-sm mt-0.5">Track new-hire checklists and manage task templates</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-2xl font-bold">{entries.length}</p>
          <p className="text-white/60 text-xs">In progress</p>
        </div>
      </div>

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
                ? 'border-accent text-primary'
                : 'border-transparent text-foreground/50 hover:text-foreground'
            )}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && <TemplatesPanel />}

      {tab === 'active' && (
        <>
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or staff ID…"
                  className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {/* Department filter */}
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {(search || filterDept) && (
                <button onClick={() => { setSearch(''); setFilterDept(''); }}
                  className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
              <span className="text-xs text-foreground/40 self-center">
                {filteredEntries.length} of {entries.length} in progress
              </span>
            </div>
            <button
              onClick={() => setShowStart(true)}
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" /> Start Onboarding
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-accent animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground/30 gap-3 border rounded-2xl bg-white">
              <Users className="h-12 w-12" />
              <p className="text-sm font-medium">No active onboarding in progress.</p>
              <p className="text-xs">Click "Start Onboarding" to assign tasks to an employee.</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/30 gap-2 border rounded-2xl bg-white">
              <Search className="h-8 w-8" />
              <p className="text-sm">No results match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((e) => (
                <OnboardingEmployeeRow
                  key={String(e.employee._id)}
                  entry={e}
                  autoExpand={highlightId === String(e.employee._id)}
                  onComplete={(id) => { completeTask(id); refetch(); }}
                  onRemove={(id) => removeOnboarding(id)}
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
          onStarted={(employeeId) => {
            refetch();
            setTab('active');
            setHighlightId(employeeId);
            setTimeout(() => setHighlightId(null), 4000);
          }}
        />
      )}
    </div>
  );
}
