'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { fmtNumber } from '@/lib/utils';
import type { ConfigItem } from '@/hooks/useConfigSection';

interface Column { key: keyof ConfigItem; label: string; type?: 'number' | 'integer' | 'text' | 'checkbox' }

interface Props {
  title: string;
  items: ConfigItem[];
  columns: Column[];
  loading: boolean;
  onCreate: (data: Record<string, unknown>) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  defaultForm: Record<string, string>;
}

export function ConfigTable({ title, items, columns, loading, onCreate, onUpdate, onDelete, defaultForm }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(defaultForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => { setForm(defaultForm); setShowForm(false); setEditId(null); };

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    columns.forEach(({ key, type }) => {
      const val = form[key as string];
      if (type === 'number' || type === 'integer') data[key as string] = val ? Number(val) : null;
      else if (type === 'checkbox') data[key as string] = val === 'true';
      else data[key as string] = val;
    });
    if (editId) { onUpdate(editId, data); }
    else { onCreate(data); }
    resetForm();
  };

  const startEdit = (item: ConfigItem) => {
    const f: Record<string, string> = {};
    columns.forEach(({ key }) => { f[key as string] = String((item as any)[key] ?? ''); });
    setForm(f);
    setEditId(item._id);
    setShowForm(true);
  };

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
          {columns.map(({ key, label, type }) => (
            <div key={key as string} className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-foreground/60">{label}</label>
              {type === 'number' ? (
                <CurrencyInput
                  value={form[key as string] ?? ''}
                  onChange={(raw) => setForm((f) => ({ ...f, [key as string]: raw }))}
                />
              ) : type === 'integer' ? (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form[key as string] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.value }))}
                  className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full"
                />
              ) : type === 'checkbox' ? (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, [key as string]: f[key as string] === 'true' ? 'false' : 'true' }))}
                  className={`h-10 w-20 rounded-xl border text-xs font-semibold transition-colors ${
                    form[key as string] === 'true'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-gray-50 border-brand-border text-foreground/50'
                  }`}
                >
                  {form[key as string] === 'true' ? 'Enabled' : 'Disabled'}
                </button>
              ) : (
                <input
                  type="text"
                  value={form[key as string] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.value }))}
                  className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pb-0.5">
            <button onClick={handleSubmit} className="flex items-center gap-1 text-xs bg-accent text-primary px-3 py-1.5 rounded-lg font-medium">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={resetForm} className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-lg">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-foreground/50">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-foreground/50">No {title.toLowerCase()} configured yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-foreground/60 uppercase">
            <tr>
              {columns.map(({ key, label }) => (
                <th key={key as string} className="px-4 py-2.5 text-left font-medium">{label}</th>
              ))}
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50/50">
                {columns.map(({ key, type }) => {
                  const val = (item as any)[key];
                  return (
                    <td key={key as string} className="px-4 py-3">
                      {val == null ? '—' : type === 'number' ? fmtNumber(val) : type === 'integer' ? String(val) : type === 'checkbox' ? (val ? 'Enabled' : 'Disabled') : String(val)}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  {confirmDeleteId === item._id ? (
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-xs text-foreground/50">Delete?</span>
                      <button
                        onClick={() => { onDelete(item._id); setConfirmDeleteId(null); }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >Yes</button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-brand-border hover:bg-gray-50 transition-colors"
                      >No</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-foreground/60 hover:text-primary transition-colors">
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
