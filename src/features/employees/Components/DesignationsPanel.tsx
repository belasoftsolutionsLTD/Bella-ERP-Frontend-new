'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, Building2 } from 'lucide-react';
import type { ConfigItem } from '@/hooks/useConfigSection';

interface Props {
  items: ConfigItem[];
  loading: boolean;
  departments: ConfigItem[];
  onCreate: (data: Record<string, unknown>) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

interface FormState { name: string; departmentIds: string[] }
const emptyForm = (): FormState => ({ name: '', departmentIds: [] });

interface DesignationItem extends ConfigItem {
  departmentIds?: string[];
}

export function DesignationsPanel({ items, loading, departments, onCreate, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); };

  const toggleDept = (id: string) =>
    setForm(f => ({
      ...f,
      departmentIds: f.departmentIds.includes(id)
        ? f.departmentIds.filter(x => x !== id)
        : [...f.departmentIds, id],
    }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const data = { name: form.name.trim(), departmentIds: form.departmentIds };
    editId ? onUpdate(editId, data) : onCreate(data);
    resetForm();
  };

  const startEdit = (item: DesignationItem) => {
    setForm({ name: item.name, departmentIds: item.departmentIds ?? [] });
    setEditId(item._id);
    setShowForm(true);
  };

  const deptName = (id: string) => departments.find(d => d._id === id)?.name ?? id;

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">Designations</h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            Each designation can be linked to one or more departments. Used to auto-filter departments when onboarding.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex flex-col gap-1 max-w-xs">
            <label className="text-xs text-foreground/60">Designation Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Senior Teacher"
              className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="text-xs text-foreground/60 flex items-center gap-1.5 mb-2">
              <Building2 className="h-3.5 w-3.5" /> Related Departments
              <span className="text-foreground/30 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {departments.length === 0
                ? <p className="text-xs text-foreground/40 italic">No departments configured yet.</p>
                : departments.map(d => {
                    const selected = form.departmentIds.includes(d._id);
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => toggleDept(d._id)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'border-brand-border text-foreground/60 hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })
              }
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 text-xs bg-accent text-primary px-3 py-1.5 rounded-lg font-medium"
            >
              <Check className="h-3.5 w-3.5" /> Save
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
        <div className="p-8 text-center text-sm text-foreground/50">No designations configured yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-foreground/60 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Designation</th>
              <th className="px-4 py-2.5 text-left font-medium">Departments</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(items as DesignationItem[]).map(item => {
              const deptIds = item.departmentIds ?? [];
              return (
                <tr key={item._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    {deptIds.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {deptIds.map(id => (
                            <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                              {deptName(id)}
                            </span>
                          ))}
                        </div>
                      : <span className="text-xs text-foreground/40 italic">No departments linked</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === item._id ? (
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-xs text-foreground/50">Delete?</span>
                        <button
                          onClick={() => { onDelete(item._id); setConfirmDeleteId(null); }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-brand-border hover:bg-gray-50"
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
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
