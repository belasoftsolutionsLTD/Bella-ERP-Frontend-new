'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Clock, AlertTriangle, FileText, Star, Loader2, ExternalLink, MessageSquare, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useMyOffboarding } from '../Hooks/useMyOffboarding';
import type { OffboardingTask, GeneratedDocumentType } from '../types';

const TASK_STATUS_ICON: Record<string, JSX.Element> = {
  pending:    <Circle className="h-5 w-5 text-brand-text-secondary" />,
  inProgress: <Clock className="h-5 w-5 text-amber-500" />,
  completed:  <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  overdue:    <AlertTriangle className="h-5 w-5 text-red-500" />,
};

const DOCUMENT_LABELS: Record<GeneratedDocumentType, string> = {
  experienceLetter: 'Experience Letter', relievingLetter: 'Relieving Letter',
  clearanceCertificate: 'Clearance Certificate', finalPayslip: 'Final Payslip',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}>
          <Star className={cn('h-6 w-6 transition-colors', i <= value ? 'text-amber-400 fill-amber-400' : 'text-brand-text hover:text-amber-200')} />
        </button>
      ))}
    </div>
  );
}

function TaskCard({ task, onComplete, onUpload }: { task: OffboardingTask; onComplete: () => void; onUpload: (file: File) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(file);
    setUploading(false);
  };

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border', task.status === 'completed' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-white border-slate-200')}>
      <div className="mt-0.5 shrink-0">{TASK_STATUS_ICON[task.status] ?? TASK_STATUS_ICON.pending}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800')}>{task.title}</p>
        {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
        <p className="text-xs text-slate-400 mt-1">Due {fmtDate(task.dueDate)}</p>
        {task.requiresDocument && task.status !== 'completed' && (
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2 cursor-pointer hover:underline">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : 'Upload document'}
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
      {task.status !== 'completed' && (
        <button onClick={onComplete} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
        </button>
      )}
    </div>
  );
}

function ExitInterviewForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [jobSatisfactionRating, setJobSatisfactionRating] = useState(0);
  const [managementRating, setManagementRating] = useState(0);
  const [wouldRecommendCompany, setWouldRecommendCompany] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reasonForLeaving.trim().length >= 2 && jobSatisfactionRating > 0 && managementRating > 0 && wouldRecommendCompany !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onSubmit({ reasonForLeaving, jobSatisfactionRating, managementRating, wouldRecommendCompany, suggestions, additionalComments });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <h2 className="font-semibold text-slate-900 flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Exit Interview</h2>
      <p className="text-xs text-slate-500 -mt-2">Your feedback helps us improve. This form can only be submitted once.</p>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reason for Leaving <span className="text-red-500">*</span></label>
        <textarea value={reasonForLeaving} onChange={e => setReasonForLeaving(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary/40 resize-none" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Job Satisfaction <span className="text-red-500">*</span></label>
          <StarInput value={jobSatisfactionRating} onChange={setJobSatisfactionRating} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Management Rating <span className="text-red-500">*</span></label>
          <StarInput value={managementRating} onChange={setManagementRating} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Would you recommend this company to others? <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setWouldRecommendCompany(true)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors', wouldRecommendCompany === true ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-600')}>
            Yes
          </button>
          <button type="button" onClick={() => setWouldRecommendCompany(false)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors', wouldRecommendCompany === false ? 'bg-red-600 border-red-600 text-white' : 'border-slate-200 text-slate-600')}>
            No
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Suggestions</label>
        <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary/40 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Additional Comments</label>
        <textarea value={additionalComments} onChange={e => setAdditionalComments(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-primary/40 resize-none" />
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || submitting}
        className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Submit Exit Interview
      </button>
    </div>
  );
}

export default function MyOffboardingPage() {
  const { record, documents, loading, completeTask, uploadDocument, submitExitInterview } = useMyOffboarding();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-text-secondary" />
        <p className="text-sm font-medium text-slate-600">No offboarding record found.</p>
        <p className="text-xs text-slate-400">You don't have an active offboarding process right now.</p>
      </div>
    );
  }

  const allTasks = record.taskLists.flatMap(l => l.tasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">My Offboarding</h1>
        <p className="text-sm text-slate-400">Everything you need to know before your last working day.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-400 text-xs">Last Working Day</p><p className="text-slate-800 font-semibold">{fmtDate(record.lastWorkingDay)}</p></div>
          <div><p className="text-slate-400 text-xs">Exit Type</p><p className="text-slate-800 font-semibold capitalize">{record.exitType.replace('_', ' ')}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-900">Progress</span>
          <span className="text-sm font-bold text-emerald-600">{record.progressPercentage}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${record.progressPercentage}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Tasks Remaining</h2>
        {allTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No tasks assigned to you.</p>
        ) : (
          <div className="space-y-2">
            {allTasks.map(task => (
              <TaskCard key={task.id} task={task}
                onComplete={() => completeTask(task.id, () => toast.success('Task completed.'))}
                onUpload={(file) => new Promise<void>((resolve) => {
                  uploadDocument(task.id, file, `${task.title} — Document`, () => { toast.success('Document uploaded.'); resolve(); });
                })} />
            ))}
          </div>
        )}
      </div>

      {!record.exitInterview?.completedAt ? (
        <ExitInterviewForm onSubmit={(data) => submitExitInterview(data, () => toast.success('Thank you for your feedback!'))} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Exit Interview</h2>
          <p className="text-sm text-emerald-600 font-medium mt-2">Submitted {fmtDate(record.exitInterview.completedAt)} — thank you for your feedback.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No documents available yet — HR will generate these before your last day.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <button key={i} onClick={() => openFile(resolveUploadUrl(doc.fileUrl)).catch(err => toast.error(err.message))}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-slate-800">{DOCUMENT_LABELS[doc.type]}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary"><ExternalLink className="h-3.5 w-3.5" /> View</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
