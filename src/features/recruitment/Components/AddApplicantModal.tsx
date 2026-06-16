'use client';

import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface JobPosition { _id: string; jobTitle: string; department: string; status: string }

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddApplicantModal({ onClose, onSuccess }: Props) {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [form, setForm] = useState({ positionId: '', fullName: '', email: '', phone: '', coverLetter: '', notes: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/positions`,
      params: { status: 'open' },
      showToast: false,
      thenFn: (r) => setPositions((r.data?.data ?? []).filter((p: JobPosition) => p.status === 'open')),
    });
  }, []);

  const set = (field: keyof typeof form, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData();
    fd.append('positionApplied', form.positionId);
    fd.append('fullName', form.fullName.trim());
    fd.append('email', form.email.trim());
    if (form.phone.trim()) fd.append('phone', form.phone.trim());
    if (form.coverLetter.trim()) fd.append('coverLetter', form.coverLetter.trim());
    if (form.notes.trim()) fd.append('notes', form.notes.trim());
    fd.append('source', 'hr_manual');
    if (cvFile) fd.append('cv', cvFile);

    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants`,
      method: 'POST',
      data: fd,
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-primary">Add Applicant</h2>
            <p className="text-xs text-foreground/50">Manually add a walk-in or emailed application</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="add-applicant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Position <span className="text-danger">*</span>
            </label>
            <select required value={form.positionId} onChange={(e) => set('positionId', e.target.value)}
              className="appearance-none h-10 w-full border border-gray-200 rounded-xl px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
              <option value="">Select open position…</option>
              {positions.map((p) => (
                <option key={p._id} value={p._id}>{p.jobTitle} — {p.department}</option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
              Full Name <span className="text-danger">*</span>
            </label>
            <input required type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
              placeholder="e.g. Jane Wanjiru"
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                Email <span className="text-danger">*</span>
              </label>
              <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="jane@example.com"
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="07xx xxx xxx"
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* CV Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">CV / Resume</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 h-10 border border-dashed border-gray-300 rounded-xl px-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Paperclip className="h-4 w-4 text-foreground/40 shrink-0" />
              <span className="text-sm text-foreground/50 truncate">
                {cvFile ? cvFile.name : 'Click to attach CV (PDF, DOC…)'}
              </span>
              {cvFile && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setCvFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="ml-auto text-foreground/30 hover:text-danger shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* Cover Letter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Cover Letter</label>
            <textarea value={form.coverLetter} onChange={(e) => set('coverLetter', e.target.value)}
              placeholder="Paste or type the applicant's cover letter…"
              rows={4}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* HR Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">HR Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Internal notes (not shared with applicant)…"
              rows={2}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-applicant-form" variant="accent" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Applicant'}
          </Button>
        </div>
      </div>
    </div>
  );
}
