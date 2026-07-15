'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, Users, FileText, Upload, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useMyOnboarding } from '../Hooks/useMyOnboarding';
import type { OnboardingTask } from '../types';

const TASK_STATUS_ICON: Record<string, JSX.Element> = {
  pending:    <Circle className="h-5 w-5 text-brand-text-secondary" />,
  inProgress: <Clock className="h-5 w-5 text-amber-500" />,
  completed:  <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  overdue:    <AlertTriangle className="h-5 w-5 text-red-500" />,
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function TaskCard({ task, onComplete, onUpload }: { task: OnboardingTask; onComplete: () => void; onUpload: (file: File) => void }) {
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
        {task.resourceUrl && (
          <button onClick={() => openFile(resolveUploadUrl(task.resourceUrl!)).catch(err => toast.error(err.message))}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-2 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> View Resource
          </button>
        )}
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

export default function MyOnboardingPage() {
  const { record, loading, completeTask, uploadDocument, markMet } = useMyOnboarding();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-text-secondary" />
        <p className="text-sm font-medium text-slate-600">No onboarding record found.</p>
        <p className="text-xs text-slate-400">You don't have an active onboarding checklist right now.</p>
      </div>
    );
  }

  const allTasks = record.taskLists.flatMap(l => l.tasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">My Onboarding</h1>
        <p className="text-sm text-slate-400">Welcome aboard! Here's everything you need to get started.</p>
      </div>

      {record.welcomeMessage && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-slate-700 whitespace-pre-line">{record.welcomeMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">First Day Details</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-400 text-xs">Location</p><p className="text-slate-700">{record.firstDayDetails.location || '—'}</p></div>
          <div><p className="text-slate-400 text-xs">Reporting Time</p><p className="text-slate-700">{record.firstDayDetails.reportingTime || '—'}</p></div>
          <div><p className="text-slate-400 text-xs">What to Bring</p><p className="text-slate-700">{record.firstDayDetails.whatToBring || '—'}</p></div>
          <div><p className="text-slate-400 text-xs">Additional Notes</p><p className="text-slate-700">{record.firstDayDetails.additionalNotes || '—'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-900">Your Progress</span>
          <span className="text-sm font-bold text-emerald-600">{record.progressPercentage}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${record.progressPercentage}%` }} />
        </div>
      </div>

      {record.meetTheTeam.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-1.5"><Users className="h-4 w-4" /> Meet the Team</h2>
          <div className="space-y-2">
            {record.meetTheTeam.map(m => (
              <div key={m.employeeId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.employee?.fullName ?? 'Team member'}</p>
                  {m.note && <p className="text-xs text-slate-500">{m.note}</p>}
                  {m.employee?.designation && <p className="text-xs text-slate-400">{m.employee.designation}</p>}
                </div>
                {m.met ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Met</span>
                ) : (
                  <button onClick={() => markMet(m.employeeId, () => toast.success('Marked as met.'))}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                    Mark as Met
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Your Tasks</h2>
        {allTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No tasks assigned to you yet.</p>
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
    </div>
  );
}
