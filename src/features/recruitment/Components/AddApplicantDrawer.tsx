'use client';

import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Paperclip, ChevronDown } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { STAGES, STAGE_CONFIG } from '../constants';

interface JobPosition { _id: string; jobTitle: string; department: string; status: string }

const SOURCES = [
  { value: 'hr_manual', label: 'Added Manually'  },
  { value: 'internal',  label: 'Internal'         },
  { value: 'linkedin',  label: 'LinkedIn'         },
  { value: 'indeed',    label: 'Indeed'           },
  { value: 'referral',  label: 'Referral'         },
  { value: 'website',   label: 'Company Website'  },
  { value: 'other',     label: 'Other'            },
];

interface Props { onClose: () => void; onSuccess: () => void }

export function AddApplicantDrawer({ onClose, onSuccess }: Props) {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [form, setForm] = useState({
    positionId: '',
    fullName: '',
    email: '',
    phone: '',
    stage: 'applied',
    source: 'hr_manual',
    appliedDate: new Date().toISOString().split('T')[0],
    coverLetter: '',
    notes: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/positions`,
      params: { status: 'open' },
      showToast: false,
      thenFn: r => setPositions((r.data?.data ?? []).filter((p: JobPosition) => p.status === 'open')),
    });
  }, []);

  const set = (field: keyof typeof form, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append('positionApplied', form.positionId);
    fd.append('fullName', form.fullName.trim());
    fd.append('email', form.email.trim());
    if (form.phone.trim()) fd.append('phone', form.phone.trim());
    fd.append('stage', form.stage);
    fd.append('source', form.source);
    if (form.appliedDate) fd.append('appliedAt', form.appliedDate);
    if (form.coverLetter.trim()) fd.append('coverLetter', form.coverLetter.trim());
    if (form.notes.trim()) fd.append('notes', form.notes.trim());
    if (cvFile) fd.append('cv', cvFile);
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants`,
      method: 'POST',
      data: fd,
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  const inp = 'h-10 border border-gray-200 rounded-xl px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300';
  const sel = `${inp} bg-white appearance-none pr-8`;
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-[560px] max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-slate-900">Add Applicant</h2>
            <p className="text-xs text-slate-400">Manually add a walk-in or emailed application</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="add-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Personal Info */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Personal Information</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
                <input required type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
                  placeholder="e.g. Jane Wanjiru" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="jane@example.com" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="07xx xxx xxx" className={inp} />
                </div>
              </div>
            </div>
          </section>

          {/* Application Details */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Application Details</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Position <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select required value={form.positionId} onChange={e => set('positionId', e.target.value)} className={sel}>
                    <option value="">Select open position…</option>
                    {positions.map(p => <option key={p._id} value={p._id}>{p.jobTitle} — {p.department}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Stage</label>
                  <div className="relative">
                    <select value={form.stage} onChange={e => set('stage', e.target.value)} className={sel}>
                      {STAGES.filter(s => s !== 'hired' && s !== 'rejected').map(s => (
                        <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Source <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select required value={form.source} onChange={e => set('source', e.target.value)} className={sel}>
                      {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Applied Date</label>
                <input type="date" value={form.appliedDate} onChange={e => set('appliedDate', e.target.value)} className={inp} />
              </div>
            </div>
          </section>

          {/* CV Upload */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">CV / Resume</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 h-12 border-2 border-dashed border-gray-200 rounded-xl px-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-400 truncate flex-1">
                {cvFile ? cvFile.name : 'Click to attach CV (PDF, DOC…)'}
              </span>
              {cvFile && (
                <button type="button"
                  onClick={e => { e.stopPropagation(); setCvFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
          </section>

          {/* Notes */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Internal Notes</p>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notes visible only to HR team…"
              rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 w-full"
            />
          </section>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button type="button" onClick={onClose}
            className="h-10 px-5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-drawer-form" disabled={submitting}
            className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
            {submitting ? 'Adding…' : 'Add Applicant'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
