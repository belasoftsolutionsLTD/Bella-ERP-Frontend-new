'use client';
import { useState } from 'react';
import { Award, GraduationCap, Sparkles, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Employee } from '../Hooks/useEmployees';

interface Certification { id: string; name: string; issuingOrganization: string; issueDate: string; expiryDate?: string | null; fileUrl?: string | null; }
interface EducationEntry { id: string; institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear?: number | null; }

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—';

function SkillsSection({ employeeId, skills, isHR, onChanged }: { employeeId: string; skills: string[]; isHR: boolean; onChanged: () => void }) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const save = (next: string[]) => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${employeeId}/skills`, method: 'PATCH', data: { skills: next },
      thenFn: onChanged, finallyFn: () => setSaving(false),
    });
  };

  const addSkill = () => {
    const v = input.trim();
    if (!v || skills.includes(v)) return;
    setInput('');
    save([...skills, v]);
  };

  const removeSkill = (s: string) => save(skills.filter(x => x !== s));

  return (
    <div className="rounded-xl border bg-white p-4">
      <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 mb-3"><Sparkles className="h-4 w-4 text-brand-primary" /> Skills</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.length === 0 && <p className="text-sm text-slate-400">No skills recorded yet.</p>}
        {skills.map(s => (
          <span key={s} className="flex items-center gap-1.5 text-xs font-medium bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
            {s}
            {isHR && (
              <button onClick={() => removeSkill(s)} disabled={saving} className="hover:text-red-600"><X className="h-3 w-3" /></button>
            )}
          </span>
        ))}
      </div>
      {isHR && (
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Add a skill…" className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
          <button onClick={addSkill} disabled={saving || !input.trim()} className="flex items-center gap-1 h-9 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
          </button>
        </div>
      )}
    </div>
  );
}

function CertificationsSection({ employeeId, certifications, isHR, onChanged }: { employeeId: string; certifications: Certification[]; isHR: boolean; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', issuingOrganization: '', issueDate: '', expiryDate: '' });
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!form.name.trim() || !form.issuingOrganization.trim() || !form.issueDate) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${employeeId}/certifications`, method: 'POST', data: form,
      thenFn: () => { setForm({ name: '', issuingOrganization: '', issueDate: '', expiryDate: '' }); setShowForm(false); onChanged(); },
      finallyFn: () => setSaving(false),
    });
  };

  const remove = (id: string) => {
    if (!confirm('Remove this certification?')) return;
    apiCallFunction({ url: `${API_BASE_URL}/employees/${employeeId}/certifications/${id}`, method: 'DELETE', thenFn: onChanged });
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> Certifications</h4>
        {isHR && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
      {showForm && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Certification name *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <input value={form.issuingOrganization} onChange={e => setForm(f => ({ ...f, issuingOrganization: e.target.value }))} placeholder="Issuing organization *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} placeholder="Expiry (optional)" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1.5 h-8 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2">Cancel</button>
          </div>
        </div>
      )}
      {certifications.length === 0 ? (
        <p className="text-sm text-slate-400">No certifications recorded yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {certifications.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400">{c.issuingOrganization} · {fmtDate(c.issueDate)}{c.expiryDate ? ` – ${fmtDate(c.expiryDate)}` : ''}</p>
              </div>
              {isHR && (
                <button onClick={() => remove(c.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationSection({ employeeId, educationHistory, isHR, onChanged }: { employeeId: string; educationHistory: EducationEntry[]; isHR: boolean; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' });
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!form.institution.trim() || !form.degree.trim() || !form.fieldOfStudy.trim() || !form.startYear) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${employeeId}/education`, method: 'POST', data: form,
      thenFn: () => { setForm({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }); setShowForm(false); onChanged(); },
      finallyFn: () => setSaving(false),
    });
  };

  const remove = (id: string) => {
    if (!confirm('Remove this education entry?')) return;
    apiCallFunction({ url: `${API_BASE_URL}/employees/${employeeId}/education/${id}`, method: 'DELETE', thenFn: onChanged });
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-emerald-500" /> Education</h4>
        {isHR && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
      {showForm && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="Institution *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <input value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="Degree *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <input value={form.fieldOfStudy} onChange={e => setForm(f => ({ ...f, fieldOfStudy: e.target.value }))} placeholder="Field of study *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} placeholder="Start year *" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))} placeholder="End year" className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1.5 h-8 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2">Cancel</button>
          </div>
        </div>
      )}
      {educationHistory.length === 0 ? (
        <p className="text-sm text-slate-400">No education history recorded yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {educationHistory.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{e.degree} in {e.fieldOfStudy}</p>
                <p className="text-xs text-slate-400">{e.institution} · {e.startYear}{e.endYear ? ` – ${e.endYear}` : ' – present'}</p>
              </div>
              {isHR && (
                <button onClick={() => remove(e.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillsTab({ employee, onChanged }: { employee: Employee; onChanged: () => void }) {
  const { isHR } = useAuth();
  const emp = employee as any;

  return (
    <div className="space-y-4">
      <SkillsSection employeeId={employee._id} skills={emp.skills ?? []} isHR={isHR} onChanged={onChanged} />
      <CertificationsSection employeeId={employee._id} certifications={emp.certifications ?? []} isHR={isHR} onChanged={onChanged} />
      <EducationSection employeeId={employee._id} educationHistory={emp.educationHistory ?? []} isHR={isHR} onChanged={onChanged} />
    </div>
  );
}
