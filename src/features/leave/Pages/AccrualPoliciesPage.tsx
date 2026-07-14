'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, X, Play, RotateCcw } from 'lucide-react';
import { useAccrualPolicies } from '../Hooks/useAccrualPolicies';
import { useLeaveTypes } from '../Hooks/useLeaveTypes';
import type { LeaveAccrualPolicy } from '../types';

const DEPARTMENTS = [
  'Administration', 'Human Resources', 'Finance & Accounts', 'Information Technology',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance',
  'Procurement', 'Logistics & Supply Chain', 'Research & Development', 'Communications',
  'Health & Safety', 'Facilities Management', 'Executive',
];

function PolicyFormModal({ initial, onClose, onSave }: { initial?: LeaveAccrualPolicy; onClose: () => void; onSave: (data: any) => void }) {
  const { leaveTypes } = useLeaveTypes();
  const [form, setForm] = useState({
    name: initial?.name ?? '', leaveTypeId: initial?.leaveTypeId ?? '',
    accrualFrequency: initial?.accrualFrequency ?? 'monthly',
    accrualAmount: initial?.accrualAmount ?? '', maxAnnualEntitlement: initial?.maxAnnualEntitlement ?? '',
    targetDepartments: initial?.appliesTo?.departments ?? [] as string[],
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleDept = (d: string) => setForm(f => ({ ...f, targetDepartments: f.targetDepartments.includes(d) ? f.targetDepartments.filter(x => x !== d) : [...f.targetDepartments, d] }));

  const handleSave = () => onSave({
    name: form.name, leaveTypeId: form.leaveTypeId, accrualFrequency: form.accrualFrequency,
    accrualAmount: Number(form.accrualAmount), maxAnnualEntitlement: Number(form.maxAnnualEntitlement),
    appliesTo: { departments: form.targetDepartments },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">{initial ? 'Edit Policy' : 'New Accrual Policy'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Policy Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Annual Accrual"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Leave Type <span className="text-red-400">*</span></label>
            <select value={form.leaveTypeId} onChange={e => set('leaveTypeId', e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none">
              <option value="">Select…</option>
              {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Frequency</label>
              <select value={form.accrualFrequency} onChange={e => set('accrualFrequency', e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="perHourWorked">Per Hour Worked</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Amount / Frequency</label>
              <input type="number" step="0.1" value={form.accrualAmount} onChange={e => set('accrualAmount', e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Max Annual Entitlement (days)</label>
            <input type="number" value={form.maxAnnualEntitlement} onChange={e => set('maxAnnualEntitlement', e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applies To Departments <span className="text-brand-text-muted normal-case">(leave empty for all)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map(d => (
                <button key={d} type="button" onClick={() => toggleDept(d)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${form.targetDepartments.includes(d) ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || !form.leaveTypeId || !form.accrualAmount || !form.maxAnnualEntitlement}
            className="h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {initial ? 'Save Changes' : 'Create Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccrualPoliciesPage() {
  const locale = useLocale();
  const { policies, loading, create, update, remove, runNow, runYearEndCarryForward } = useAccrualPolicies();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveAccrualPolicy | null>(null);
  const [running, setRunning] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Leave
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Accrual Policies</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Configure how leave days accrue over time</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setRunning(true); runNow((msg) => { toast.success(msg); setRunning(false); }); }} disabled={running}
            className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Play className="h-4 w-4" /> Run Accruals Now
          </button>
          <button onClick={() => { if (window.confirm('Run year-end carry-forward now?')) runYearEndCarryForward((msg) => toast.success(msg)); }}
            className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <RotateCcw className="h-4 w-4" /> Run Carry-Forward
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> New Policy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : policies.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No accrual policies configured yet.</p>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 140px 120px 140px 90px' }}>
            {['Policy', 'Leave Type', 'Frequency', 'Amount / Max', ''].map(h => (
              <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {policies.map(p => (
            <div key={p._id} style={{ gridTemplateColumns: '1fr 140px 120px 140px 90px' }} className="grid border-b border-brand-border/60 last:border-0 items-center hover:bg-brand-bg-soft/30 transition-colors">
              <div className="px-4 py-3 text-sm font-medium text-brand-text">{p.name}</div>
              <div className="px-4 py-3 text-xs text-brand-text-secondary">{p.leaveType?.name ?? '—'}</div>
              <div className="px-4 py-3 text-xs text-brand-text-secondary capitalize">{p.accrualFrequency.replace(/([A-Z])/g, ' $1')}</div>
              <div className="px-4 py-3 text-xs text-brand-text-secondary">{p.accrualAmount}d / {p.maxAnnualEntitlement}d max</div>
              <div className="px-4 py-3 flex items-center gap-2">
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-indigo-400 hover:text-indigo-300 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) remove(p._id, () => toast.success('Deleted.')); }} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PolicyFormModal
          initial={editing ?? undefined}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) update(editing._id, data, () => { toast.success('Updated.'); setShowForm(false); });
            else create(data, () => { toast.success('Created.'); setShowForm(false); });
          }}
        />
      )}
    </div>
  );
}
