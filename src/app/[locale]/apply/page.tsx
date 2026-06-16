'use client';

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Users, ChevronRight, ArrowLeft, CheckCircle2, Upload, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface Position {
  _id: string;
  jobTitle: string;
  department: string;
  jobCategory?: string;
  jobDescription?: string;
  requiredQualifications?: string[];
  yearsOfExperience?: number;
  salaryBandMin?: number;
  salaryBandMax?: number;
  numberOfOpenings: number;
  stageRequirements?: Array<{ stage: string; description: string }>;
}

type View = 'list' | 'detail' | 'form' | 'success';

export default function PublicApplyPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Position | null>(null);
  const [view, setView] = useState<View>('list');

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', coverLetter: '' });
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/public/positions`)
      .then((r) => r.json())
      .then((d) => setPositions(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof typeof form, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');

    const body = new FormData();
    body.append('positionId', selected._id);
    body.append('fullName', form.fullName.trim());
    body.append('email', form.email.trim());
    if (form.phone.trim()) body.append('phone', form.phone.trim());
    if (form.coverLetter.trim()) body.append('coverLetter', form.coverLetter.trim());
    if (cv) body.append('cv', cv);

    try {
      const res = await fetch(`${API_BASE}/public/apply`, { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Submission failed'); return; }
      setView('success');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtKES = (n?: number) => n ? `KES ${n.toLocaleString('en-KE')}` : null;

  const stages = selected?.stageRequirements ?? [];

  // ── Success ───────────────────────────────────────────────────────────────
  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h1>
          <p className="text-gray-500 text-sm mb-1">
            Thank you, <strong>{form.fullName}</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            We&apos;ve received your application for <strong>{selected?.jobTitle}</strong>. Our team will review it and be in touch via {form.email}.
          </p>
          <button
            onClick={() => { setView('list'); setSelected(null); setForm({ fullName: '', email: '', phone: '', coverLetter: '' }); setCv(null); }}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            Browse more positions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          {(view === 'detail' || view === 'form') && (
            <button
              onClick={() => setView(view === 'form' ? 'detail' : 'list')}
              className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Open Positions</h1>
            <p className="text-xs text-gray-400">
              {view === 'list' ? `${positions.length} position${positions.length !== 1 ? 's' : ''} available` :
               view === 'detail' ? selected?.jobTitle :
               `Apply — ${selected?.jobTitle}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── List view ── */}
        {view === 'list' && (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No open positions at the moment.</p>
                <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((pos) => (
                  <button
                    key={pos._id}
                    onClick={() => { setSelected(pos); setView('detail'); }}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                            {pos.jobCategory ?? 'General'}
                          </span>
                          <span className="text-[11px] text-gray-400">{pos.numberOfOpenings} opening{pos.numberOfOpenings !== 1 ? 's' : ''}</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">{pos.jobTitle}</h2>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pos.department}</span>
                          {pos.yearsOfExperience ? <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pos.yearsOfExperience}+ yrs exp</span> : null}
                        </div>
                        {fmtKES(pos.salaryBandMin) && (
                          <p className="mt-2 text-xs text-emerald-600 font-semibold">
                            {fmtKES(pos.salaryBandMin)}{pos.salaryBandMax ? ` – ${fmtKES(pos.salaryBandMax)}` : '+'}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Detail view ── */}
        {view === 'detail' && selected && (
          <div className="space-y-6">
            {/* Hero card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                    {selected.jobCategory ?? 'General'}
                  </span>
                  <h2 className="font-bold text-2xl text-gray-900 mt-2">{selected.jobTitle}</h2>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {selected.department}
                    {selected.yearsOfExperience ? <> · {selected.yearsOfExperience}+ years experience</> : null}
                  </p>
                  {fmtKES(selected.salaryBandMin) && (
                    <p className="mt-2 text-sm text-emerald-600 font-semibold">
                      {fmtKES(selected.salaryBandMin)}{selected.salaryBandMax ? ` – ${fmtKES(selected.salaryBandMax)}` : '+'} /month
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-200">
                  {selected.numberOfOpenings} opening{selected.numberOfOpenings !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setView('form')}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200"
              >
                Apply for this Position
              </button>
            </div>

            {/* Job description */}
            {selected.jobDescription && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-3">About this Role</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{selected.jobDescription}</p>
              </div>
            )}

            {/* Qualifications */}
            {(selected.requiredQualifications ?? []).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-3">Required Qualifications</h3>
                <ul className="space-y-2">
                  {selected.requiredQualifications!.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recruitment stages */}
            {stages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Recruitment Process</h3>
                <div className="space-y-3">
                  {stages.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{s.stage.replace(/_/g, ' ')}</p>
                        {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setView('form')}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
            >
              Apply Now
            </button>
          </div>
        )}

        {/* ── Application form ── */}
        {view === 'form' && selected && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Your Application</h2>
            <p className="text-sm text-gray-400 mb-6">Applying for: <strong className="text-gray-700">{selected.jobTitle}</strong></p>

            <form onSubmit={handleApply} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    placeholder="Jane Wanjiru"
                    className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="jane@example.com"
                    className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="07xx xxx xxx"
                  className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover Letter</label>
                <textarea
                  value={form.coverLetter}
                  onChange={(e) => set('coverLetter', e.target.value)}
                  placeholder="Tell us why you're the right fit for this role…"
                  rows={5}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 leading-relaxed"
                />
              </div>

              {/* CV upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CV / Resume</label>
                {cv ? (
                  <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
                    <Upload className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-blue-700 font-medium flex-1 truncate">{cv.name}</span>
                    <button type="button" onClick={() => setCv(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <Upload className="h-6 w-6 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-400">Click to upload your CV</span>
                    <span className="text-xs text-gray-300 mt-1">PDF, DOC, DOCX (max 5MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCv(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
