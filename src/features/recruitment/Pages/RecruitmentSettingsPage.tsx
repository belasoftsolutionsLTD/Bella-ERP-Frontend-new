'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmailTemplates } from '../Hooks/useEmailTemplates';
import { useInterviewKits } from '../Hooks/useInterviewKits';
import type { EmailTemplate, EmailTrigger, InterviewKit } from '../types';
import { uid } from '../constants';
import { useConfigSection } from '@/hooks/useConfigSection';
import { JdTemplatesPanel } from '../Components/JdTemplatesPanel';

const TRIGGER_OPTIONS: { value: EmailTrigger; label: string }[] = [
  { value: 'applicationReceived', label: 'Application Received' },
  { value: 'stageAdvance', label: 'Stage Advance' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'offerExtended', label: 'Offer Extended' },
  { value: 'nurture', label: 'Nurture' },
];

function EmailTemplatesTab() {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useEmailTemplates();
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', trigger: 'applicationReceived' as EmailTrigger, subject: '', body: '' });
  const [showForm, setShowForm] = useState(false);

  const startNew = () => { setEditing(null); setForm({ name: '', trigger: 'applicationReceived', subject: '', body: '' }); setShowForm(true); };
  const startEdit = (t: EmailTemplate) => { setEditing(t); setForm({ name: t.name, trigger: t.trigger, subject: t.subject, body: t.body }); setShowForm(true); };

  const submit = async () => {
    const result = editing ? await updateTemplate(editing._id, form) : await createTemplate(form);
    if (result !== undefined || editing) setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-brand-text-secondary">Tokens available: {'{{candidateName}}'}, {'{{jobTitle}}'}, {'{{companyName}}'}</p>
        <Button size="sm" className="bg-primary text-white" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New Template</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Template name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as EmailTrigger }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Body (HTML allowed)" rows={4} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-primary text-white" onClick={submit} disabled={!form.name || !form.subject || !form.body}>{editing ? 'Save' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {templates.map((t) => (
          <div key={t._id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{t.name}</p>
              <p className="text-xs text-brand-text-muted">{TRIGGER_OPTIONS.find((o) => o.value === t.trigger)?.label} · {t.subject}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(t)} className="p-1.5 text-brand-text-secondary hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => deleteTemplate(t._id)} className="p-1.5 text-brand-text-secondary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="p-6 text-sm text-brand-text-secondary text-center">No templates yet.</p>}
      </div>
    </div>
  );
}

function InterviewKitsTab() {
  const { kits, createKit, updateKit, deleteKit } = useInterviewKits();
  const [editing, setEditing] = useState<InterviewKit | null>(null);
  const [name, setName] = useState('');
  const [competencies, setCompetencies] = useState<InterviewKit['competencies']>([]);
  const [showForm, setShowForm] = useState(false);

  const startNew = () => { setEditing(null); setName(''); setCompetencies([]); setShowForm(true); };
  const startEdit = (k: InterviewKit) => { setEditing(k); setName(k.name); setCompetencies(k.competencies); setShowForm(true); };

  const addCompetency = () => setCompetencies((c) => [...c, { competencyId: uid(), competencyName: '', suggestedQuestions: [''], evaluationGuidance: '' }]);

  const submit = async () => {
    const payload = { name, competencies };
    const result = editing ? await updateKit(editing._id, payload) : await createKit(payload);
    if (result !== undefined || editing) setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-primary text-white" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New Interview Kit</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kit name (e.g. Engineering Technical Interview)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {competencies.map((c, i) => (
            <div key={c.competencyId} className="border border-slate-200 rounded-lg p-3 space-y-1.5">
              <input
                value={c.competencyName}
                onChange={(e) => setCompetencies((list) => list.map((x, xi) => xi === i ? { ...x, competencyName: e.target.value } : x))}
                placeholder="Competency name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={c.suggestedQuestions.join('\n')}
                onChange={(e) => setCompetencies((list) => list.map((x, xi) => xi === i ? { ...x, suggestedQuestions: e.target.value.split('\n') } : x))}
                placeholder="Suggested questions (one per line)"
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={c.evaluationGuidance}
                onChange={(e) => setCompetencies((list) => list.map((x, xi) => xi === i ? { ...x, evaluationGuidance: e.target.value } : x))}
                placeholder="Evaluation guidance"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button onClick={() => setCompetencies((list) => list.filter((_, xi) => xi !== i))} className="text-xs text-red-500">Remove</button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addCompetency}><Plus className="h-4 w-4 mr-1" /> Add Competency</Button>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button size="sm" className="bg-primary text-white" onClick={submit} disabled={!name}>{editing ? 'Save' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {kits.map((k) => (
          <div key={k._id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{k.name}</p>
              <p className="text-xs text-brand-text-muted">{k.competencies.length} competenc{k.competencies.length !== 1 ? 'ies' : 'y'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(k)} className="p-1.5 text-brand-text-secondary hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => deleteKit(k._id)} className="p-1.5 text-brand-text-secondary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {kits.length === 0 && <p className="p-6 text-sm text-brand-text-secondary text-center">No interview kits yet.</p>}
      </div>
    </div>
  );
}

export function RecruitmentSettingsPage() {
  const [tab, setTab] = useState<'templates' | 'kits' | 'jdTemplates'>('templates');
  const jdTemplates = useConfigSection('jd-templates');

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">Recruitment Settings</h1>
        <p className="text-sm text-brand-text-secondary">Email templates, interview kits, and JD templates</p>
      </div>

      <div className="flex gap-1 border-b border-brand-border">
        {(['templates', 'kits', 'jdTemplates'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-brand-text-secondary'}`}>
            {t === 'templates' ? 'Email Templates' : t === 'kits' ? 'Interview Kits' : 'JD Templates'}
          </button>
        ))}
      </div>

      {tab === 'templates' && <EmailTemplatesTab />}
      {tab === 'kits' && <InterviewKitsTab />}
      {tab === 'jdTemplates' && (
        <JdTemplatesPanel
          items={jdTemplates.items as any}
          loading={jdTemplates.loading}
          refetch={jdTemplates.refetch}
        />
      )}
    </div>
  );
}
