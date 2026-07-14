'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Users, ArrowLeft, CheckCircle2, Upload, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  headcount: number;
  description?: string;
  salaryRange?: { min: number; max: number; currency: string };
  screeningQuestions?: { id: string; question: string; required: boolean }[];
}

type View = 'detail' | 'form' | 'success';

export default function JobDetailPage() {
  const { locale, jobId } = useParams<{ locale: string; jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('detail');

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', location: '', linkedInUrl: '', coverLetter: '' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/public/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d) => setJob(d.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  const set = (field: keyof typeof form, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const fmtSalary = (s?: Job['salaryRange']) => s?.min ? `${s.currency} ${s.min.toLocaleString()}${s.max ? ` – ${s.max.toLocaleString()}` : '+'}` : null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) { setError('You must consent to data processing to apply.'); return; }
    const missingRequired = (job?.screeningQuestions || []).some((q) => q.required && !answers[q.id]?.trim());
    if (missingRequired) { setError('Please answer all required questions.'); return; }
    setSubmitting(true);
    setError('');

    const body = new FormData();
    body.append('firstName', form.firstName.trim());
    body.append('lastName', form.lastName.trim());
    body.append('email', form.email.trim());
    if (form.phone.trim()) body.append('phone', form.phone.trim());
    if (form.location.trim()) body.append('location', form.location.trim());
    if (form.linkedInUrl.trim()) body.append('linkedInUrl', form.linkedInUrl.trim());
    if (form.coverLetter.trim()) body.append('coverLetter', form.coverLetter.trim());
    if (resume) body.append('resume', resume);
    const answerList = (job?.screeningQuestions || [])
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ questionId: q.id, answer: answers[q.id].trim() }));
    if (answerList.length) body.append('answers', JSON.stringify(answerList));

    try {
      const res = await fetch(`${API_BASE}/public/jobs/${jobId}/apply`, { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Submission failed'); return; }
      setView('success');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Job not found or no longer open.
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h1>
          <p className="text-gray-400 text-sm mb-8">
            Thank you, <strong>{form.firstName}</strong>. We&apos;ve received your application for <strong>{job.title}</strong>. We&apos;ll be in touch via {form.email}.
          </p>
          <button onClick={() => router.push(`/${locale}/careers`)} className="text-blue-600 text-sm font-semibold hover:underline">
            Browse more positions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => (view === 'form' ? setView('detail') : router.push(`/${locale}/careers`))}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{job.title}</h1>
            <p className="text-xs text-gray-400">{view === 'detail' ? job.department : 'Application form'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {view === 'detail' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">{job.department}</span>
                  <h2 className="font-bold text-2xl text-gray-900 mt-2">{job.title}</h2>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {job.location} · <Users className="h-3.5 w-3.5" /> {job.employmentType}
                  </p>
                  {fmtSalary(job.salaryRange) && <p className="mt-2 text-sm text-emerald-600 font-semibold">{fmtSalary(job.salaryRange)} /month</p>}
                </div>
                <span className="shrink-0 text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-200">
                  {job.headcount} opening{job.headcount !== 1 ? 's' : ''}
                </span>
              </div>
              <button onClick={() => setView('form')} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200">
                Apply for this Position
              </button>
            </div>

            {job.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-3">About this Role</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
              </div>
            )}
          </div>
        )}

        {view === 'form' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Your Application</h2>
            <p className="text-sm text-gray-400 mb-6">Applying for: <strong className="text-gray-700">{job.title}</strong></p>

            <form onSubmit={handleApply} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name <span className="text-red-500">*</span></label>
                  <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name <span className="text-red-500">*</span></label>
                  <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                  <input value={form.location} onChange={(e) => set('location', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">LinkedIn URL</label>
                  <input value={form.linkedInUrl} onChange={(e) => set('linkedInUrl', e.target.value)} className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover Letter</label>
                <textarea value={form.coverLetter} onChange={(e) => set('coverLetter', e.target.value)} rows={5} className="border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 leading-relaxed" />
              </div>

              {(job.screeningQuestions || []).length > 0 && (
                <div className="space-y-4 border-t border-gray-100 pt-5">
                  {job.screeningQuestions!.map((q) => (
                    <div key={q.id} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {q.question} {q.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        required={q.required}
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        className="h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resume</label>
                {resume ? (
                  <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
                    <Upload className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-blue-700 font-medium flex-1 truncate">{resume.name}</span>
                    <button type="button" onClick={() => setResume(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <Upload className="h-6 w-6 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-400">Click to upload your resume</span>
                    <span className="text-xs text-gray-300 mt-1">PDF, DOC, DOCX (max 5MB)</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="mt-0.5" />
                I consent to my personal data being processed for recruitment purposes.
              </label>

              {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
