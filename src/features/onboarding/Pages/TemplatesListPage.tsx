'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Plus, FileText, Pencil, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useOnboardingTemplates } from '../Hooks/useOnboardingTemplates';

export default function TemplatesListPage() {
  const locale = useLocale();
  const { templates, loading, remove } = useOnboardingTemplates();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    remove(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/onboarding`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Onboarding
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Onboarding Templates</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Reusable task lists and welcome content for new hires</p>
        </div>
        <Link href={`/${locale}/onboarding/templates/new`} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-text-muted gap-4 border border-dashed border-brand-border/60 rounded-2xl bg-brand-bg-soft">
          <FileText className="h-12 w-12" />
          <p className="text-sm font-semibold text-brand-text-secondary">No templates yet</p>
          <Link href={`/${locale}/onboarding/templates/new`} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> New Template
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t._id} className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5 flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-bold text-brand-text">{t.name}</h3>
                <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">{t.description || 'No description'}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.targetDepartments.length === 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">All departments</span>
                ) : t.targetDepartments.map(d => (
                  <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/15 text-indigo-300">{d}</span>
                ))}
              </div>
              <p className="text-[11px] text-brand-text-muted">{t.taskLists.reduce((n, l) => n + l.tasks.length, 0)} tasks across {t.taskLists.length} list{t.taskLists.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-brand-border/60">
                <Link href={`/${locale}/onboarding/templates/${t._id}/edit`} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button onClick={() => handleDelete(t._id, t.name)} className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors ml-auto">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
