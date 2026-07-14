'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewTemplate, TemplateSection } from '../constants';

const CYCLE_TYPE_OPTIONS = [
  { value: 'self_manager', label: 'Self + Manager' },
  { value: '360',          label: '360°' },
  { value: 'upward',       label: 'Upward Review' },
  { value: 'peer',         label: 'Peer Review' },
];

interface Props {
  template?: ReviewTemplate | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

let tmpId = 0;
const nextTmpId = () => `tmp-${Date.now()}-${tmpId++}`;

export function TemplateBuilderModal({ template, onClose, onSave, saving }: Props) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [cycleTypes, setCycleTypes] = useState<string[]>(template?.cycleTypes ?? []);
  const [sections, setSections] = useState<TemplateSection[]>(
    template?.sections?.length ? template.sections : [{ id: nextTmpId(), title: 'General', questions: [] }],
  );

  const toggleCycleType = (v: string) =>
    setCycleTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const addSection = () => setSections((s) => [...s, { id: nextTmpId(), title: '', questions: [] }]);
  const removeSection = (id: string) => setSections((s) => s.filter((sec) => sec.id !== id));
  const updateSectionTitle = (id: string, title: string) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, title } : sec)));

  const addQuestion = (sectionId: string) =>
    setSections((s) => s.map((sec) => (sec.id === sectionId
      ? { ...sec, questions: [...sec.questions, { id: nextTmpId(), text: '', type: 'rating', scaleMax: 5 }] }
      : sec)));

  const removeQuestion = (sectionId: string, qId: string) =>
    setSections((s) => s.map((sec) => (sec.id === sectionId
      ? { ...sec, questions: sec.questions.filter((q) => q.id !== qId) }
      : sec)));

  const updateQuestion = (sectionId: string, qId: string, patch: Partial<TemplateSection['questions'][number]>) =>
    setSections((s) => s.map((sec) => (sec.id === sectionId
      ? { ...sec, questions: sec.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
      : sec)));

  const canSave = name.trim().length > 0 && sections.some((s) => s.questions.length > 0);

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      description: description.trim(),
      cycleTypes,
      sections: sections.filter((s) => s.questions.length > 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">{template ? 'Edit Template' : 'New Review Template'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Quarterly Review"
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Applies to Cycle Types</label>
            <div className="flex flex-wrap gap-2">
              {CYCLE_TYPE_OPTIONS.map((ct) => (
                <button key={ct.value} type="button" onClick={() => toggleCycleType(ct.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    cycleTypes.includes(ct.value) ? 'border-brand-primary bg-brand-primary/10 text-indigo-300' : 'border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:border-brand-border-strong',
                  )}>
                  {ct.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-brand-text-muted mt-1">Leave all unselected to allow this template on any cycle type.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Sections & Questions</label>
              <button type="button" onClick={addSection} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                <Plus className="h-3.5 w-3.5" /> Add Section
              </button>
            </div>

            {sections.map((section) => (
              <div key={section.id} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input value={section.title} onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                    placeholder="Section title (e.g. Communication)"
                    className="flex-1 h-9 bg-white border border-brand-border rounded-lg px-3 text-sm font-semibold text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                  {sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(section.id)} className="p-2 text-brand-text-muted hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {section.questions.map((q) => (
                    <div key={q.id} className="flex items-start gap-2">
                      <input value={q.text} onChange={(e) => updateQuestion(section.id, q.id, { text: e.target.value })}
                        placeholder="Question text"
                        className="flex-1 h-9 bg-white border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                      <select value={q.type} onChange={(e) => updateQuestion(section.id, q.id, { type: e.target.value as 'rating' | 'text' })}
                        className="h-9 bg-white border border-brand-border rounded-lg px-2 text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary">
                        <option value="rating">Rating</option>
                        <option value="text">Text</option>
                      </select>
                      {q.type === 'rating' && (
                        <select value={q.scaleMax ?? 5} onChange={(e) => updateQuestion(section.id, q.id, { scaleMax: Number(e.target.value) })}
                          className="h-9 bg-white border border-brand-border rounded-lg px-2 text-xs text-brand-text-secondary focus:outline-none focus:border-brand-primary">
                          {[3, 4, 5, 10].map((n) => <option key={n} value={n}>1–{n}</option>)}
                        </select>
                      )}
                      <button type="button" onClick={() => removeQuestion(section.id, q.id)} className="p-2 text-brand-text-muted hover:text-red-400 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addQuestion(section.id)}
                  className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-indigo-300 font-medium">
                  <Plus className="h-3.5 w-3.5" /> Add Question
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!canSave || saving}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
