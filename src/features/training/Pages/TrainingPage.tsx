'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Play, CheckCircle, Clock, Users, Star,
  Plus, Search, Award, Target, X, UserPlus, Check,
  Film, FileText, Upload, RefreshCw,
} from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/hooks/useAuth';

// ── Backend base URL for static file serving ──────────────────────────────────

const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');
function materialUrl(filename: string): string {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  return `${BACKEND_URL}/uploads/training/${filename}?token=${encodeURIComponent(token)}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TrainingType = 'one_on_one' | 'time_based' | 'recurring_event' | 'refresher' | 'self_paced';

interface Material {
  _id: string;
  title: string;
  type: 'video' | 'pdf' | 'other';
  filename: string;
  originalName: string;
  size: number;
  wordCount?: number | null;
  minReadTimeSeconds?: number | null;
}

type MatProgress = Record<string, {
  videoPositionSeconds?: number;
  timeSpentSeconds?: number;
  completed?: boolean;
}>;

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
  isRecurring?: boolean;
  recurringFrequency?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  trainingMode?: string;
  link?: string | null;
  location?: { address: string; venue: string } | null;
  materials?: Material[];
  myEnrollment?: {
    _id: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'auto_completed';
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
  status: 'not_started' | 'in_progress' | 'completed' | 'auto_completed';
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  minutesPresent: number | null;
  certificateUrl: string | null;
  materialProgress?: MatProgress;
}

interface TrainingSummary {
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface CourseDetail {
  _id: string; title: string; description: string; category: string;
  level: string; duration: number; instructor: string; loginUrl?: string;
  trainingType: string; objectives: string[];
  materials?: Material[];
  startTime?: string | null;
  endTime?: string | null;
  trainingMode?: string;
  link?: string | null;
  location?: { address: string; venue: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRAINING_TYPE_LABELS: Record<string, string> = {
  one_on_one:      '1-on-1 Training',
  time_based:      'Time-Based',
  recurring_event: 'Recurring Event',
  one_time:        'Recurring Event',
  refresher:       'Refresher Course',
  self_paced:      'Self-Paced',
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

const FREQ_LABELS: Record<string, string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  monthly:   'Monthly',
  quarterly: 'Quarterly (every 3 months)',
  annually:  'Annually',
};

function formatMins(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim();
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

// ── Video Material Player ─────────────────────────────────────────────────────

function VideoMaterialPlayer({
  material, enrollmentId, savedPosition, onComplete,
}: {
  material: Material; enrollmentId: string; savedPosition?: number; onComplete: () => void;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastSaved = useRef(savedPosition ?? 0);

  useEffect(() => {
    const video = videoRef.current;
    if (video && savedPosition && savedPosition > 2) {
      video.currentTime = savedPosition;
    }
  }, [savedPosition]);

  const pushPosition = useCallback((pos: number) => {
    if (Math.abs(pos - lastSaved.current) < 5) return;
    lastSaved.current = pos;
    apiCallFunction({
      url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/material-progress`,
      method: 'PUT',
      data: { materialId: String(material._id), videoPositionSeconds: Math.floor(pos) },
      showToast: false,
    });
  }, [enrollmentId, material._id]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => pushPosition(video.currentTime), 30000);
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (video) pushPosition(video.duration);
    apiCallFunction({
      url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/material-progress`,
      method: 'PUT',
      data: { materialId: String(material._id), completed: true },
      showToast: false,
      thenFn: onComplete,
    });
  };

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={materialUrl(material.filename)}
        controls
        className="w-full max-h-72"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => { const v = videoRef.current; if (v) pushPosition(v.currentTime); }}
      />
      <p className="text-[11px] text-slate-500 px-3 py-2">
        Your position is saved every 30 s — you can continue from where you left off after logging out.
      </p>
    </div>
  );
}

// ── PDF Material Viewer ───────────────────────────────────────────────────────

function PDFMaterialViewer({
  material, enrollmentId, savedTimeSeconds, onComplete,
}: {
  material: Material; enrollmentId: string; savedTimeSeconds?: number; onComplete: () => void;
}) {
  const [timeSpent, setTimeSpent] = useState(savedTimeSeconds ?? 0);
  const timerRef  = useRef<ReturnType<typeof setInterval>>();
  const lastSaved = useRef(savedTimeSeconds ?? 0);

  const minTime    = material.minReadTimeSeconds ?? 0;
  const canComplete = minTime === 0 || timeSpent >= minTime;
  const pct        = minTime > 0 ? Math.min(100, Math.round((timeSpent / minTime) * 100)) : 100;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => {
        const next = prev + 1;
        if (next - lastSaved.current >= 30) {
          lastSaved.current = next;
          apiCallFunction({
            url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/material-progress`,
            method: 'PUT',
            data: { materialId: String(material._id), timeSpentSeconds: next },
            showToast: false,
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [enrollmentId, material._id]);

  const handleMarkRead = () => {
    apiCallFunction({
      url: `${API_BASE_URL}/training/enrollments/${enrollmentId}/material-progress`,
      method: 'PUT',
      data: { materialId: String(material._id), timeSpentSeconds: timeSpent, completed: true },
      showToast: false,
      thenFn: onComplete,
    });
  };

  return (
    <div className="space-y-2">
      <iframe
        src={materialUrl(material.filename)}
        className="w-full rounded-lg border border-slate-700"
        style={{ height: '380px' }}
        title={material.title}
      />
      <div className="space-y-1.5">
        {minTime > 0 && (
          <>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Time reading: <strong className="text-slate-300">{formatTime(timeSpent)}</strong></span>
              <span>Required: {formatTime(minTime)}</span>
            </div>
            <ProgressBar value={pct} color={canComplete ? '#22c55e' : '#6366f1'} />
            {!canComplete && (
              <p className="text-[10px] text-slate-500">
                Please read the full document — {formatTime(minTime - timeSpent)} remaining before you can mark this as read.
              </p>
            )}
          </>
        )}
        {canComplete && (
          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold transition-colors"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Mark as Read
          </button>
        )}
      </div>
    </div>
  );
}

