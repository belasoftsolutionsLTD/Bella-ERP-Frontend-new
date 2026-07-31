'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Phone, Mail, User } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

interface Props {
  items: Branch[];
  refetch: () => void;
}

const EMPTY: Omit<Branch, '_id'> = { name: '', address: '', phone: '', email: '', contactPerson: '' };

export function BranchesPanel({ items, refetch }: Props) {
  const [editing, setEditing] = useState<Branch | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm({ ...EMPTY }); setEditing(null); setIsNew(true); };
  const openEdit = (item: Branch) => {
    setForm({
      name: item.name, address: item.address || '', phone: item.phone || '',
      email: item.email || '', contactPerson: item.contactPerson || '',
    });
    setEditing(item); setIsNew(true);
  };
  const closeForm = () => { setIsNew(false); setEditing(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = editing ? `${API_BASE_URL}/config/branches/${editing._id}` : `${API_BASE_URL}/config/branches`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { refetch(); closeForm(); },
      finallyFn: () => setSaving(false),
    });
  };

  const handleDelete = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/config/branches/${id}`,
      method: 'DELETE',
      thenFn: () => refetch(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Branches</h3>
          <p className="text-xs text-foreground/50 mt-0.5">Physical offices/locations the company operates from — assign employees to one when they're added.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Branch
        </button>
      </div>

      {isNew && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{editing ? 'Edit Branch' : 'New Branch'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Branch Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nairobi HQ, Mombasa Branch"
                className="h-9 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Contact Person</label>
              <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                placeholder="e.g. Branch Manager name"
                className="h-9 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +254 700 000000"
                className="h-9 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="e.g. branch@company.com"
                className="h-9 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-foreground/60">Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="e.g. Westlands, Nairobi"
                className="h-9 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={closeForm} className="text-xs text-foreground/40 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !isNew ? (
        <div className="rounded-xl border border-dashed border-brand-border py-10 text-center text-sm text-foreground/40">
          No branches added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item._id} className="flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:border-primary/20 transition-colors">
              <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground/40 mt-0.5">
                  {item.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</span>}
                  {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                  {item.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>}
                  {item.contactPerson && <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.contactPerson}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg text-foreground/30 hover:text-danger hover:bg-danger/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
