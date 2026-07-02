'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Setup', 'Phases', 'Review'] as const;
type Step = 0 | 1 | 2;

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

  const [name, setName]       = useState('');
  const [type, setType]       = useState('self_manager');
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
  const canNext = step === 0 ? name.trim().length > 0 : true;

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      type,
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
      <div className="relative z-10 w-full max-w-[640px] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100">Start Review Cycle</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-700 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                i < step ? 'text-indigo-400' : i === step ? 'text-slate-100' : 'text-slate-600',
              )}>
                <div className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                  i < step  ? 'bg-indigo-500 border-indigo-500 text-white' :
                  i === step ? 'border-indigo-500 text-indigo-400' :
                               'border-slate-700 text-slate-600',
                )}>
                  {i < step ? '✓' : i + 1}
                </div>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Cycle Name <span className="text-red-400">*</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Annual Review 2026"
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Review Type <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {CYCLE_TYPES.map(ct => (
                    <button key={ct.value} type="button" onClick={() => setType(ct.value)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                        type === ct.value
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600',
                      )}>
                      <div className={cn(
                        'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0',
                        type === ct.value ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600',
                      )} />
                      <div>
                        <p className={cn('text-sm font-semibold', type === ct.value ? 'text-indigo-300' : 'text-slate-200')}>{ct.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{ct.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Configure the timeline for each phase. Dates are optional and can be set later.</p>

              {[
                { label: 'Self Review Phase', color: 'bg-indigo-400', start: selfStart, end: selfEnd, setStart: setSelfStart, setEnd: setSelfEnd },
                { label: 'Manager Review Phase', color: 'bg-emerald-400', start: mgmtStart, end: mgmtEnd, setStart: setMgmtStart, setEnd: setMgmtEnd },
              ].map(phase => (
                <div key={phase.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('h-2 w-2 rounded-full', phase.color)} />
                    <p className="text-sm font-semibold text-slate-200">{phase.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide">Start Date</label>
                      <input type="date" value={phase.start} onChange={e => phase.setStart(e.target.value)}
                        className="w-full h-9 mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide">End Date</label>
                      <input type="date" value={phase.end} onChange={e => phase.setEnd(e.target.value)}
                        className="w-full h-9 mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>
              ))}

              {[
                { label: 'Calibration Session', color: 'bg-amber-400', on: calOn, setOn: setCalOn, date: calDate, setDate: setCalDate },
                { label: 'Results Sharing',     color: 'bg-violet-400', on: shareOn, setOn: setShareOn, date: shareDate, setDate: setShareDate },
              ].map(phase => (
                <div key={phase.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', phase.on ? phase.color : 'bg-slate-600')} />
                      <p className="text-sm font-semibold text-slate-200">{phase.label}</p>
                    </div>
                    <button type="button" onClick={() => phase.setOn((v: boolean) => !v)}
                      className={cn('h-5 w-9 rounded-full transition-colors relative', phase.on ? 'bg-indigo-500' : 'bg-slate-700')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', phase.on ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {phase.on && (
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase tracking-wide">Date</label>
                      <input type="date" value={phase.date} onChange={e => phase.setDate(e.target.value)}
                        className="w-full h-9 mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-indigo-400" />
                  <p className="text-sm font-bold text-slate-100">Review Summary</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Cycle Name',      value: name },
                    { label: 'Review Type',     value: CYCLE_TYPES.find(t => t.value === type)?.label },
                    { label: 'Self Review',     value: selfStart && selfEnd ? `${selfStart} → ${selfEnd}` : 'Dates TBD' },
                    { label: 'Manager Review',  value: mgmtStart && mgmtEnd ? `${mgmtStart} → ${mgmtEnd}` : 'Dates TBD' },
                    { label: 'Calibration',     value: calOn   ? (calDate   || 'Date TBD') : 'Disabled' },
                    { label: 'Results Sharing', value: shareOn ? (shareDate || 'Date TBD') : 'Disabled' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs text-slate-300 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                The cycle will be saved as a <span className="text-slate-300 font-semibold">draft</span>. Use &quot;Launch&quot; on the cycle card to make it active.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-700 shrink-0 rounded-b-2xl">
          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create Cycle'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
