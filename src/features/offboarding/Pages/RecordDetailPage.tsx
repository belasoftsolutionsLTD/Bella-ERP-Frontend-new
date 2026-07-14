'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, CheckCircle2, Circle, Clock, AlertTriangle, FileText,
  Package, ShieldOff, MessageSquare, Activity as ActivityIcon, ExternalLink, Star, DollarSign, RotateCcw, Plus, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useOffboardingRecord } from '../Hooks/useOffboardingRecords';
import { useOffboardingRecordDocuments } from '../Hooks/useOffboardingDocuments';
import type { OffboardingTask, GeneratedDocumentType } from '../types';

const TABS = ['Overview', 'Tasks', 'Assets', 'Access', 'Exit Interview', 'Documents', 'Activity'] as const;

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  initiated:        { label: 'Initiated',        bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  inProgress:       { label: 'In Progress',      bg: 'bg-brand-primary/15', text: 'text-indigo-400' },
  pendingClearance: { label: 'Pending Clearance', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  completed:        { label: 'Completed',        bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

const TASK_STATUS_ICON: Record<string, JSX.Element> = {
  pending:    <Circle className="h-4 w-4 text-brand-text-muted" />,
  inProgress: <Clock className="h-4 w-4 text-amber-400" />,
  completed:  <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  overdue:    <AlertTriangle className="h-4 w-4 text-red-400" />,
};

const STAKEHOLDER_LABEL: Record<string, string> = { hr: 'HR', it: 'IT', manager: 'Manager', employee: 'Employee', finance: 'Finance' };
const DOCUMENT_LABELS: Record<GeneratedDocumentType, string> = {
  experienceLetter: 'Experience Letter', relievingLetter: 'Relieving Letter',
  clearanceCertificate: 'Clearance Certificate', finalPayslip: 'Final Payslip',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STAKEHOLDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' }, { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance' }, { value: 'employee', label: 'Employee' },
];

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: { title: string; description?: string; dueDate?: string; isRequired: boolean; assignedTo: string; requiresDocument?: boolean }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [assignedTo, setAssignedTo] = useState('hr');
  const [requiresDocument, setRequiresDocument] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    setSaving(true);
    onAdd({ title, description, dueDate: dueDate || undefined, isRequired, assignedTo, requiresDocument });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Add Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><Plus className="h-4 w-4 rotate-45" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Task Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Return company vehicle keys"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Assigned To</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none">
                {STAKEHOLDER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="accent-brand-primary" />
            Required
          </label>
          <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <input type="checkbox" checked={requiresDocument} onChange={e => setRequiresDocument(e.target.checked)} className="accent-brand-primary" />
            Requires document upload (optional)
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleAdd} disabled={!title.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => <Star key={i} className={cn('h-3.5 w-3.5', i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-700')} />)}
    </div>
  );
}

function TaskRow({ task, onUpdate, onUpload }: { task: OffboardingTask; onUpdate: (status: string, notes?: string) => void; onUpload: (file: File) => void }) {
  const [notes, setNotes] = useState(task.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(file);
    setUploading(false);
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-brand-border/60 last:border-0">
      <button onClick={() => onUpdate(task.status === 'completed' ? 'pending' : 'completed')} className="mt-0.5 shrink-0">
        {TASK_STATUS_ICON[task.status] ?? TASK_STATUS_ICON.pending}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-medium', task.status === 'completed' ? 'text-brand-text-muted line-through' : 'text-brand-text')}>{task.title}</p>
          {task.isRequired && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">Required</span>}
          {task.taskType === 'spend_clearance' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Finance gate</span>}
        </div>
        {task.description && <p className="text-xs text-brand-text-muted mt-0.5">{task.description}</p>}
        <p className="text-[11px] text-brand-text-muted mt-1">Due {fmtDate(task.dueDate)}{task.completedAt ? ` · Completed ${fmtDate(task.completedAt)}` : ''}</p>
        {task.requiresDocument && task.status !== 'completed' && (
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 mt-1 cursor-pointer transition-colors">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
            {uploading ? 'Uploading…' : task.documentId ? 'Re-upload document' : 'Upload document (on behalf of assignee)'}
            <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
        {editingNotes ? (
          <div className="flex items-center gap-2 mt-1.5">
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note…"
              className="flex-1 h-7 px-2 bg-brand-bg-soft border border-brand-border rounded text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
            <button onClick={() => { onUpdate(task.status, notes); setEditingNotes(false); }} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Save</button>
          </div>
        ) : task.notes ? (
          <button onClick={() => setEditingNotes(true)} className="text-[11px] text-brand-text-secondary italic mt-1 hover:text-brand-text-secondary transition-colors">"{task.notes}"</button>
        ) : (
          <button onClick={() => setEditingNotes(true)} className="text-[11px] text-brand-text-muted hover:text-brand-text-secondary mt-1 transition-colors">+ Add note</button>
        )}
      </div>
    </div>
  );
}

export default function RecordDetailPage({ recordId }: { recordId: string }) {
  const locale = useLocale();
  const [tab, setTab] = useState<typeof TABS[number]>('Overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const { record, loading, updateTask, addTask, uploadDocument, updateAsset, updateAccess, updateRehire, generateDocument, triggerFinalPay, completeRecord } = useOffboardingRecord(recordId);
  const { documents: uploadedDocuments, loading: uploadedDocsLoading, verify } = useOffboardingRecordDocuments(tab === 'Documents' ? recordId : null);

  const activityItems = useMemo(() => {
    if (!record) return [];
    const items: { at: string; label: string }[] = [{ at: record.createdAt, label: 'Offboarding record created' }];
    record.taskLists.forEach(l => l.tasks.forEach(t => {
      if (t.completedAt) items.push({ at: t.completedAt, label: `Task completed: ${t.title}` });
    }));
    record.assetChecklist.forEach(a => { if (a.returnedAt) items.push({ at: a.returnedAt, label: `Asset returned: ${a.item}` }); });
    record.accessRevocationList.forEach(a => { if (a.revokedAt) items.push({ at: a.revokedAt, label: `Access revoked: ${a.system}` }); });
    if (record.exitInterview?.completedAt) items.push({ at: record.exitInterview.completedAt, label: 'Exit interview submitted' });
    record.generatedDocuments.forEach(d => items.push({ at: d.generatedAt, label: `Document generated: ${DOCUMENT_LABELS[d.type]}` }));
    if (record.finalPayTriggeredAt) items.push({ at: record.finalPayTriggeredAt, label: 'Final pay triggered' });
    if (record.completedAt) items.push({ at: record.completedAt, label: 'Offboarding marked complete' });
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [record]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  if (!record) return <p className="text-sm text-brand-text-muted text-center py-16">Record not found.</p>;

  const cfg = STATUS_CFG[record.status] ?? STATUS_CFG.initiated;
  const requiredTasks = record.taskLists.flatMap(l => l.tasks).filter(t => t.isRequired);
  const allRequiredDone = requiredTasks.length > 0 ? requiredTasks.every(t => t.status === 'completed') : record.taskLists.some(l => l.tasks.length > 0);
  const canComplete = record.status !== 'completed' && requiredTasks.every(t => t.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href={`/${locale}/offboarding`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Offboarding
        </Link>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-brand-text">{record.employee?.fullName ?? 'Unknown Employee'}</h1>
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>{cfg.label}</span>
          </div>
          {record.status !== 'completed' && (
            <button onClick={() => completeRecord(() => toast.success('Offboarding completed. Employee marked inactive.'))} disabled={!canComplete}
              title={!canComplete ? 'All required tasks must be completed first' : ''}
              className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors">
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          )}
        </div>
        <p className="text-sm text-brand-text-secondary mt-0.5 capitalize">
          {record.employee?.department} · {record.employee?.staffNumber} · {record.exitType.replace('_', ' ')} · Last day {fmtDate(record.lastWorkingDay)}
        </p>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-brand-text-secondary mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-brand-text-secondary">{record.progressPercentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-brand-bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full', record.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-brand-primary')} style={{ width: `${record.progressPercentage}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-brand-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
              tab === t ? 'border-brand-primary text-indigo-400' : 'border-transparent text-brand-text-muted hover:text-brand-text-secondary')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Exit Reason</h3>
            <p className="text-sm text-brand-text-secondary whitespace-pre-line">{record.exitReason || 'No reason recorded.'}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Eligible for Rehire</h3>
              <p className="text-sm text-brand-text-secondary">{record.eligibleForRehire ? 'Yes — this employee may be considered for rehire.' : 'No — not currently eligible for rehire.'}</p>
            </div>
            <button onClick={() => updateRehire(!record.eligibleForRehire, () => toast.success('Rehire eligibility updated.'))}
              className={cn('h-8 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0',
                record.eligibleForRehire ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-brand-bg-muted text-brand-text-secondary hover:bg-brand-border-strong')}>
              {record.eligibleForRehire ? 'Mark Not Eligible' : 'Mark Eligible'}
            </button>
          </div>
          {record.finalPayTriggered ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs text-emerald-300">
              <DollarSign className="h-4 w-4" /> Final pay triggered {fmtDate(record.finalPayTriggeredAt)} — process via Payroll's off-cycle run.
            </div>
          ) : (
            <button onClick={() => triggerFinalPay(() => toast.success('Final pay flagged for Payroll.'))}
              className="flex items-center gap-2 h-9 px-4 bg-brand-bg-soft border border-brand-border hover:border-slate-500 text-brand-text-secondary text-sm font-semibold rounded-lg transition-colors">
              <DollarSign className="h-4 w-4" /> Trigger Final Pay
            </button>
          )}
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1.5 h-8 px-3 bg-brand-bg-soft border border-brand-border hover:border-slate-500 text-brand-text-secondary text-xs font-semibold rounded-lg transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Task
            </button>
          </div>
          {record.taskLists.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-8">No task lists on this record.</p>
          ) : record.taskLists.map(list => (
            <div key={list.id} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-brand-text">{list.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">{STAKEHOLDER_LABEL[list.assignedTo] ?? list.assignedTo}</span>
              </div>
              <div>
                {list.tasks.length === 0 ? (
                  <p className="text-xs text-brand-text-muted py-2">No tasks in this list.</p>
                ) : list.tasks.map(task => (
                  <TaskRow key={task.id} task={task}
                    onUpdate={(status, notes) => updateTask(list.id, task.id, status, notes, () => toast.success('Task updated.'))}
                    onUpload={(file) => new Promise<void>((resolve) => {
                      uploadDocument(task.id, file, () => { toast.success('Document uploaded.'); resolve(); });
                    })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Assets' && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl overflow-hidden">
          {record.assetChecklist.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-12">No assets tracked for this record.</p>
          ) : record.assetChecklist.map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Package className="h-4 w-4 text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-brand-text">{a.item}</p>
                  <p className="text-[11px] text-brand-text-muted capitalize">{a.category}{a.returnedAt ? ` · Returned ${fmtDate(a.returnedAt)}` : ''}{a.condition ? ` · ${a.condition}` : ''}</p>
                </div>
              </div>
              <button onClick={() => updateAsset(a.id, { returned: !a.returned }, () => toast.success('Asset status updated.'))}
                className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0',
                  a.returned ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-brand-bg-muted text-brand-text-secondary hover:bg-brand-border-strong')}>
                {a.returned ? 'Returned' : 'Mark Returned'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Access' && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl overflow-hidden">
          {record.accessRevocationList.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-12">No access items tracked for this record.</p>
          ) : record.accessRevocationList.map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldOff className="h-4 w-4 text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-brand-text">{a.system}</p>
                  <p className="text-[11px] text-brand-text-muted capitalize">{a.category}{a.revokedAt ? ` · Revoked ${fmtDate(a.revokedAt)}` : ''}</p>
                </div>
              </div>
              <button onClick={() => updateAccess(a.id, !a.revoked, () => toast.success('Access status updated.'))}
                className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0',
                  a.revoked ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-brand-bg-muted text-brand-text-secondary hover:bg-brand-border-strong')}>
                {a.revoked ? 'Revoked' : 'Mark Revoked'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Exit Interview' && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
          {!record.exitInterview?.completedAt ? (
            <div className="flex flex-col items-center py-8 gap-2 text-brand-text-muted">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">Employee has not submitted their exit interview yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] text-brand-text-muted">Submitted {fmtDateTime(record.exitInterview.completedAt)}</p>
              <div>
                <p className="text-xs text-brand-text-muted mb-1">Reason for Leaving</p>
                <p className="text-sm text-brand-text-secondary">{record.exitInterview.reasonForLeaving}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-brand-text-muted mb-1">Job Satisfaction</p>
                  <Stars value={record.exitInterview.jobSatisfactionRating ?? 0} />
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-1">Management Rating</p>
                  <Stars value={record.exitInterview.managementRating ?? 0} />
                </div>
              </div>
              <div>
                <p className="text-xs text-brand-text-muted mb-1">Would Recommend Company</p>
                <p className="text-sm text-brand-text-secondary">{record.exitInterview.wouldRecommendCompany ? 'Yes' : 'No'}</p>
              </div>
              {record.exitInterview.suggestions && (
                <div><p className="text-xs text-brand-text-muted mb-1">Suggestions</p><p className="text-sm text-brand-text-secondary">{record.exitInterview.suggestions}</p></div>
              )}
              {record.exitInterview.additionalComments && (
                <div><p className="text-xs text-brand-text-muted mb-1">Additional Comments</p><p className="text-sm text-brand-text-secondary">{record.exitInterview.additionalComments}</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'Documents' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Employee Uploads</h3>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl overflow-hidden">
              {uploadedDocsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
              ) : uploadedDocuments.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-12">No documents uploaded by the employee yet.</p>
              ) : uploadedDocuments.map(doc => (
                <div key={doc._id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-brand-text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-brand-text truncate">{doc.name}</p>
                      <p className="text-[11px] text-brand-text-muted">{doc.status}{doc.uploadedAt ? ` · ${fmtDateTime(doc.uploadedAt)}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {doc.fileUrl && (
                      <button onClick={() => openFile(resolveUploadUrl(doc.fileUrl!)).catch(err => toast.error(err.message))}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </button>
                    )}
                    {doc.status !== 'verified' && (
                      <button onClick={() => verify(doc._id, () => toast.success('Document verified.'))}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">HR-Generated Documents</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['experienceLetter', 'relievingLetter', 'clearanceCertificate'] as GeneratedDocumentType[]).map(type => (
                <button key={type} onClick={() => generateDocument(type, () => toast.success(`${DOCUMENT_LABELS[type]} generated.`))}
                  className="flex items-center gap-1.5 h-9 px-3 bg-brand-bg-soft border border-brand-border hover:border-slate-500 text-brand-text-secondary text-xs font-semibold rounded-lg transition-colors">
                  <FileText className="h-3.5 w-3.5" /> Generate {DOCUMENT_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl overflow-hidden">
              {record.generatedDocuments.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-12">No documents generated yet.</p>
              ) : record.generatedDocuments.map((doc, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-brand-text-muted shrink-0" />
                    <div>
                      <p className="text-sm text-brand-text">{DOCUMENT_LABELS[doc.type]}</p>
                      <p className="text-[11px] text-brand-text-muted">{fmtDateTime(doc.generatedAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => openFile(resolveUploadUrl(doc.fileUrl)).catch(err => toast.error(err.message))}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
          {activityItems.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-8">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {activityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <ActivityIcon className="h-4 w-4 text-brand-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-brand-text-secondary">{item.label}</p>
                    <p className="text-[11px] text-brand-text-muted">{fmtDateTime(item.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={(data) => addTask(data, () => { toast.success('Task added.'); setShowAddTask(false); })}
        />
      )}
    </div>
  );
}
