'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, X, Loader2, Search, GripVertical, Upload, FileText, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useOnboardingTemplate } from '../Hooks/useOnboardingTemplates';
import { CreateOnboardingTemplateSchema } from '../schemas';
import type { AssigneeType, OnboardingTaskListTemplate, MeetTheTeamTemplateEntry } from '../types';

const DEPARTMENTS = [
  'Administration', 'Human Resources', 'Finance & Accounts', 'Information Technology',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance',
  'Procurement', 'Logistics & Supply Chain', 'Research & Development', 'Communications',
  'Health & Safety', 'Facilities Management', 'Executive',
];

const STAKEHOLDERS: { value: AssigneeType; label: string }[] = [
  { value: 'hr', label: 'HR' },
  { value: 'it', label: 'IT' },
  { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'newHire', label: 'New Hire' },
];

const STEPS = ['Basic Info', 'Meet the Team', 'Task Lists', 'Review & Save'];

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);

interface EmpOption { _id: string; fullName: string; department: string; designation?: string }

interface FormState {
  name: string;
  description: string;
  targetRoles: string[];
  targetDepartments: string[];
  welcomeMessage: string;
  firstDayDetails: { location: string; reportingTime: string; whatToBring: string; additionalNotes: string };
  meetTheTeam: (MeetTheTeamTemplateEntry & { _empName?: string })[];
  taskLists: OnboardingTaskListTemplate[];
}

const emptyForm: FormState = {
  name: '', description: '', targetRoles: [], targetDepartments: [],
  welcomeMessage: '',
  firstDayDetails: { location: '', reportingTime: '', whatToBring: '', additionalNotes: '' },
  meetTheTeam: [],
  taskLists: [],
};

