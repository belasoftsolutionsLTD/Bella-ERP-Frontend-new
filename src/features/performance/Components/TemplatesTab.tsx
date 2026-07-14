'use client';

import { useState } from 'react';
import { Plus, Loader2, FileText, Pencil, Archive } from 'lucide-react';
import { useTemplates } from '../Hooks/useTemplates';
import type { ReviewTemplate } from '../constants';
import { TemplateBuilderModal } from './TemplateBuilderModal';

export function TemplatesTab() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState<ReviewTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = (data: Record<string, unknown>) => {
    setSaving(true);
    const done = () => { setSaving(false); setShowBuilder(false); setEditing(null); };
    if (editing) updateTemplate(editing._id, data, done, () => setSaving(false));
    else createTemplate(data, done, () => setSaving(false));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-brand-text">Review Templates</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">Reusable question sets attached to review cycles.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowBuilder(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted gap-4">
          <FileText className="h-12 w-12" />
          <div className="text-center">
            <p className="font-semibold text-brand-text-secondary">No review templates yet</p>
            <p className="text-sm mt-1">Create one to give reviewers structured questions instead of a blank form.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {templates.map((t) => {
            const questionCount = t.sections.reduce((s, sec) => s + sec.questions.length, 0);
            return (
              <div key={t._id} className="bg-brand-bg-soft border border-brand-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-brand-text">{t.name}</h3>
                    {t.description && <p className="text-xs text-brand-text-muted mt-0.5">{t.description}</p>}
                  </div>
                  {!t.isActive && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary shrink-0">Inactive</span>}
                </div>
                <p className="text-xs text-brand-text-secondary">{t.sections.length} section{t.sections.length !== 1 ? 's' : ''} · {questionCount} question{questionCount !== 1 ? 's' : ''}</p>
                {t.cycleTypes.length > 0 && (
                  <p className="text-[11px] text-brand-text-muted mt-1">Applies to: {t.cycleTypes.join(', ')}</p>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-border">
                  <button onClick={() => { setEditing(t); setShowBuilder(true); }}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {t.isActive && (
                    <button onClick={() => { if (confirm(`Deactivate "${t.name}"? Existing cycles keep it, but it won't be selectable for new ones.`)) deleteTemplate(t._id); }}
                      className="flex items-center gap-1 text-xs text-brand-text-muted hover:text-red-400 font-medium">
                      <Archive className="h-3.5 w-3.5" /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showBuilder && (
        <TemplateBuilderModal
          template={editing}
          onClose={() => { setShowBuilder(false); setEditing(null); }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
