'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, CheckCircle2, Circle, Clock, AlertTriangle, FileText,
  ShieldCheck, Users, ClipboardList, Activity as ActivityIcon, ExternalLink, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useOnboardingRecord } from '../Hooks/useOnboardingRecords';
import { useOnboardingRecordDocuments } from '../Hooks/useOnboardingDocuments';
import type { OnboardingTask } from '../types';

const TABS = ['Overview', 'Compensation', 'Tasks', 'Documents', 'Activity'] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mpesa',         label: 'M-Pesa' },
  { value: 'cash',          label: 'Cash' },
  { value: 'paypal',        label: 'PayPal' },
  { value: 'crypto',        label: 'Crypto' },
];

const RECORD_STATUS_MAP: Record<string, Status> = {
  preboarding: 'preboarding', active: 'active', completed: 'completed', stalled: 'atRisk',
};

const TASK_STATUS_ICON: Record<string, JSX.Element> = {
  pending:    <Circle className="h-4 w-4 text-brand-text-muted" />,
  inProgress: <Clock className="h-4 w-4 text-amber-400" />,
  completed:  <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  overdue:    <AlertTriangle className="h-4 w-4 text-red-400" />,
};

const STAKEHOLDER_LABEL: Record<string, string> = { hr: 'HR', it: 'IT', manager: 'Manager', newHire: 'New Hire', finance: 'Finance' };

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STAKEHOLDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' }, { value: 'manager', label: 'Manager' },
  { value: 'newHire', label: 'New Hire' }, { value: 'finance', label: 'Finance' },
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
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Return old ID badge"
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

