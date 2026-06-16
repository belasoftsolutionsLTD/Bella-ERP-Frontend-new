'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ClipboardList, Pencil, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Template {
  _id: string;
  title: string;
  description: string;
  department: string;
  daysToComplete: number;
}

const EMPTY_FORM = { title: '', description: '', department: 'All', daysToComplete: '7' };

export function TemplatesPanel() {
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/onboarding/templates`,
      showToast: false,
      thenFn: (r) => setTemplates(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/templates`,
      method: 'POST',
      data: { ...form, daysToComplete: parseInt(form.daysToComplete) || 7 },
      thenFn: () => {
        toast.success('Task template added.');
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchTemplates();
      },
    });
    setSaving(false);
  };

  const startEdit = (t: Template) => {
    setEditingId(t._id);
    setEditForm({ title: t.title, description: t.description, department: t.department, daysToComplete: String(t.daysToComplete) });
    setConfirmDelete(null);
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.title.trim()) return;
    setEditSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/templates/${id}`,
      method: 'PUT',
      data: { ...editForm, daysToComplete: parseInt(editForm.daysToComplete) || 7 },
      thenFn: () => {
        toast.success('Template updated.');
        setEditingId(null);
        fetchTemplates();
      },
    });
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/templates/${id}`,
      method: 'DELETE',
      thenFn: () => {
        toast.success('Template removed.');
        setConfirmDelete(null);
        fetchTemplates();
      },
    });
    setDeleting(null);
  };

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">{label}</label>
      {node}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Default Task Templates</h2>
          <p className="text-xs text-foreground/50 mt-0.5">
            These tasks are automatically assigned to every new employee on hire.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Template
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-foreground">New Template</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {field('Task Title *',
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Sign employment contract" required className={inputCls} />
              )}
            </div>
            {field('Assigned To',
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="HR / IT / All" className={inputCls} />
            )}
            {field('Days to Complete',
              <input type="number" min={1} value={form.daysToComplete}
                onChange={e => setForm(f => ({ ...f, daysToComplete: e.target.value }))} className={inputCls} />
            )}
            <div className="sm:col-span-2">
              {field('Description',
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..." rows={2} className={`${inputCls} resize-none`} />
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="h-6 w-6 rounded-full border-4 border-primary border-t-accent animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-foreground/30 gap-2 border rounded-xl bg-white">
          <ClipboardList className="h-8 w-8" />
          <p className="text-sm">No templates yet. Add tasks that every new hire should complete.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t._id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              {editingId === t._id ? (
                /* ── Inline edit form ── */
                <div className="p-4 space-y-3 bg-primary/5 border-l-4 border-primary">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Editing template</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      {field('Task Title *',
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className={inputCls} />
                      )}
                    </div>
                    {field('Assigned To',
                      <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                        className={inputCls} />
                    )}
                    {field('Days to Complete',
                      <input type="number" min={1} value={editForm.daysToComplete}
                        onChange={e => setEditForm(f => ({ ...f, daysToComplete: e.target.value }))} className={inputCls} />
                    )}
                    <div className="sm:col-span-2">
                      {field('Description',
                        <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          rows={2} className={`${inputCls} resize-none`} />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-white">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                    <button onClick={() => handleUpdate(t._id)} disabled={editSaving || !editForm.title.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
                      {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Read view ── */
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <ClipboardList className="h-5 w-5 text-primary/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-foreground/40">
                      {t.department} · Due within {t.daysToComplete} day{t.daysToComplete !== 1 ? 's' : ''}
                      {t.description ? ` · ${t.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(t)}
                      className="p-1.5 text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {confirmDelete === t._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground/50">Remove?</span>
                        <button onClick={() => handleDelete(t._id)} disabled={deleting === t._id}
                          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
                          {deleting === t._id ? 'Removing…' : 'Yes'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-foreground/40 hover:text-foreground">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(t._id)}
                        className="p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
