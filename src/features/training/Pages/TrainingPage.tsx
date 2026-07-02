'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Play, CheckCircle, Clock, Users, Star,
  Plus, Search, Award, Target, X, UserPlus, Check,
} from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

type TrainingType = 'one_on_one' | 'time_based' | 'one_time' | 'refresher' | 'self_paced';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  trainingType: TrainingType;
  objectives: string[];
  duration: number;
  instructor: string;
  thumbnail: string | null;
  enrolledCount: number;
  rating: number;
  status: 'draft' | 'published';
  isMandatory: boolean;
  myEnrollment?: {
    _id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    completedObjectives: number[];
    objectives: string[];
    trainingType: string;
  } | null;
}

interface Enrollment {
  _id: string;
  courseId: string;
  courseTitle: string;
  category: string;
  trainingType: string;
  objectives: string[];
  completedObjectives: number[];
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  certificateUrl: string | null;
}

interface TrainingSummary {
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRAINING_TYPE_LABELS: Record<string, string> = {
  one_on_one:  '1-on-1 Training',
  time_based:  'Time-Based',
  one_time:    'One-Time Event',
  refresher:   'Refresher Course',
  self_paced:  'Self-Paced',
};

const LEVEL_STYLES: Record<string, { color: string; bg: string }> = {
  beginner:     { color: '#34d399', bg: '#d1fae520' },
  intermediate: { color: '#fbbf24', bg: '#fef3c720' },
  advanced:     { color: '#f87171', bg: '#fee2e220' },
};

const CAT_COLORS: Record<string, string> = {
  'Leadership': '#6366f1', 'Technical': '#3b82f6', 'Compliance': '#f59e0b',
  'Soft Skills': '#ec4899', 'Finance': '#22c55e', 'HR': '#a78bfa', 'Other': '#64748b',
};

function formatMins(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim();
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-4 border border-slate-700/60 bg-[#1e293b] ${className}`}>{children}</div>;
}

function ProgressBar({ value, color = '#6366f1' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
      ))}
      <span className="text-[11px] text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Add Course Modal ──────────────────────────────────────────────────────────

function AddCourseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical', level: 'beginner',
    duration: '', instructor: '', isMandatory: false,
    startTime: '', endTime: '', venue: '', trainingMode: 'in_person',
  });
  const [trainingType, setTrainingType] = useState<TrainingType>('self_paced');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const addObjective = () => setObjectives(prev => [...prev, '']);
  const removeObjective = (i: number) => setObjectives(prev => prev.filter((_, idx) => idx !== i));
  const setObjective = (i: number, val: string) =>
    setObjectives(prev => prev.map((o, idx) => idx === i ? val : o));

  const needsSchedule = trainingType !== 'self_paced' && trainingType !== 'refresher';

  const save = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    const payload = {
      ...form,
      duration: Number(form.duration) || 0,
      trainingType,
      objectives: trainingType === 'self_paced' ? objectives.filter(Boolean) : [],
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      venue: form.venue || null,
      trainingMode: form.trainingMode,
    };
    await apiCallFunction({
      url: `${API_BASE_URL}/training/courses`,
      method: 'POST',
      data: payload,
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#1e293b', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-[15px] font-bold text-slate-100">Create Course</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Title*</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Leadership Essentials"
              className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Description*</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none">
                {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          {/* Training Type */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Training Type</label>
            <select value={trainingType} onChange={e => setTrainingType(e.target.value as TrainingType)}
              className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none">
              <option value="one_on_one">1-on-1 Training</option>
              <option value="time_based">Time-Based</option>
              <option value="one_time">One-Time Event</option>
              <option value="refresher">Refresher Course</option>
              <option value="self_paced">Self-Paced</option>
            </select>
          </div>
          {/* Objectives (self_paced only) */}
          {trainingType === 'self_paced' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Objectives</label>
              <div className="space-y-2">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={obj}
                      onChange={e => setObjective(i, e.target.value)}
                      placeholder={`Objective ${i + 1}`}
                      className="flex-1 h-8 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {objectives.length > 1 && (
                      <button onClick={() => removeObjective(i)} className="text-slate-500 hover:text-red-400 shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addObjective}
                className="mt-2 text-[12px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Objective
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Instructor</label>
              <input value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Name"
                className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none" />
            </div>
          </div>

          {/* Schedule + venue — shown for non-self-paced training */}
          {needsSchedule && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Training Mode</label>
                <select value={form.trainingMode} onChange={e => set('trainingMode', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none">
                  <option value="in_person">In-Person / Face-to-Face</option>
                  <option value="google_meet">Remote — Google Meet</option>
                  <option value="zoom">Remote — Zoom</option>
                  <option value="microsoft_teams">Remote — Microsoft Teams</option>
                  <option value="hybrid">Hybrid (In-Person + Remote)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {form.trainingMode === 'in_person' ? 'Venue / Location' : 'Meeting Link or Room ID'}
                </label>
                <input value={form.venue} onChange={e => set('venue', e.target.value)}
                  placeholder={form.trainingMode === 'in_person' ? 'e.g. Board Room 2, HQ' : 'e.g. https://meet.google.com/abc-xyz'}
                  className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => set('isMandatory', !form.isMandatory)}
              className={`h-5 w-5 rounded border transition-colors flex items-center justify-center ${form.isMandatory ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
              {form.isMandatory && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
            <span className="text-[13px] text-slate-300">Mark as mandatory</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-slate-700">Cancel</button>
          <button onClick={save} disabled={saving || !form.title}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Course Player Modal ───────────────────────────────────────────────────────

interface CourseDetail {
  _id: string; title: string; description: string; category: string;
  level: string; duration: number; instructor: string; loginUrl?: string;
  trainingType: string; objectives: string[];
}

function CoursePlayerModal({
  enrollment, onClose, onSaved,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [course, setCourse]   = useState<CourseDetail | null>(null);
  const [completedObjectives, setCompletedObjectives] = useState<number[]>(enrollment.completedObjectives || []);
  const [progress, setProgress] = useState(enrollment.progress || 0);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: CourseDetail }>({
      url: `${API_BASE_URL}/training/courses/${enrollment.courseId}`,
      showToast: false,
      returnResponse: true,
      thenFn: r => { if (r?.data) setCourse(r.data); },
    });
  }, [enrollment.courseId]);

  const isSelfPaced = (enrollment.trainingType || course?.trainingType) === 'self_paced';
  const objectives = enrollment.objectives?.length ? enrollment.objectives : (course?.objectives || []);
  const totalObjectives = objectives.length;
  const catColor = CAT_COLORS[enrollment.category] || '#6366f1';

  const toggleObjectiveLocal = (idx: number) => {
    setSaving(true);
    setSaved(false);
    apiCallFunction<{ data: { completedObjectives: number[]; progress: number } }>({
      url: `${API_BASE_URL}/training/enrollments/${enrollment._id}/objective`,
      method: 'PATCH',
      data: { index: idx },
      showToast: false,
      returnResponse: true,
      thenFn: r => {
        if (r?.data) {
          setCompletedObjectives(r.data.completedObjectives);
          setProgress(r.data.progress);
          onSaved();
        }
      },
      finallyFn: () => setSaving(false),
    });
  };

  const markComplete = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/training/enrollments/${enrollment._id}/progress`,
      method: 'PUT',
      data: { progress: 100 },
      showToast: true,
      thenFn: () => { setSaved(true); onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  // For self_paced: can only complete when all objectives checked (or no objectives defined)
  const canComplete = isSelfPaced
    ? (totalObjectives === 0 || progress >= 100)
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,12,30,0.88)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0f172a', border: '1px solid #1e293b', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${catColor}20` }}>
              <BookOpen className="h-5 w-5" style={{ color: catColor }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-100">{enrollment.courseTitle}</h2>
              <p className="text-[11px] text-slate-500">
                {enrollment.category}
                {course?.instructor ? ` · ${course.instructor}` : ''}
                {course?.duration ? ` · ${formatMins(course.duration)}` : ''}
                {enrollment.trainingType ? ` · ${TRAINING_TYPE_LABELS[enrollment.trainingType] || enrollment.trainingType}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 shrink-0 ml-4"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Progress bar */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-slate-400 font-semibold">Overall Progress</span>
              <span className="font-bold" style={{ color: progress === 100 ? '#22c55e' : catColor }}>{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: progress === 100 ? '#22c55e' : catColor }} />
            </div>
            {course?.loginUrl && (
              <a href={course.loginUrl} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-2 text-[12px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                <Play className="h-3.5 w-3.5 fill-current" /> Open course in external platform
              </a>
            )}
          </div>

          {/* Course description */}
          {course?.description && (
            <div className="px-6 py-4 border-b border-slate-800">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">About this course</p>
              <p className="text-[13px] text-slate-300 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Objectives checklist (self_paced with objectives) */}
          {isSelfPaced && objectives.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
                Objectives ({completedObjectives.length}/{totalObjectives} complete)
              </p>
              <div className="space-y-2">
                {objectives.map((obj, i) => {
                  const isDone = completedObjectives.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => !saving && toggleObjectiveLocal(i)}
                      disabled={saving}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        isDone
                          ? 'bg-emerald-900/20 border-emerald-700/30'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/40 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                      }`}>
                        {isDone && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <p className={`text-[13px] font-medium flex-1 text-left ${isDone ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>
                        {obj}
                      </p>
                      {isDone && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {totalObjectives > 0 && progress < 100 && (
                <p className="text-[11px] text-slate-500 mt-3">
                  Complete all {totalObjectives} objectives to unlock &quot;Mark as Complete&quot;.
                </p>
              )}
            </div>
          )}

          {/* Non-self-paced: simple instructions */}
          {!isSelfPaced && enrollment.status === 'in_progress' && (
            <div className="px-6 py-4">
              <p className="text-[12px] text-slate-400">
                This is a{' '}
                <span className="text-slate-200 font-semibold">
                  {TRAINING_TYPE_LABELS[enrollment.trainingType] || enrollment.trainingType}
                </span>{' '}
                course. Mark it complete once you have finished.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">Close</button>
          <div className="flex items-center gap-2">
            {saved && !saving && (
              <span className="text-[12px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {enrollment.status !== 'completed' && canComplete && (
              <button
                onClick={markComplete}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-40 transition-colors"
              >
                {saving ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark as Complete
              </button>
            )}
            {enrollment.status !== 'completed' && !canComplete && (
              <span className="text-[12px] text-slate-500 italic">
                Check all objectives to complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── My Training Tab ───────────────────────────────────────────────────────────

function MyTrainingTab() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [summary, setSummary] = useState<TrainingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    apiCallFunction<{ data: { enrollments: Enrollment[]; summary: TrainingSummary } }>({
      url: `${API_BASE_URL}/training/my`,
      showToast: false,
      returnResponse: true,
      thenFn: r => {
        setEnrollments(r?.data?.enrollments || []);
        if (r?.data?.summary) setSummary(r.data.summary);
      },
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const inProgress = enrollments.filter(e => e.status === 'in_progress');
  const assigned   = enrollments.filter(e => e.status === 'not_started');
  const completed  = enrollments.filter(e => e.status === 'completed');

  const statusColor = (s: string) => s === 'completed' ? '#22c55e' : s === 'in_progress' ? '#6366f1' : '#94a3b8';

  const EnrollmentCard = ({ e }: { e: Enrollment }) => (
    <Card className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${CAT_COLORS[e.category] || '#6366f1'}20` }}>
        <BookOpen className="h-5 w-5" style={{ color: CAT_COLORS[e.category] || '#6366f1' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-slate-200 text-[14px]">{e.courseTitle}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0"
            style={{ background: `${statusColor(e.status)}20`, color: statusColor(e.status) }}>
            {e.status.replace(/_/g, ' ')}
          </span>
        </div>
        {e.trainingType && (
          <p className="text-[11px] text-slate-500 mt-0.5">{TRAINING_TYPE_LABELS[e.trainingType] || e.trainingType}</p>
        )}
        {e.status !== 'not_started' && (
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Progress</span><span>{e.progress}%</span>
            </div>
            <ProgressBar value={e.progress} color={statusColor(e.status)} />
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
          {e.dueDate && <span>Due: {formatDate(e.dueDate)}</span>}
          {e.completedAt && <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-3 w-3" /> {formatDate(e.completedAt)}</span>}
          {e.certificateUrl && <span className="flex items-center gap-1 text-amber-400"><Award className="h-3 w-3" /> Certificate</span>}
        </div>
      </div>
      {e.status !== 'completed' ? (
        <button
          onClick={() => setActiveEnrollment(e)}
          title={e.status === 'not_started' ? 'Start training' : 'Continue training'}
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors text-[12px] font-semibold"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {e.status === 'not_started' ? 'Start' : 'Continue'}
        </button>
      ) : (
        <button
          onClick={() => setActiveEnrollment(e)}
          title="Review course"
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-colors text-[12px] font-semibold"
        >
          <CheckCircle className="h-3.5 w-3.5" /> Review
        </button>
      )}
    </Card>
  );

  return (
    <div>
      {activeEnrollment && (
        <CoursePlayerModal
          enrollment={activeEnrollment}
          onClose={() => setActiveEnrollment(null)}
          onSaved={() => { fetchAll(); }}
        />
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Assigned', value: summary.assigned, color: '#6366f1', icon: Target },
            { label: 'In Progress', value: summary.inProgress, color: '#3b82f6', icon: Play },
            { label: 'Completed', value: summary.completed, color: '#22c55e', icon: CheckCircle },
            { label: 'Overdue', value: summary.overdue, color: summary.overdue > 0 ? '#f87171' : '#64748b', icon: Clock },
          ].map(s => (
            <Card key={s.label}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="text-[24px] font-black" style={{ color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-5">
          {inProgress.length > 0 && (
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">In Progress</h3>
              <div className="space-y-2">{inProgress.map(e => <EnrollmentCard key={e._id} e={e} />)}</div>
            </div>
          )}
          {assigned.length > 0 && (
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned</h3>
              <div className="space-y-2">{assigned.map(e => <EnrollmentCard key={e._id} e={e} />)}</div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Completed</h3>
              <div className="space-y-2">{completed.map(e => <EnrollmentCard key={e._id} e={e} />)}</div>
            </div>
          )}
          {enrollments.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No courses assigned yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Assign Course Modal ───────────────────────────────────────────────────────

interface Employee { _id: string; fullName: string; staffNumber: string; department: string }

function AssignCourseModal({ course, onClose, onDone }: { course: Course; onClose: () => void; onDone: () => void }) {
  const [search, setSearch]           = useState('');
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [dueDate, setDueDate]         = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setEmployees(r?.data?.data ?? []),
    });
  }, []);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.staffNumber.includes(search)
  );

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(e => e._id)));

  const assign = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/training/courses/${course._id}/assign`,
      method: 'POST',
      data: { employeeIds: [...selected], dueDate: dueDate || null },
      thenFn: () => { onDone(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: '#1e293b', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-100">Assign to Employees</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>

        {/* Search + due date */}
        <div className="px-5 pt-4 pb-3 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or staff ID…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-800 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-slate-400 shrink-0">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="h-8 px-3 rounded-lg bg-slate-800 text-slate-200 text-[12px] border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Select-all row */}
        <div className="px-5 pb-2 shrink-0">
          <button onClick={toggleAll} className="flex items-center gap-2 text-[12px] text-indigo-400 hover:text-indigo-300">
            <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
              {selected.size === filtered.length && filtered.length > 0 && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : `Select all (${filtered.length})`}
          </button>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1 min-h-0">
          {filtered.length === 0
            ? <p className="text-[12px] text-slate-500 text-center py-8">No employees found</p>
            : filtered.map(e => {
                const isOn = selected.has(e._id);
                return (
                  <button key={e._id} onClick={() => toggle(e._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isOn ? 'bg-indigo-600/20 border border-indigo-600/30' : 'hover:bg-slate-700/50 border border-transparent'}`}>
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isOn ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
                      {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="h-7 w-7 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-indigo-300">
                      {e.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-200 truncate">{e.fullName}</p>
                      <p className="text-[11px] text-slate-500">{e.staffNumber} · {e.department}</p>
                    </div>
                  </button>
                );
              })
          }
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700 shrink-0">
          <span className="text-[12px] text-slate-400">{selected.size} employee{selected.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-slate-700">Cancel</button>
            <button onClick={assign} disabled={saving || selected.size === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
              <UserPlus className="h-3.5 w-3.5" />
              {saving ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Course Catalog Tab ────────────────────────────────────────────────────────

function CatalogTab({ isHR }: { isHR: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchCourses = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (catFilter !== 'all') params.category = catFilter;
    if (levelFilter !== 'all') params.level = levelFilter;
    apiCallFunction<{ data: Course[] }>({
      url: `${API_BASE_URL}/training/courses`,
      params,
      showToast: false,
      returnResponse: true,
      thenFn: r => setCourses(r?.data || []),
    });
  }, [search, catFilter, levelFilter]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const enroll = (courseId: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/training/courses/${courseId}/enroll`, method: 'POST', thenFn: fetchCourses });
  };

  const startCourse = (courseId: string) => {
    setStartingId(courseId);
    apiCallFunction({
      url: `${API_BASE_URL}/training/courses/${courseId}/start`,
      method: 'POST',
      thenFn: fetchCourses,
      finallyFn: () => setStartingId(null),
    });
  };

  return (
    <div>
      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} onSaved={fetchCourses} />}
      {assignCourse && <AssignCourseModal course={assignCourse} onClose={() => setAssignCourse(null)} onDone={fetchCourses} />}

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-800 text-slate-200 text-[13px] border border-slate-700 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-slate-800 text-slate-300 text-[13px] border border-slate-700 focus:outline-none">
          <option value="all">All Categories</option>
          {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-slate-800 text-slate-300 text-[13px] border border-slate-700 focus:outline-none">
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        {isHR && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors ml-auto">
            <Plus className="h-3.5 w-3.5" /> Add Course
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {courses.map(c => {
          const level = LEVEL_STYLES[c.level] || LEVEL_STYLES.beginner;
          const catColor = CAT_COLORS[c.category] || '#64748b';
          const enrollment = c.myEnrollment;

          return (
            <div key={c._id} className="rounded-2xl overflow-hidden border border-slate-700/60 bg-[#1e293b] flex flex-col">
              {/* Thumbnail */}
              <div className="h-28 flex items-center justify-center relative" style={{ background: `${catColor}15` }}>
                <BookOpen className="h-8 w-8 opacity-30" style={{ color: catColor }} />
                {c.isMandatory && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/30 text-red-400">
                    Mandatory
                  </span>
                )}
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${catColor}20`, color: catColor }}>
                  {c.category}
                </span>
                {c.trainingType && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-slate-300">
                    {TRAINING_TYPE_LABELS[c.trainingType] || c.trainingType}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-slate-100 text-[14px] leading-tight">{c.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize" style={{ background: level.bg, color: level.color }}>
                    {c.level}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 mb-3 flex-1 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-3 mb-3">
                  <Stars rating={c.rating} />
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" /> {formatMins(c.duration)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Users className="h-3 w-3" /> {c.enrolledCount}
                  </div>
                </div>

                {/* 3-phase enrollment UI */}
                <div className={`grid gap-2 ${isHR ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {!enrollment ? (
                    // Phase 1: Not enrolled
                    <button onClick={() => enroll(c._id)}
                      className="h-8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5">
                      <Play className="h-3 w-3 fill-current" /> Enroll
                    </button>
                  ) : enrollment.status === 'not_started' ? (
                    // Phase 2: Enrolled, not started
                    <button
                      onClick={() => startCourse(c._id)}
                      disabled={startingId === c._id}
                      className="h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <Play className="h-3 w-3 fill-current" />
                      {startingId === c._id ? 'Starting…' : 'Start Course'}
                    </button>
                  ) : enrollment.status === 'in_progress' ? (
                    // Phase 3: In progress — show inline progress
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">In Progress</span>
                        <span className="font-semibold text-indigo-400">{enrollment.progress}%</span>
                      </div>
                      <ProgressBar value={enrollment.progress} color="#6366f1" />
                      <p className="text-[10px] text-slate-500 text-center pt-0.5">Open My Training to continue</p>
                    </div>
                  ) : (
                    // Completed
                    <div className="h-8 rounded-lg bg-slate-700/50 text-slate-400 text-[12px] font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      Completed
                    </div>
                  )}
                  {isHR && (
                    <button onClick={() => setAssignCourse(c)}
                      className="h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5">
                      <UserPlus className="h-3 w-3" /> Assign
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No courses found
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = ['my_training', 'catalog'] as const;
type TabType = typeof TABS[number];
const TAB_LABELS: Record<TabType, string> = { my_training: 'My Training', catalog: 'Course Catalog' };

export default function TrainingPage() {
  const { isHR } = useAuth();
  const [tab, setTab] = useState<TabType>('my_training');

  return (
    <div className="min-h-full" style={{ background: '#0f172a' }}>
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-slate-100">Training</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Learning paths, courses, and certifications</p>
      </div>

      <div className="flex border-b border-slate-700/50 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-[13px] font-semibold relative transition-colors ${tab === t ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {TAB_LABELS[t]}
            {tab === t && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-500 rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'my_training' && <MyTrainingTab />}
      {tab === 'catalog'     && <CatalogTab isHR={isHR} />}
    </div>
  );
}
