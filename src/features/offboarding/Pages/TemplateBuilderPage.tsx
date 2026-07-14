'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, X, Loader2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOffboardingTemplate } from '../Hooks/useOffboardingTemplates';
import { CreateOffboardingTemplateSchema } from '../schemas';
import type {
  ExitType, OffboardingTaskListTemplate, AssetChecklistTemplateItem, AccessRevocationTemplateItem,
  OffboardingTaskCategory, AssetCategory, AccessCategory, GeneratedDocumentType,
} from '../types';

const EXIT_TYPES: { value: ExitType; label: string }[] = [
  { value: 'resignation', label: 'Resignation' },
  { value: 'termination', label: 'Termination' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'redundancy', label: 'Redundancy' },
  { value: 'contract_end', label: 'Contract End' },
];

const STAKEHOLDERS = [
  { value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' }, { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance' }, { value: 'employee', label: 'Employee' },
] as const;

const TASK_CATEGORIES: { value: OffboardingTaskCategory; label: string }[] = [
  { value: 'assetRecovery', label: 'Asset Recovery' }, { value: 'accessRevocation', label: 'Access Revocation' },
  { value: 'knowledgeTransfer', label: 'Knowledge Transfer' }, { value: 'documentation', label: 'Documentation' },
  { value: 'exitInterview', label: 'Exit Interview' }, { value: 'finalPay', label: 'Final Pay' }, { value: 'general', label: 'General' },
];

const ASSET_CATEGORIES: AssetCategory[] = ['device', 'accessCard', 'keys', 'uniform', 'other'];
const ACCESS_CATEGORIES: AccessCategory[] = ['email', 'software', 'buildingAccess', 'vpn', 'other'];
const DOCUMENT_TYPES: { value: GeneratedDocumentType; label: string }[] = [
  { value: 'experienceLetter', label: 'Experience Letter' }, { value: 'relievingLetter', label: 'Relieving Letter' },
  { value: 'clearanceCertificate', label: 'Clearance Certificate' }, { value: 'finalPayslip', label: 'Final Payslip (via Payroll)' },
];

const STEPS = ['Basic Info', 'Task Lists', 'Assets & Access', 'Documents & Review'];

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);

interface FormState {
  name: string;
  exitTypes: ExitType[];
  taskLists: OffboardingTaskListTemplate[];
  assetChecklist: AssetChecklistTemplateItem[];
  accessRevocationList: AccessRevocationTemplateItem[];
  documentsToGenerate: GeneratedDocumentType[];
}

const emptyForm: FormState = { name: '', exitTypes: [], taskLists: [], assetChecklist: [], accessRevocationList: [], documentsToGenerate: [] };