function TaskRow({ task, onUpdate, onUpload }: { task: OnboardingTask; onUpdate: (status: string, notes?: string) => void; onUpload: (file: File) => void }) {
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
          {task.requiresDocument && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Doc</span>}
        </div>
        {task.description && <p className="text-xs text-brand-text-muted mt-0.5">{task.description}</p>}
        <p className="text-[11px] text-brand-text-muted mt-1">Due {fmtDate(task.dueDate)}{task.completedAt ? ` · Completed ${fmtDate(task.completedAt)}` : ''}</p>
        {task.resourceUrl && (
          <button onClick={() => openFile(resolveUploadUrl(task.resourceUrl!)).catch(err => toast.error(err.message))}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mt-1">
            <FileText className="h-3 w-3" /> View attached resource
          </button>
        )}
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

function CompensationPanel({ record, onSave }: {
  record: NonNullable<ReturnType<typeof useOnboardingRecord>['record']>;
  onSave: (data: { grossPay: number; paymentMethod: string; bankName?: string; bankAccountNumber?: string; mpesaNumber?: string }, onSuccess?: () => void, onError?: (m: string) => void) => void;
}) {
  const existing = record.employeeCompensation;
  const [grossPay, setGrossPay] = useState(String(existing?.grossPay ?? ''));
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'bank_transfer');
  const [bankName, setBankName] = useState(existing?.bankName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(existing?.bankAccountNumber ?? '');
  const [mpesaNumber, setMpesaNumber] = useState(existing?.mpesaNumber ?? '');
  const [saving, setSaving] = useState(false);

  const canSubmit = Number(grossPay) > 0
    && (paymentMethod !== 'bank_transfer' || (bankName.trim() && bankAccountNumber.trim()))
    && (paymentMethod !== 'mpesa' || mpesaNumber.trim());

  const handleSave = () => {
    setSaving(true);
    onSave(
      { grossPay: Number(grossPay), paymentMethod, bankName, bankAccountNumber, mpesaNumber },
      () => { toast.success('Compensation set up.'); setSaving(false); },
      (msg) => { toast.error(msg); setSaving(false); },
    );
  };

  return (
    <div className="space-y-4">
      {record.compensationSetup && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400">
          Set up {fmtDateTime(record.compensationSetup.setAt)}
        </div>
      )}

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Salary & Payment Method</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Gross Pay (KES)</label>
            <input type="number" min={0} value={grossPay} onChange={e => setGrossPay(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              {PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {paymentMethod === 'bank_transfer' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Account Number</label>
                <input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
            </>
          )}
          {paymentMethod === 'mpesa' && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">M-Pesa Number</label>
              <input value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)} placeholder="254712345678"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={!canSubmit || saving}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Compensation'}
          </button>
        </div>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Allowances & Benefits</h3>
        <p className="text-[11px] text-brand-text-muted mb-3">Pulled automatically from this employee's job group — no separate action needed, these apply at the next payroll run.</p>
        {!record.employeeCompensation?.jobGroupId ? (
          <p className="text-sm text-brand-text-muted">No job group assigned yet — set one on the employee's profile to see applicable allowances.</p>
        ) : (record.groupAllowancesPreview?.length ?? 0) === 0 ? (
          <p className="text-sm text-brand-text-muted">No group-wide allowances or benefits configured for this job group.</p>
        ) : (
          <div className="space-y-2">
            {record.groupAllowancesPreview!.map(a => (
              <div key={a.conceptId} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-sm">
                <span className="text-brand-text-secondary">{a.conceptName} <span className="text-[10px] text-brand-text-muted capitalize">({a.category})</span></span>
                <span className="font-semibold text-brand-text">{a.amount ? `KES ${a.amount.toLocaleString('en-KE')}` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordDetailPage({ recordId }: { recordId: string }) {
  const locale = useLocale();
  const [tab, setTab] = useState<typeof TABS[number]>('Overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const { record, loading, updateTask, updateWelcome, addTask, uploadDocument, setCompensation } = useOnboardingRecord(recordId);
  const { documents, loading: docsLoading, verify } = useOnboardingRecordDocuments(tab === 'Documents' ? recordId : null);

  const activityItems = useMemo(() => {
    if (!record) return [];
    const items: { at: string; label: string }[] = [{ at: record.createdAt, label: 'Onboarding record created' }];
    record.taskLists.forEach(l => l.tasks.forEach(t => {
      if (t.completedAt) items.push({ at: t.completedAt, label: `Task completed: ${t.title}` });
    }));
    if (record.completedAt) items.push({ at: record.completedAt, label: 'Onboarding marked complete' });
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [record]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  if (!record) return <p className="text-sm text-brand-text-muted text-center py-16">Record not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href={`/${locale}/onboarding`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Onboarding
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-brand-text">{record.employee?.fullName ?? 'Unknown Employee'}</h1>
          <StatusBadge status={RECORD_STATUS_MAP[record.status] ?? 'active'} label={record.status} className="capitalize" />
        </div>
        <p className="text-sm text-brand-text-secondary mt-0.5">{record.employee?.department} · {record.employee?.staffNumber} · Started {fmtDate(record.startDate)}</p>
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

      <div className="flex items-center gap-1 border-b border-brand-border">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px',
              tab === t ? 'border-brand-primary text-indigo-400' : 'border-transparent text-brand-text-muted hover:text-brand-text-secondary')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Welcome Message</h3>
            <p className="text-sm text-brand-text-secondary whitespace-pre-line">{record.welcomeMessage || 'No welcome message set.'}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-3">First Day Details</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-brand-text-muted text-xs">Location</p><p className="text-brand-text-secondary">{record.firstDayDetails.location || '—'}</p></div>
              <div><p className="text-brand-text-muted text-xs">Reporting Time</p><p className="text-brand-text-secondary">{record.firstDayDetails.reportingTime || '—'}</p></div>
              <div><p className="text-brand-text-muted text-xs">What to Bring</p><p className="text-brand-text-secondary">{record.firstDayDetails.whatToBring || '—'}</p></div>
              <div><p className="text-brand-text-muted text-xs">Additional Notes</p><p className="text-brand-text-secondary">{record.firstDayDetails.additionalNotes || '—'}</p></div>
            </div>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Meet the Team</h3>
            {record.meetTheTeam.length === 0 ? (
              <p className="text-sm text-brand-text-muted">No introductions set up for this record.</p>
            ) : (
              <div className="space-y-2">
                {record.meetTheTeam.map(m => (
                  <div key={m.employeeId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-brand-text-secondary">{m.employee?.fullName ?? m.employeeId}</p>
                      {m.note && <p className="text-xs text-brand-text-muted">{m.note}</p>}
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full', m.met ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-bg-muted text-brand-text-secondary')}>
                      {m.met ? 'Met' : 'Not yet'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Compensation' && <CompensationPanel record={record} onSave={setCompensation} />}

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

      {tab === 'Documents' && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl overflow-hidden">
          {docsLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-12">No documents uploaded for this record yet.</p>
          ) : documents.map(doc => (
            <div key={doc._id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-brand-text truncate">{doc.name}</p>
                  <p className="text-[11px] text-brand-text-muted">{doc.type} · {doc.status}{doc.uploadedAt ? ` · ${fmtDateTime(doc.uploadedAt)}` : ''}</p>
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
