'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, Users, Percent } from 'lucide-react';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { fmtNumber } from '@/lib/utils';
import type { ConfigItem } from '@/hooks/useConfigSection';

interface Props {
  items: ConfigItem[];
  loading: boolean;
  jobGroups: ConfigItem[];
  onCreate: (data: Record<string, unknown>) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  name: string;
  type: 'fixed' | 'percentage';
  amount: string;
  percentage: string;
  description: string;
  jobGroupIds: string[];
}
const emptyForm = (): FormState => ({ name: '', type: 'fixed', amount: '', percentage: '', description: '', jobGroupIds: [] });

export function DeductionsPanel({ items, loading, jobGroups, onCreate, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); };

  const toggleGroup = (id: string) =>
    setForm(f => ({
      ...f,
      jobGroupIds: f.jobGroupIds.includes(id) ? f.jobGroupIds.filter(x => x !== id) : [...f.jobGroupIds, id],
    }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      jobGroupIds: form.jobGroupIds,
    };
    if (form.type === 'fixed') data.amount = form.amount ? Number(form.amount) : null;
    else data.percentage = form.percentage ? Number(form.percentage) : null;
    editId ? onUpdate(editId, data) : onCreate(data);
    resetForm();
  };

  const startEdit = (item: ConfigItem) => {
    setForm({
      name: item.name,
      type: item.type === 'percentage' ? 'percentage' : 'fixed',
      amount: String(item.amount ?? ''),
      percentage: String(item.percentage ?? ''),
      description: item.description ?? '',
      jobGroupIds: item.jobGroupIds ?? [],
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const groupName = (id: string) => jobGroups.find(g => g._id === id)?.name ?? id;

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">Deductions</h3>
          <p className="text-xs text-foreground/50 mt-0.5">Assign to specific job groups, or leave blank to apply to all employees</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-xs text-foreground/60">Deduction Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. SACCO Contribution"
                className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Type</label>
              <div className="flex rounded-xl border border-brand-border overflow-hidden h-10">
                {(['fixed', 'percentage'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`px-4 text-xs font-medium transition-colors ${
                      form.type === t ? 'bg-primary text-white' : 'bg-white text-foreground/60 hover:bg-gray-50'
                    }`}>
                    {t === 'fixed' ? 'Fixed (KES)' : 'Percentage (%)'}
                  </button>
                ))}
              </div>
            </div>

            {form.type === 'fixed' ? (
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-xs text-foreground/60">Amount (KES)</label>
                <CurrencyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} />
              </div>
            ) : (
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-xs text-foreground/60 flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Percentage
                </label>
                <input type="number" step="0.1" min="0" max="100" value={form.percentage}
                  onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))}
                  placeholder="e.g. 5"
                  className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
            )}

            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs text-foreground/60">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/60 flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5" /> Applies to Job Groups
              <span className="text-foreground/30 font-normal">(leave blank = all employees)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {jobGroups.length === 0
                ? <p className="text-xs text-foreground/40 italic">No job groups configured yet.</p>
                : jobGroups.map(g => {
                    const selected = form.jobGroupIds.includes(g._id);
                    return (
                      <button key={g._id} type="button" onClick={() => toggleGroup(g._id)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'border-brand-border text-foreground/60 hover:border-primary/40 hover:bg-primary/5'
                        }`}>
                        {g.name}
                        {g.salaryMin != null && g.salaryMax != null && (
                          <span className="ml-1.5 opacity-60">
                            {`${(g.salaryMin / 1000).toFixed(0)}k–${(g.salaryMax / 1000).toFixed(0)}k`}
                          </span>
                        )}
                      </button>
                    );
                  })
              }
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmit}
              className="flex items-center gap-1 text-xs bg-accent text-primary px-3 py-1.5 rounded-lg font-medium">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={resetForm}
              className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-lg">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-foreground/50">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-foreground/50">No deductions configured yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-foreground/60 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Deduction Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Type / Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Job Groups</th>
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => {
              const groupIds = item.jobGroupIds ?? [];
              return (
                <tr key={item._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    {item.type === 'percentage'
                      ? <span className="text-purple-700 font-medium">{item.percentage}%</span>
                      : <span>KES {item.amount != null ? fmtNumber(item.amount) : '—'}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {groupIds.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {groupIds.map(id => (
                            <span key={id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {groupName(id)}
                            </span>
                          ))}
                        </div>
                      : <span className="text-xs text-foreground/40 italic">All employees</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-foreground/50">{item.description || '—'}</td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === item._id ? (
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-xs text-foreground/50">Delete?</span>
                        <button onClick={() => { onDelete(item._id); setConfirmDeleteId(null); }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-brand-border hover:bg-gray-50">No</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(item)}
                          className="p-1.5 rounded hover:bg-gray-100 text-foreground/60 hover:text-primary transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(item._id)}
                          className="p-1.5 rounded hover:bg-red-50 text-foreground/60 hover:text-red-600 transition-colors">
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