export default function TemplateBuilderPage({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const isEdit = !!templateId;
  const { template, loading, create, update } = useOffboardingTemplate(templateId ?? null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name, exitTypes: template.exitTypes, taskLists: template.taskLists,
        assetChecklist: template.assetChecklist, accessRevocationList: template.accessRevocationList,
        documentsToGenerate: template.documentsToGenerate,
      });
    }
  }, [template]);

  const totalTasks = form.taskLists.reduce((n, l) => n + l.tasks.length, 0);

  const handleSave = () => {
    const parsed = CreateOffboardingTemplateSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please fix form errors before saving.');
      return;
    }
    setSaving(true);
    const payload = parsed.data;
    if (isEdit) {
      update(payload, () => { toast.success('Template updated.'); router.push(`/${locale}/offboarding/templates`); });
      setSaving(false);
    } else {
      create(payload, () => { toast.success('Template created.'); router.push(`/${locale}/offboarding/templates`); });
      setSaving(false);
    }
  };

  // Task lists
  const addTaskList = () => setForm(f => ({ ...f, taskLists: [...f.taskLists, { id: uid(), name: '', assignedTo: 'hr', tasks: [] }] }));
  const removeTaskList = (listId: string) => setForm(f => ({ ...f, taskLists: f.taskLists.filter(l => l.id !== listId) }));
  const updateTaskList = (listId: string, patch: Partial<OffboardingTaskListTemplate>) =>
    setForm(f => ({ ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, ...patch } : l) }));
  const addTask = (listId: string) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? {
      ...l, tasks: [...l.tasks, { id: uid(), title: '', description: '', dueOffsetDays: 0, isRequired: true, category: 'general' as OffboardingTaskCategory, requiresDocument: false }],
    } : l),
  }));
  const removeTask = (listId: string, taskId: string) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l),
  }));
  const updateTask = (listId: string, taskId: string, patch: Record<string, unknown>) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) } : l),
  }));

  // Assets
  const addAsset = () => setForm(f => ({ ...f, assetChecklist: [...f.assetChecklist, { id: uid(), item: '', category: 'device' as AssetCategory }] }));
  const removeAsset = (id: string) => setForm(f => ({ ...f, assetChecklist: f.assetChecklist.filter(a => a.id !== id) }));
  const updateAsset = (id: string, patch: Partial<AssetChecklistTemplateItem>) =>
    setForm(f => ({ ...f, assetChecklist: f.assetChecklist.map(a => a.id === id ? { ...a, ...patch } : a) }));

  // Access
  const addAccess = () => setForm(f => ({ ...f, accessRevocationList: [...f.accessRevocationList, { id: uid(), system: '', category: 'email' as AccessCategory }] }));
  const removeAccess = (id: string) => setForm(f => ({ ...f, accessRevocationList: f.accessRevocationList.filter(a => a.id !== id) }));
  const updateAccess = (id: string, patch: Partial<AccessRevocationTemplateItem>) =>
    setForm(f => ({ ...f, accessRevocationList: f.accessRevocationList.map(a => a.id === id ? { ...a, ...patch } : a) }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push(`/${locale}/offboarding/templates`)} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Templates
        </button>
        <h1 className="text-xl font-bold text-brand-text">{isEdit ? 'Edit Template' : 'New Offboarding Template'}</h1>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <button onClick={() => setStep(i)} className={cn('flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
              i === step ? 'bg-brand-primary text-white' : i < step ? 'bg-brand-primary/15 text-indigo-300' : 'bg-brand-bg-soft text-brand-text-muted')}>
              <span className={cn('flex items-center justify-center h-4 w-4 rounded-full text-[10px] shrink-0', i === step ? 'bg-white/20' : 'bg-brand-bg-muted')}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="truncate hidden sm:inline">{s}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-6 min-h-96">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Template Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Resignation Offboarding"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applicable Exit Types <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-1.5">
                {EXIT_TYPES.map(t => {
                  const active = form.exitTypes.includes(t.value);
                  return (
                    <button key={t.value} type="button"
                      onClick={() => setForm(f => ({ ...f, exitTypes: active ? f.exitTypes.filter(x => x !== t.value) : [...f.exitTypes, t.value] }))}
                      className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', active ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary hover:border-brand-border-strong')}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {form.taskLists.length === 0 && <p className="text-xs text-brand-text-muted text-center py-6">No task lists yet. Group tasks by who's responsible for them.</p>}
            {form.taskLists.map(list => (
              <div key={list.id} className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-bg-soft/40">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-brand-text-muted shrink-0" />
                  <input value={list.name} onChange={e => updateTaskList(list.id, { name: e.target.value })} placeholder="List name (e.g. Asset Return)"
                    className="flex-1 h-8 px-2.5 bg-brand-bg-soft border border-brand-border rounded-md text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                  <select value={list.assignedTo} onChange={e => updateTaskList(list.id, { assignedTo: e.target.value as OffboardingTaskListTemplate['assignedTo'] })}
                    className="h-8 px-2 bg-brand-bg-soft border border-brand-border rounded-md text-xs text-brand-text-secondary focus:outline-none">
                    {STAKEHOLDERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button onClick={() => removeTaskList(list.id)} className="p-1.5 text-brand-text-muted hover:text-red-400 transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="space-y-2 pl-6">
                  {list.tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 bg-white/40 border border-brand-border/60 rounded-lg p-2.5">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input value={task.title} onChange={e => updateTask(list.id, task.id, { title: e.target.value })} placeholder="Task title"
                            className="flex-1 h-7 px-2 bg-brand-bg-soft border border-brand-border rounded text-xs text-brand-text focus:outline-none focus:border-brand-primary" />
                          <select value={task.category} onChange={e => updateTask(list.id, task.id, { category: e.target.value })}
                            className="h-7 px-1.5 bg-brand-bg-soft border border-brand-border rounded text-[11px] text-brand-text-secondary focus:outline-none">
                            {TASK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <input value={task.description} onChange={e => updateTask(list.id, task.id, { description: e.target.value })} placeholder="Description (optional)"
                          className="w-full h-7 px-2 bg-brand-bg-soft border border-brand-border rounded text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            Due
                            <input type="number" value={task.dueOffsetDays} onChange={e => updateTask(list.id, task.id, { dueOffsetDays: Number(e.target.value) })}
                              className="w-16 h-6 px-1.5 bg-brand-bg-soft border border-brand-border rounded text-[11px] text-brand-text focus:outline-none" />
                            days from last day
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            <input type="checkbox" checked={task.isRequired} onChange={e => updateTask(list.id, task.id, { isRequired: e.target.checked })} className="accent-brand-primary" />
                            Required
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-amber-400" title="Blocks completion while the employee has open expense claims or purchase requests">
                            <input type="checkbox" checked={task.taskType === 'spend_clearance'} onChange={e => updateTask(list.id, task.id, { taskType: e.target.checked ? 'spend_clearance' : undefined })} className="accent-amber-500" />
                            Finance clearance gate
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            <input type="checkbox" checked={!!task.requiresDocument} onChange={e => updateTask(list.id, task.id, { requiresDocument: e.target.checked })} className="accent-brand-primary" />
                            Requires document upload
                          </label>
                        </div>
                      </div>
                      <button onClick={() => removeTask(list.id, task.id)} className="p-1 text-brand-text-muted hover:text-red-400 transition-colors shrink-0"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => addTask(list.id)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addTaskList} className="flex items-center gap-2 h-9 px-4 border border-dashed border-brand-border-strong text-brand-text-secondary hover:text-brand-text hover:border-brand-border-strong text-sm font-semibold rounded-lg transition-colors w-full justify-center">
              <Plus className="h-4 w-4" /> Add Task List
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Asset Checklist</h3>
              <div className="space-y-2">
                {form.assetChecklist.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <input value={a.item} onChange={e => updateAsset(a.id, { item: e.target.value })} placeholder="e.g. Company Laptop"
                      className="flex-1 h-8 px-2.5 bg-brand-bg-soft border border-brand-border rounded-md text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                    <select value={a.category} onChange={e => updateAsset(a.id, { category: e.target.value as AssetCategory })}
                      className="h-8 px-2 bg-brand-bg-soft border border-brand-border rounded-md text-xs text-brand-text-secondary focus:outline-none">
                      {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => removeAsset(a.id)} className="p-1.5 text-brand-text-muted hover:text-red-400 transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addAsset} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mt-2">
                <Plus className="h-3.5 w-3.5" /> Add Asset
              </button>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Access Revocation List</h3>
              <div className="space-y-2">
                {form.accessRevocationList.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <input value={a.system} onChange={e => updateAccess(a.id, { system: e.target.value })} placeholder="e.g. Company Email"
                      className="flex-1 h-8 px-2.5 bg-brand-bg-soft border border-brand-border rounded-md text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                    <select value={a.category} onChange={e => updateAccess(a.id, { category: e.target.value as AccessCategory })}
                      className="h-8 px-2 bg-brand-bg-soft border border-brand-border rounded-md text-xs text-brand-text-secondary focus:outline-none">
                      {ACCESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => removeAccess(a.id)} className="p-1.5 text-brand-text-muted hover:text-red-400 transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addAccess} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mt-2">
                <Plus className="h-3.5 w-3.5" /> Add Access Item
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Documents to Generate</h3>
              <div className="flex flex-wrap gap-1.5">
                {DOCUMENT_TYPES.map(d => {
                  const active = form.documentsToGenerate.includes(d.value);
                  return (
                    <button key={d.value} type="button"
                      onClick={() => setForm(f => ({ ...f, documentsToGenerate: active ? f.documentsToGenerate.filter(x => x !== d.value) : [...f.documentsToGenerate, d.value] }))}
                      className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', active ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary hover:border-brand-border-strong')}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-brand-text">{form.name || 'Untitled Template'}</h3>
              <p className="text-xs text-brand-text-secondary mt-1">{form.exitTypes.length ? form.exitTypes.join(', ') : 'No exit types selected'}</p>
            </div>
            <div className="text-xs">
              <p className="text-brand-text-muted uppercase font-semibold tracking-wide mb-2">Task Lists ({totalTasks} tasks total)</p>
              <div className="space-y-2">
                {form.taskLists.map(l => (
                  <div key={l.id} className="flex items-center justify-between bg-brand-bg-soft/60 border border-brand-border rounded-lg px-3 py-2">
                    <span className="text-brand-text-secondary">{l.name || 'Untitled list'} <span className="text-brand-text-muted">· {STAKEHOLDERS.find(s => s.value === l.assignedTo)?.label}</span></span>
                    <span className="text-brand-text-muted">{l.tasks.length} task{l.tasks.length !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {form.taskLists.length === 0 && <p className="text-brand-text-muted">No task lists added.</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <p className="text-brand-text-secondary">{form.assetChecklist.length} asset checklist item{form.assetChecklist.length !== 1 ? 's' : ''}</p>
              <p className="text-brand-text-secondary">{form.accessRevocationList.length} access revocation item{form.accessRevocationList.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-1.5 h-9 px-4 border border-brand-border text-brand-text-secondary text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-1.5 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        )}
      </div>
    </div>
  );
}