// ── Materials Manager Modal (HR) ──────────────────────────────────────────────

function MaterialsManagerModal({
  course, onClose, onSaved,
}: {
  course: Course; onClose: () => void; onSaved: () => void;
}) {
  const [materials, setMaterials] = useState<Material[]>(course.materials || []);
  const [file, setFile]           = useState<File | null>(null);
  const [matTitle, setMatTitle]   = useState('');
  const [wordCount, setWordCount] = useState('');
  const [uploading, setUploading] = useState(false);

  const isPDF = file?.type === 'application/pdf';

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    if (matTitle) fd.append('title', matTitle);
    if (wordCount && isPDF) fd.append('wordCount', wordCount);
    await apiCallFunction<{ data: Material }>({
      url: `${API_BASE_URL}/training/courses/${course._id}/materials`,
      method: 'POST',
      data: fd,
      returnResponse: true,
      thenFn: (r: any) => {
        const mat = r?.data;
        if (mat) setMaterials(prev => [...prev, mat]);
        setFile(null); setMatTitle(''); setWordCount('');
        onSaved();
      },
    });
    setUploading(false);
  };

  const remove = async (materialId: string) => {
    await apiCallFunction({
      url: `${API_BASE_URL}/training/courses/${course._id}/materials/${materialId}`,
      method: 'DELETE',
      thenFn: () => {
        setMaterials(prev => prev.filter(m => String(m._id) !== materialId));
        onSaved();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#1e293b', maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-100">Manage Materials</h2>
            <p className="text-[11px] text-slate-500 truncate max-w-xs">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {materials.length > 0 && (
            <div className="space-y-2">
              {materials.map(m => (
                <div key={String(m._id)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: m.type === 'video' ? '#6366f120' : '#f59e0b20' }}>
                    {m.type === 'video'
                      ? <Film className="h-4 w-4 text-indigo-400" />
                      : <FileText className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-200 truncate">{m.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {m.type.toUpperCase()}
                      {m.wordCount ? ` · ${m.wordCount.toLocaleString()} words` : ''}
                      {m.minReadTimeSeconds ? ` · ~${Math.ceil(m.minReadTimeSeconds / 60)} min read` : ''}
                    </p>
                  </div>
                  <button onClick={() => remove(String(m._id))} className="text-slate-500 hover:text-red-400 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={`${materials.length > 0 ? 'border-t border-slate-700 pt-4' : ''} space-y-3`}>
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Upload New Material</p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">File (PDF or Video — max 500 MB)</label>
              <input
                type="file"
                accept=".pdf,video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-[12px] text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-[12px] file:cursor-pointer"
              />
            </div>
            {file && (
              <>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Title (optional)</label>
                  <input
                    value={matTitle}
                    onChange={e => setMatTitle(e.target.value)}
                    placeholder={file.name}
                    className="w-full h-8 px-3 rounded-lg bg-slate-700 text-slate-200 text-[12px] border border-slate-600 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                {isPDF && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Word count (sets minimum read time)</label>
                    <input
                      type="number"
                      value={wordCount}
                      onChange={e => setWordCount(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full h-8 px-3 rounded-lg bg-slate-700 text-slate-200 text-[12px] border border-slate-600 focus:outline-none"
                    />
                    {wordCount && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Min read time: ~{Math.ceil(Number(wordCount) / 200)} min (200 words/min average)
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="w-full h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading…' : 'Upload Material'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-700 shrink-0">
          <button onClick={onClose} className="w-full h-9 rounded-lg text-[13px] text-slate-400 hover:bg-slate-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Course Modal ──────────────────────────────────────────────────────────

function AddCourseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical', level: 'beginner',
    duration: '', instructor: '',
    isMandatory: false, isRecurring: false, recurringFrequency: 'weekly',
    startTime: '', endTime: '',
    locationAddress: '', locationVenue: '',
    link: '',
    trainingMode: 'in_person',
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
  const isInPerson = ['in_person', 'hybrid'].includes(form.trainingMode);
  const isRemote   = ['google_meet', 'zoom', 'microsoft_teams', 'hybrid'].includes(form.trainingMode);

  const save = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    const payload = {
      title:             form.title,
      description:       form.description,
      category:          form.category,
      level:             form.level,
      duration:          Number(form.duration) || 0,
      instructor:        form.instructor,
      isMandatory:       form.isMandatory,
      isRecurring:       form.isRecurring,
      recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
      trainingType,
      objectives:        trainingType === 'self_paced' ? objectives.filter(Boolean) : [],
      startTime:         needsSchedule && form.startTime ? form.startTime : null,
      endTime:           needsSchedule && form.endTime   ? form.endTime   : null,
      trainingMode:      needsSchedule ? form.trainingMode : 'in_person',
      link:     needsSchedule && isRemote   && form.link            ? form.link            : null,
      location: needsSchedule && isInPerson
        ? { address: form.locationAddress, venue: form.locationVenue }
        : null,
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

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Training Type</label>
            <select value={trainingType} onChange={e => setTrainingType(e.target.value as TrainingType)}
              className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none">
              <option value="one_on_one">1-on-1 Training</option>
              <option value="time_based">Time-Based</option>
              <option value="recurring_event">Recurring Event</option>
              <option value="refresher">Refresher Course</option>
              <option value="self_paced">Self-Paced</option>
            </select>
          </div>

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

          {(trainingType === 'self_paced' || trainingType === 'refresher') && (
            <p className="text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2">
              After creating the course, upload videos and PDFs from the course card using the <strong className="text-slate-400">Materials</strong> button.
            </p>
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

          {needsSchedule && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Start Date &amp; Time</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">End Date &amp; Time</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => set('endTime', e.target.value)}
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

              {isRemote && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Meeting Link</label>
                  <input value={form.link} onChange={e => set('link', e.target.value)}
                    placeholder="https://meet.google.com/abc-xyz-def"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              )}

              {isInPerson && (
                <>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Address / Google Maps Location</label>
                    <input value={form.locationAddress} onChange={e => set('locationAddress', e.target.value)}
                      placeholder="e.g. 123 Moi Avenue, Nairobi CBD"
                      className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Room / Venue</label>
                    <input value={form.locationVenue} onChange={e => set('locationVenue', e.target.value)}
                      placeholder="e.g. Board Room 2, 3rd Floor"
                      className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div onClick={() => set('isMandatory', !form.isMandatory)}
                className={`h-5 w-5 rounded border transition-colors flex items-center justify-center ${form.isMandatory ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
                {form.isMandatory && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <span className="text-[13px] text-slate-300">Mandatory</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div onClick={() => set('isRecurring', !form.isRecurring)}
                className={`h-5 w-5 rounded border transition-colors flex items-center justify-center ${form.isRecurring ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-800'}`}>
                {form.isRecurring && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <span className="text-[13px] text-slate-300 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Recurring
              </span>
            </label>
          </div>

          {form.isRecurring && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Recurring Frequency</label>
              <select value={form.recurringFrequency} onChange={e => set('recurringFrequency', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-[13px] border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                The system will automatically schedule the next occurrence when this session ends.
              </p>
            </div>
          )}
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

function CoursePlayerModal({
  enrollment, onClose, onSaved,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [completedObjectives, setCompletedObjectives] = useState<number[]>(enrollment.completedObjectives || []);
  const [progress, setProgress]         = useState(enrollment.progress || 0);
  const [materialProgress, setMaterialProgress] = useState<MatProgress>(enrollment.materialProgress || {});
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: CourseDetail }>({
      url: `${API_BASE_URL}/training/courses/${enrollment.courseId}`,
      showToast: false,
      returnResponse: true,
      thenFn: r => { if (r?.data) setCourse(r.data); },
    });
  }, [enrollment.courseId]);

  const isSelfPaced = (enrollment.trainingType || course?.trainingType) === 'self_paced';
  const isRefresher = (enrollment.trainingType || course?.trainingType) === 'refresher';
  const objectives  = enrollment.objectives?.length ? enrollment.objectives : (course?.objectives || []);
  const totalObjectives = objectives.length;
  const catColor    = CAT_COLORS[enrollment.category] || '#6366f1';
  const materials   = course?.materials || [];
  const isCompleted = enrollment.status === 'completed' || enrollment.status === 'auto_completed';

  const objectivesDone = isSelfPaced ? (totalObjectives === 0 || progress >= 100) : true;
  const materialsDone  = (isSelfPaced || isRefresher)
    ? materials.length === 0 || materials.every(m => materialProgress[String(m._id)]?.completed)
    : true;
  const canComplete = !isCompleted && objectivesDone && materialsDone;

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

  const handleMaterialComplete = (materialId: string) => {
    setMaterialProgress(prev => ({ ...prev, [materialId]: { ...prev[materialId], completed: true } }));
    setActiveMaterialId(null);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,12,30,0.88)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0f172a', border: '1px solid #1e293b', maxHeight: '90vh' }}>

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
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-slate-400 font-semibold">Overall Progress</span>
              <span className="font-bold" style={{ color: progress === 100 ? '#22c55e' : catColor }}>{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: progress === 100 ? '#22c55e' : catColor }} />
            </div>
            {course?.link && (
              <a href={course.link} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-2 text-[12px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                <Play className="h-3.5 w-3.5 fill-current" /> Join online session
              </a>
            )}
            {course?.location && (course.location.address || course.location.venue) && (
              <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                {course.location.address && <p>📍 {course.location.address}</p>}
                {course.location.venue   && <p>🏢 {course.location.venue}</p>}
              </div>
            )}
          </div>

          {course?.description && (
            <div className="px-6 py-4 border-b border-slate-800">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">About this course</p>
              <p className="text-[13px] text-slate-300 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Materials — self_paced and refresher */}
          {materials.length > 0 && (isSelfPaced || isRefresher) && (
            <div className="px-6 py-4 border-b border-slate-800">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
                Course Materials ({materials.filter(m => materialProgress[String(m._id)]?.completed).length}/{materials.length} done)
              </p>
              <div className="space-y-2">
                {materials.map(m => {
                  const mp     = materialProgress[String(m._id)] || {};
                  const isActive = activeMaterialId === String(m._id);
                  const isDone   = mp.completed === true;
                  return (
                    <div key={String(m._id)}
                      className={`rounded-xl border transition-colors ${isDone ? 'border-emerald-700/30 bg-emerald-900/10' : 'border-slate-700/50 bg-slate-800/40'}`}>
                      <button
                        onClick={() => setActiveMaterialId(isActive ? null : String(m._id))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: m.type === 'video' ? '#6366f120' : '#f59e0b20' }}>
                          {m.type === 'video'
                            ? <Film className="h-4 w-4 text-indigo-400" />
                            : <FileText className="h-4 w-4 text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-200 truncate">{m.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.type === 'video' ? 'Video' : 'PDF Document'}
                            {m.type === 'pdf' && m.minReadTimeSeconds ? ` · ~${Math.ceil(m.minReadTimeSeconds / 60)} min read` : ''}
                            {m.type === 'pdf' && mp.timeSpentSeconds ? ` · ${formatTime(mp.timeSpentSeconds)} spent` : ''}
                          </p>
                        </div>
                        {isDone
                          ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <span className="text-[10px] text-slate-500 shrink-0">{isActive ? '▲' : '▼'}</span>}
                      </button>
                      {isActive && !isDone && (
                        <div className="px-4 pb-4">
                          {m.type === 'video' && (
                            <VideoMaterialPlayer
                              material={m}
                              enrollmentId={enrollment._id}
                              savedPosition={mp.videoPositionSeconds}
                              onComplete={() => handleMaterialComplete(String(m._id))}
                            />
                          )}
                          {m.type === 'pdf' && (
                            <PDFMaterialViewer
                              material={m}
                              enrollmentId={enrollment._id}
                              savedTimeSeconds={mp.timeSpentSeconds}
                              onComplete={() => handleMaterialComplete(String(m._id))}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Objectives — self_paced */}
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
                        isDone ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/40 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
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

          {!isSelfPaced && !isRefresher && enrollment.status === 'in_progress' && (
            <div className="px-6 py-4">
              <p className="text-[12px] text-slate-400">
                This is a{' '}
                <span className="text-slate-200 font-semibold">
                  {TRAINING_TYPE_LABELS[enrollment.trainingType] || enrollment.trainingType}
                </span>{' '}
                course. Mark it complete once you have attended.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">Close</button>
          <div className="flex items-center gap-2">
            {saved && !saving && (
              <span className="text-[12px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {!isCompleted && !materialsDone && (
              <span className="text-[11px] text-amber-400">Complete all materials first</span>
            )}
            {canComplete && (
              <button
                onClick={markComplete}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-40 transition-colors"
              >
                {saving ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark as Complete
              </button>
            )}
            {isCompleted && (
              <span className="text-[13px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle className="h-4 w-4" />
                {enrollment.status === 'auto_completed' ? 'Auto-completed' : 'Completed'}
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
  const [summary, setSummary]         = useState<TrainingSummary | null>(null);
  const [loading, setLoading]         = useState(false);
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
  const completed  = enrollments.filter(e => e.status === 'completed' || e.status === 'auto_completed');

  const statusColor = (s: string) =>
    (s === 'completed' || s === 'auto_completed') ? '#22c55e' : s === 'in_progress' ? '#6366f1' : '#94a3b8';

  const EnrollmentCard = ({ e }: { e: Enrollment }) => (
    <Card className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${CAT_COLORS[e.category] || '#6366f1'}20` }}>
        <BookOpen className="h-5 w-5" style={{ color: CAT_COLORS[e.category] || '#6366f1' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-slate-200 text-[14px]">{e.courseTitle}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0"
            style={{ background: `${statusColor(e.status)}20`, color: statusColor(e.status) }}>
            {e.status === 'auto_completed' ? 'auto completed' : e.status.replace(/_/g, ' ')}
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
          {e.minutesPresent ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.minutesPresent} min</span> : null}
          {e.certificateUrl && <span className="flex items-center gap-1 text-amber-400"><Award className="h-3 w-3" /> Certificate</span>}
        </div>
      </div>
      {(e.status !== 'completed' && e.status !== 'auto_completed') ? (
        <button
          onClick={() => setActiveEnrollment(e)}
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors text-[12px] font-semibold"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {e.status === 'not_started' ? 'Start' : 'Continue'}
        </button>
      ) : (
        <button
          onClick={() => setActiveEnrollment(e)}
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
          onSaved={fetchAll}
        />
      )}

      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Assigned',    value: summary.assigned,   color: '#6366f1', icon: Target },
            { label: 'In Progress', value: summary.inProgress, color: '#3b82f6', icon: Play },
            { label: 'Completed',   value: summary.completed,  color: '#22c55e', icon: CheckCircle },
            { label: 'Overdue',     value: summary.overdue,    color: summary.overdue > 0 ? '#f87171' : '#64748b', icon: Clock },
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
  const [search, setSearch]       = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [dueDate, setDueDate]     = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setEmployees(r?.data?.data ?? []),
    });
  }, []);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) || e.staffNumber.includes(search)
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-100">Assign to Employees</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 pt-4 pb-3 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or staff ID…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-800 text-slate-200 text-[13px] border border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-slate-400 shrink-0">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="h-8 px-3 rounded-lg bg-slate-800 text-slate-200 text-[12px] border border-slate-600 focus:outline-none" />
          </div>
        </div>
        <div className="px-5 pb-2 shrink-0">
          <button onClick={toggleAll} className="flex items-center gap-2 text-[12px] text-indigo-400 hover:text-indigo-300">
            <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
              {selected.size === filtered.length && filtered.length > 0 && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : `Select all (${filtered.length})`}
          </button>
        </div>
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
  const [courses, setCourses]               = useState<Course[]>([]);
  const [search, setSearch]                 = useState('');
  const [catFilter, setCatFilter]           = useState('all');
  const [levelFilter, setLevelFilter]       = useState('all');
  const [showAdd, setShowAdd]               = useState(false);
  const [assignCourse, setAssignCourse]     = useState<Course | null>(null);
  const [materialsCourse, setMaterialsCourse] = useState<Course | null>(null);
  const [startingId, setStartingId]         = useState<string | null>(null);

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
      {materialsCourse && (
        <MaterialsManagerModal
          course={materialsCourse}
          onClose={() => setMaterialsCourse(null)}
          onSaved={fetchCourses}
        />
      )}

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
          const level      = LEVEL_STYLES[c.level] || LEVEL_STYLES.beginner;
          const catColor   = CAT_COLORS[c.category] || '#64748b';
          const enrollment = c.myEnrollment;
          const hasMaterials = (c.materials?.length ?? 0) > 0;

          const isStartLocked = (() => {
            if (c.trainingType === 'self_paced' || c.trainingType === 'refresher') return false;
            if (!c.startTime || !String(c.startTime).includes('T')) return false;
            return new Date() < new Date(c.startTime);
          })();
          const startLabel = c.startTime && isStartLocked
            ? new Date(c.startTime).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })
            : null;

          const isCompleted = enrollment?.status === 'completed' || enrollment?.status === 'auto_completed';

          return (
            <div key={c._id} className="rounded-2xl overflow-hidden border border-slate-700/60 bg-[#1e293b] flex flex-col">
              <div className="h-28 flex items-center justify-center relative" style={{ background: `${catColor}15` }}>
                <BookOpen className="h-8 w-8 opacity-30" style={{ color: catColor }} />
                {c.isMandatory && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/30 text-red-400">
                    Mandatory
                  </span>
                )}
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: c.isRecurring ? '#10b98120' : `${catColor}20`, color: c.isRecurring ? '#34d399' : catColor }}>
                  {c.isRecurring && <RefreshCw className="h-2.5 w-2.5" />}
                  {c.isRecurring ? 'Recurring' : c.category}
                </span>
                {c.trainingType && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-slate-300">
                    {TRAINING_TYPE_LABELS[c.trainingType] || c.trainingType}
                  </span>
                )}
                {hasMaterials && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-600/30 text-amber-400">
                    {c.materials!.length} material{c.materials!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-slate-100 text-[14px] leading-tight">{c.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize"
                    style={{ background: level.bg, color: level.color }}>
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

                <div className={`grid gap-2 ${isHR ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {!enrollment ? (
                    <button onClick={() => enroll(c._id)}
                      className="h-8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5">
                      <Play className="h-3 w-3 fill-current" /> Enroll
                    </button>
                  ) : enrollment.status === 'not_started' ? (
                    <button
                      onClick={() => !isStartLocked && startCourse(c._id)}
                      disabled={startingId === c._id || isStartLocked}
                      title={startLabel ? `Starts at ${startLabel}` : undefined}
                      className={`h-8 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                        isStartLocked
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400'
                      }`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      {isStartLocked
                        ? `Starts ${startLabel}`
                        : startingId === c._id ? 'Starting…' : 'Start Course'}
                    </button>
                  ) : enrollment.status === 'in_progress' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">In Progress</span>
                        <span className="font-semibold text-indigo-400">{enrollment.progress}%</span>
                      </div>
                      <ProgressBar value={enrollment.progress} color="#6366f1" />
                      <p className="text-[10px] text-slate-500 text-center pt-0.5">Open My Training to continue</p>
                    </div>
                  ) : (
                    <div className="h-8 rounded-lg bg-slate-700/50 text-slate-400 text-[12px] font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {enrollment.status === 'auto_completed' ? 'Auto-completed' : 'Completed'}
                    </div>
                  )}
                  {isHR && (
                    <button onClick={() => setAssignCourse(c)}
                      className="h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5">
                      <UserPlus className="h-3 w-3" /> Assign
                    </button>
                  )}
                </div>

                {isHR && (c.trainingType === 'self_paced' || c.trainingType === 'refresher') && (
                  <button
                    onClick={() => setMaterialsCourse(c)}
                    className="mt-2 h-7 w-full rounded-lg bg-amber-600/15 hover:bg-amber-600/30 text-amber-400 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="h-3 w-3" />
                    {hasMaterials ? `Manage Materials (${c.materials!.length})` : 'Add Materials'}
                  </button>
                )}
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