function ResourceUploadControl({ resourceUrl, onAttach, onRemove }: { resourceUrl?: string; onAttach: (fileUrl: string) => void; onRemove: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/onboarding/templates/upload-resource`, method: 'POST', data: formData,
      thenFn: (r) => onAttach(r.data.fileUrl),
      finallyFn: () => setUploading(false),
    });
  };

  if (resourceUrl) {
    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <button type="button" onClick={() => openFile(resolveUploadUrl(resourceUrl)).catch(() => {})}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
          <FileText className="h-3 w-3" /> Resource attached <ExternalLink className="h-3 w-3" />
        </button>
        <button type="button" onClick={onRemove} className="text-brand-text-muted hover:text-red-400 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary hover:text-brand-text cursor-pointer transition-colors">
      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
      {uploading ? 'Uploading…' : 'Attach resource'}
      <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

export default function TemplateBuilderPage({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const isEdit = !!templateId;
  const { template, loading, create, update } = useOnboardingTemplate(templateId ?? null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [employees, setEmployees] = useState<EmpOption[]>([]);

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name,
        description: template.description,
        targetRoles: template.targetRoles,
        targetDepartments: template.targetDepartments,
        welcomeMessage: template.welcomeMessage,
        firstDayDetails: template.firstDayDetails,
        meetTheTeam: template.meetTheTeam,
        taskLists: template.taskLists,
      });
    }
  }, [template]);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees?limit=500`, showToast: false, thenFn: r => setEmployees(r.data?.data ?? r.data ?? []) });
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!empSearch.trim()) return [];
    const q = empSearch.toLowerCase();
    return employees.filter(e => e.fullName.toLowerCase().includes(q) && !form.meetTheTeam.some(m => m.employeeId === e._id)).slice(0, 8);
  }, [empSearch, employees, form.meetTheTeam]);

  const totalTasks = form.taskLists.reduce((n, l) => n + l.tasks.length, 0);

  const handleSave = () => {
    const parsed = CreateOnboardingTemplateSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please fix form errors before saving.');
      return;
    }
    setSaving(true);
    const payload = parsed.data;
    if (isEdit) {
      update(payload, () => { toast.success('Template updated.'); router.push(`/${locale}/onboarding/templates`); });
      setSaving(false);
    } else {
      create(payload, () => { toast.success('Template created.'); router.push(`/${locale}/onboarding/templates`); });
      setSaving(false);
    }
  };

  const addTaskList = () => {
    setForm(f => ({ ...f, taskLists: [...f.taskLists, { id: uid(), name: '', assignedTo: 'hr', tasks: [] }] }));
  };
  const removeTaskList = (listId: string) => setForm(f => ({ ...f, taskLists: f.taskLists.filter(l => l.id !== listId) }));
  const updateTaskList = (listId: string, patch: Partial<OnboardingTaskListTemplate>) =>
    setForm(f => ({ ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, ...patch } : l) }));

  const addTask = (listId: string) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? {
      ...l, tasks: [...l.tasks, { id: uid(), title: '', description: '', dueOffsetDays: 0, isRequired: true, requiresDocument: false }],
    } : l),
  }));
  const removeTask = (listId: string, taskId: string) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l),
  }));
  const updateTask = (listId: string, taskId: string, patch: Record<string, unknown>) => setForm(f => ({
    ...f, taskLists: f.taskLists.map(l => l.id === listId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) } : l),
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push(`/${locale}/onboarding/templates`)} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Templates
        </button>
        <h1 className="text-xl font-bold text-brand-text">{isEdit ? 'Edit Template' : 'New Onboarding Template'}</h1>
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
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Software Engineer Onboarding"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Target Roles</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.targetRoles.map(r => (
                  <span key={r} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-brand-primary/15 text-indigo-300">
                    {r}
                    <button onClick={() => setForm(f => ({ ...f, targetRoles: f.targetRoles.filter(x => x !== r) }))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <input value={roleInput} onChange={e => setRoleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && roleInput.trim()) { e.preventDefault(); setForm(f => ({ ...f, targetRoles: [...f.targetRoles, roleInput.trim()] })); setRoleInput(''); } }}
                placeholder="Type a role and press Enter (leave empty for all roles)"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Target Departments <span className="text-brand-text-muted normal-case">(leave empty for all)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(d => {
                  const active = form.targetDepartments.includes(d);
                  return (
                    <button key={d} type="button"
                      onClick={() => setForm(f => ({ ...f, targetDepartments: active ? f.targetDepartments.filter(x => x !== d) : [...f.targetDepartments, d] }))}
                      className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', active ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary hover:border-brand-border-strong')}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Welcome Message</label>
              <textarea value={form.welcomeMessage} onChange={e => setForm(f => ({ ...f, welcomeMessage: e.target.value }))} rows={3}
                placeholder="Welcome to the team! We're thrilled to have you…"
                className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">First Day Location</label>
                <input value={form.firstDayDetails.location} onChange={e => setForm(f => ({ ...f, firstDayDetails: { ...f.firstDayDetails, location: e.target.value } }))}
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Reporting Time</label>
                <input value={form.firstDayDetails.reportingTime} onChange={e => setForm(f => ({ ...f, firstDayDetails: { ...f.firstDayDetails, reportingTime: e.target.value } }))}
                  placeholder="e.g. 8:00 AM"
                  className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">What To Bring</label>
              <input value={form.firstDayDetails.whatToBring} onChange={e => setForm(f => ({ ...f, firstDayDetails: { ...f.firstDayDetails, whatToBring: e.target.value } }))}
                placeholder="e.g. National ID, bank details"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Additional Notes</label>
              <textarea value={form.firstDayDetails.additionalNotes} onChange={e => setForm(f => ({ ...f, firstDayDetails: { ...f.firstDayDetails, additionalNotes: e.target.value } }))} rows={2}
                className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Add Team Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees to introduce…"
                  className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              {filteredEmployees.length > 0 && (
                <div className="mt-1.5 border border-brand-border rounded-lg overflow-hidden">
                  {filteredEmployees.map(e => (
                    <button key={e._id} onClick={() => { setForm(f => ({ ...f, meetTheTeam: [...f.meetTheTeam, { employeeId: e._id, note: '', _empName: e.fullName }] })); setEmpSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg-muted/50 transition-colors border-b border-brand-border/60 last:border-0">
                      {e.fullName} <span className="text-xs text-brand-text-muted">· {e.designation || e.department}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.meetTheTeam.length === 0 ? (
              <p className="text-xs text-brand-text-muted text-center py-8">No team members added yet. Optional — you can skip this step.</p>
            ) : (
              <div className="space-y-2">
                {form.meetTheTeam.map((m, idx) => (
                  <div key={m.employeeId} className="flex items-start gap-2 bg-brand-bg-soft/60 border border-brand-border rounded-lg p-3">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-medium text-brand-text">{m._empName ?? m.employeeId}</p>
                      <input value={m.note} onChange={e => setForm(f => ({ ...f, meetTheTeam: f.meetTheTeam.map((x, i) => i === idx ? { ...x, note: e.target.value } : x) }))}
                        placeholder="Note (e.g. Your onboarding buddy)"
                        className="w-full h-8 px-2.5 bg-brand-bg-soft border border-brand-border rounded-md text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, meetTheTeam: f.meetTheTeam.filter((_, i) => i !== idx) }))} className="p-1.5 text-brand-text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {form.taskLists.length === 0 && (
              <p className="text-xs text-brand-text-muted text-center py-6">No task lists yet. Group tasks by who's responsible for them.</p>
            )}
            {form.taskLists.map(list => (
              <div key={list.id} className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-bg-soft/40">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-brand-text-muted shrink-0" />
                  <input value={list.name} onChange={e => updateTaskList(list.id, { name: e.target.value })} placeholder="List name (e.g. IT Setup)"
                    className="flex-1 h-8 px-2.5 bg-brand-bg-soft border border-brand-border rounded-md text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                  <select value={list.assignedTo} onChange={e => updateTaskList(list.id, { assignedTo: e.target.value as AssigneeType })}
                    className="h-8 px-2 bg-brand-bg-soft border border-brand-border rounded-md text-xs text-brand-text-secondary focus:outline-none">
                    {STAKEHOLDERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button onClick={() => removeTaskList(list.id)} className="p-1.5 text-brand-text-muted hover:text-red-400 transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>

                <div className="space-y-2 pl-6">
                  {list.tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 bg-white/40 border border-brand-border/60 rounded-lg p-2.5">
                      <div className="flex-1 space-y-1.5">
                        <input value={task.title} onChange={e => updateTask(list.id, task.id, { title: e.target.value })} placeholder="Task title"
                          className="w-full h-7 px-2 bg-brand-bg-soft border border-brand-border rounded text-xs text-brand-text focus:outline-none focus:border-brand-primary" />
                        <input value={task.description} onChange={e => updateTask(list.id, task.id, { description: e.target.value })} placeholder="Description (optional)"
                          className="w-full h-7 px-2 bg-brand-bg-soft border border-brand-border rounded text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            Due
                            <input type="number" value={task.dueOffsetDays} onChange={e => updateTask(list.id, task.id, { dueOffsetDays: Number(e.target.value) })}
                              className="w-16 h-6 px-1.5 bg-brand-bg-soft border border-brand-border rounded text-[11px] text-brand-text focus:outline-none" />
                            days from start
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            <input type="checkbox" checked={task.isRequired} onChange={e => updateTask(list.id, task.id, { isRequired: e.target.checked })} className="accent-brand-primary" />
                            Required
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
                            <input type="checkbox" checked={task.requiresDocument} onChange={e => updateTask(list.id, task.id, { requiresDocument: e.target.checked })} className="accent-brand-primary" />
                            Requires document
                          </label>
                          <ResourceUploadControl
                            resourceUrl={task.resourceUrl}
                            onAttach={(fileUrl) => updateTask(list.id, task.id, { resourceUrl: fileUrl })}
                            onRemove={() => updateTask(list.id, task.id, { resourceUrl: undefined })}
                          />
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

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-brand-text">{form.name || 'Untitled Template'}</h3>
              <p className="text-xs text-brand-text-secondary mt-1">{form.description || 'No description'}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-brand-text-muted uppercase font-semibold tracking-wide mb-1">Target Roles</p>
                <p className="text-brand-text-secondary">{form.targetRoles.length ? form.targetRoles.join(', ') : 'All roles'}</p>
              </div>
              <div>
                <p className="text-brand-text-muted uppercase font-semibold tracking-wide mb-1">Target Departments</p>
                <p className="text-brand-text-secondary">{form.targetDepartments.length ? form.targetDepartments.join(', ') : 'All departments'}</p>
              </div>
            </div>
            <div className="text-xs">
              <p className="text-brand-text-muted uppercase font-semibold tracking-wide mb-1">Meet the Team</p>
              <p className="text-brand-text-secondary">{form.meetTheTeam.length} member{form.meetTheTeam.length !== 1 ? 's' : ''} introduced</p>
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
