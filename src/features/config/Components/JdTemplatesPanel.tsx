'use client';

import { useRef, useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, FileText, Upload, ExternalLink } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { ConfigItem } from '../Hooks/useHrConfig';

interface JdTemplate extends ConfigItem {
  description?: string;
  roles?: string;
  pdfPath?: string;
  pdfOriginalName?: string;
}

interface Props {
  items: JdTemplate[];
  loading: boolean;
  refetch: () => void;
}

interface FormState {
  name: string;
  description: string;
  roles: string;
  pdfFile: File | null;
}
const emptyForm = (): FormState => ({ name: '', description: '', roles: '', pdfFile: null });

export function JdTemplatesPanel({ items, loading, refetch }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('description', form.description);
    fd.append('roles', form.roles);
    if (form.pdfFile) fd.append('jdPdf', form.pdfFile);

    const url = editId
      ? `${API_BASE_URL}/config/jd-templates/${editId}`
      : `${API_BASE_URL}/config/jd-templates`;

    await apiCallFunction({
      url,
      method: editId ? 'PUT' : 'POST',
      data: fd,
      thenFn: () => { refetch(); resetForm(); },
    });
    setSaving(false);
  };

  const startEdit = (item: JdTemplate) => {
    setForm({ name: item.name, description: item.description ?? '', roles: item.roles ?? '', pdfFile: null });
    setEditId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await apiCallFunction({
      url: `${API_BASE_URL}/config/jd-templates/${id}`,
      method: 'DELETE',
      thenFn: () => refetch(),
    });
    setConfirmDeleteId(null);
  };

  const openPdf = async (id: string) => {
    const token = sessionStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/config/jd-templates/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">JD Templates</h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            Upload reusable job description PDFs. When onboarding, HR picks one instead of uploading a fresh PDF each time.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Template
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Template Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Teacher JD, Intern JD"
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Roles / Keywords</label>
              <input
                value={form.roles}
                onChange={e => setForm(f => ({ ...f, roles: e.target.value }))}
                placeholder="e.g. teacher, lecturer, tutor"
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-foreground/60">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of what this JD covers"
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {editId ? 'Replace PDF (optional)' : 'JD PDF *'}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => setForm(f => ({ ...f, pdfFile: e.target.files?.[0] ?? null }))}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`h-10 w-full border-2 border-dashed rounded-xl px-3 text-sm text-left transition-colors ${
                form.pdfFile
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 text-foreground/40 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              {form.pdfFile ? form.pdfFile.name : 'Click to upload PDF…'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-accent text-primary px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-lg"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-foreground/50">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-foreground/50">No JD templates yet. Add one above.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-foreground/60 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Template Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Roles / Keywords</th>
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-left font-medium">PDF</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-foreground/60">{item.roles || '—'}</td>
                <td className="px-4 py-3 text-foreground/50 max-w-[240px] truncate">{item.description || '—'}</td>
                <td className="px-4 py-3">
                  {item.pdfPath ? (
                    <button
                      onClick={() => openPdf(item._id)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View PDF
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </button>
                  ) : (
                    <span className="text-xs text-foreground/30 italic">No PDF</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {confirmDeleteId === item._id ? (
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-xs text-foreground/50">Delete?</span>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded hover:bg-gray-100 text-foreground/60 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(item._id)}
                        className="p-1.5 rounded hover:bg-red-50 text-foreground/60 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
