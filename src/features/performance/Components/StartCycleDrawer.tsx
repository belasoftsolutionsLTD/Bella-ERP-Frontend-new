'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplates } from '../Hooks/useTemplates';
import { useEmployees } from '@/features/employees/Hooks/useEmployees';
import { DEPARTMENTS } from '@/features/employees/Components/EmployeeSchema';

const STEPS = ['Setup', 'Audience', 'Phases', 'Review'] as const;
type Step = 0 | 1 | 2 | 3;

interface Props {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

const CYCLE_TYPES = [
  { value: 'self_manager', label: 'Self + Manager', desc: 'Employee self-reviews and manager reviews' },
  { value: '360',          label: '360°',           desc: 'Self, manager, peers, and direct reports' },
  { value: 'upward',       label: 'Upward Review',  desc: 'Employees review their managers' },
  { value: 'peer',         label: 'Peer Review',    desc: 'Colleagues review each other' },
];

export function StartCycleDrawer({ onClose, onSave, saving }: Props) {
  const [step, setStep] = useState<Step>(0);
  const { templates } = useTemplates();
  const { employees } = useEmployees({ limit: 1000 });

  const [name, setName]       = useState('');
  const [type, setType]       = useState('self_manager');
  const [templateId, setTemplateId] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'departments' | 'employees'>('all');
  const [audienceDepartments, setAudienceDepartments] = useState<string[]>([]);
  const [audienceEmployeeIds, setAudienceEmployeeIds] = useState<string[]>([]);
  const [selfStart, setSelfStart] = useState('');
  const [selfEnd,   setSelfEnd]   = useState('');
  const [mgmtStart, setMgmtStart] = useState('');
  const [mgmtEnd,   setMgmtEnd]   = useState('');
  const [calDate,   setCalDate]   = useState('');
  const [calOn,     setCalOn]     = useState(false);
  const [shareDate, setShareDate] = useState('');
  const [shareOn,   setShareOn]   = useState(true);

  const goBack = () => { if (step > 0) setStep((step - 1) as Step); else onClose(); };
  const goNext = () => { if (step < STEPS.length - 1) setStep((step + 1) as Step); };
  const canNext = step === 0 ? name.trim().length > 0
    : step === 1 ? (audienceType === 'all' || (audienceType === 'departments' ? audienceDepartments.length > 0 : audienceEmployeeIds.length > 0))
    : true;

  const applicableTemplates = templates.filter((t) => t.cycleTypes.length === 0 || t.cycleTypes.includes(type));

  const toggleDepartment = (d: string) => setAudienceDepartments((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const toggleEmployee = (id: string) => setAudienceEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      type,
      templateId: templateId || undefined,
      audienceType,
      departments: audienceType === 'departments' ? audienceDepartments : undefined,
      employeeIds: audienceType === 'employees' ? audienceEmployeeIds : undefined,
      selfReviewStart:       selfStart  || undefined,
      selfReviewEnd:         selfEnd    || undefined,
      selfReviewEnabled:     true,
      managerReviewStart:    mgmtStart  || undefined,
      managerReviewEnd:      mgmtEnd    || undefined,
      managerReviewEnabled:  true,
      calibrationDate:       calDate    || undefined,
      calibrationEnabled:    calOn,
      resultsSharingDate:    shareDate  || undefined,
      resultsSharingEnabled: shareOn,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[640px] flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">Start Review Cycle</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-brand-border shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                i < step ? 'text-indigo-400' : i === step ? 'text-brand-text' : 'text-brand-text-muted',
              )}>
                <div className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                  i < step  ? 'bg-brand-primary border-brand-primary text-white' :
                  i === step ? 'border-brand-primary text-indigo-400' :
                               'border-brand-border text-brand-text-muted',
                )}>
                  {i < step ? '✓' : i + 1}
                </div>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-brand-bg-muted mx-2" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
                  Cycle Name <span className="text-red-400">*</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Annual Review 2026"
                  className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
                  Review Type <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {CYCLE_TYPES.map(ct => (
                    <button key={ct.value} type="button" onClick={() => setType(ct.value)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                        type === ct.value
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-brand-border bg-brand-bg-soft hover:border-brand-border-strong',
                      )}>
                      <div className={cn(
                        'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0',
                        type === ct.value ? 'border-brand-primary bg-brand-primary' : 'border-brand-border-strong',
                      )} />
                      <div>
                        <p className={cn('text-sm font-semibold', type === ct.value ? 'text-indigo-300' : 'text-brand-text')}>{ct.label}</p>
                        <p className="text-xs text-brand-text-muted mt-0.5">{ct.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
                  Review Template
                </label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                  <option value="">No template (blank form)</option>
                  {applicableTemplates.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-brand-text-muted mt-1">Reviewers will see the template&apos;s structured questions instead of a blank form.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Audience</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All active employees', desc: 'Every active employee is added as a participant on launch.' },
                    { value: 'departments', label: 'Specific departments', desc: 'Only employees in the selected departments.' },
                    { value: 'employees', label: 'Specific employees', desc: 'Hand-pick exactly who participates.' },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setAudienceType(opt.value as typeof audienceType)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                        audienceType === opt.value ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg-soft hover:border-brand-border-strong',
                      )}>
                      <div className={cn('h-4 w-4 rounded-full border-2 mt-0.5 shrink-0', audienceType === opt.value ? 'border-brand-primary bg-brand-primary' : 'border-brand-border-strong')} />
                      <div>
                        <p className={cn('text-sm font-semibold', audienceType === opt.value ? 'text-indigo-300' : 'text-brand-text')}>{opt.label}</p>
                        <p className="text-xs text-brand-text-muted mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {audienceType === 'departments' && (
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDepartment(d)}
                      className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                        audienceDepartments.includes(d) ? 'border-brand-primary bg-brand-primary/10 text-indigo-300' : 'border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:border-brand-border-strong')}>
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {audienceType === 'employees' && (
                <div className="max-h-64 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border">
                  {employees.map((e) => (
                    <label key={e._id} className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text-secondary cursor-pointer hover:bg-brand-bg-soft">
                      <input type="checkbox" checked={audienceEmployeeIds.includes(e._id)} onChange={() => toggleEmployee(e._id)} />
                      {e.fullName} <span className="text-brand-text-muted text-xs">— {e.department}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-brand-text-secondary">Configure the timeline for each phase. Dates are optional and can be set later.</p>

              {[
                { label: 'Self Review Phase', color: 'bg-indigo-400', start: selfStart, end: selfEnd, setStart: setSelfStart, setEnd: setSelfEnd },
                { label: 'Manager Review Phase', color: 'bg-emerald-400', start: mgmtStart, end: mgmtEnd, setStart: setMgmtStart, setEnd: setMgmtEnd },
              ].map(phase => (
                <div key={phase.label} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('h-2 w-2 rounded-full', phase.color)} />
                    <p className="text-sm font-semibold text-brand-text">{phase.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-brand-text-muted uppercase tracking-wide">Start Date</label>
                      <input type="date" value={phase.start} onChange={e => phase.setStart(e.target.value)}
                        className="w-full h-9 mt-1 bg-white border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                    </div>
                    <div>
                      <label className="text-[11px] text-brand-text-muted uppercase tracking-wide">End Date</label>
                      <input type="date" value={phase.end} onChange={e => phase.setEnd(e.target.value)}
                        className="w-full h-9 mt-1 bg-white border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                    </div>
                  </div>
                </div>
              ))}

              {[
                { label: 'Calibration Session', color: 'bg-amber-400', on: calOn, setOn: setCalOn, date: calDate, setDate: setCalDate },
                { label: 'Results Sharing',     color: 'bg-violet-400', on: shareOn, setOn: setShareOn, date: shareDate, setDate: setShareDate },
              ].map(phase => (
                <div key={phase.label} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', phase.on ? phase.color : 'bg-slate-600')} />
                      <p className="text-sm font-semibold text-brand-text">{phase.label}</p>
                    </div>
                    <button type="button" onClick={() => phase.setOn((v: boolean) => !v)}
                      className={cn('h-5 w-9 rounded-full transition-colors relative', phase.on ? 'bg-brand-primary' : 'bg-brand-bg-muted')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', phase.on ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {phase.on && (
                    <div>
                      <label className="text-[11px] text-brand-text-muted uppercase tracking-wide">Date</label>
                      <input type="date" value={phase.date} onChange={e => phase.setDate(e.target.value)}
                        className="w-full h-9 mt-1 bg-white border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-indigo-400" />
                  <p className="text-sm font-bold text-brand-text">Review Summary</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Cycle Name',      value: name },
                    { label: 'Review Type',     value: CYCLE_TYPES.find(t => t.value === type)?.label },
                    { label: 'Template',        value: applicableTemplates.find(t => t._id === templateId)?.name ?? 'None' },
                    { label: 'Audience',        value: audienceType === 'all' ? 'All active employees'
                        : audienceType === 'departments' ? (audienceDepartments.join(', ') || 'No departments selected')
                        : `${audienceEmployeeIds.length} employee${audienceEmployeeIds.length !== 1 ? 's' : ''} selected` },
                    { label: 'Self Review',     value: selfStart && selfEnd ? `${selfStart} → ${selfEnd}` : 'Dates TBD' },
                    { label: 'Manager Review',  value: mgmtStart && mgmtEnd ? `${mgmtStart} → ${mgmtEnd}` : 'Dates TBD' },
                    { label: 'Calibration',     value: calOn   ? (calDate   || 'Date TBD') : 'Disabled' },
                    { label: 'Results Sharing', value: shareOn ? (shareDate || 'Date TBD') : 'Disabled' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-xs text-brand-text-muted">{label}</span>
                      <span className="text-xs text-brand-text-secondary font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-brand-text-muted">
                The cycle will be saved as a <span className="text-brand-text-secondary font-semibold">draft</span>. Use &quot;Launch&quot; on the cycle card to make it active.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-brand-border shrink-0 rounded-b-2xl">
          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create Cycle'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
