'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Archive, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveTypes } from '../Hooks/useLeaveTypes';
import type { LeaveType } from '../types';

const DEPARTMENTS = [
  'Administration', 'Human Resources', 'Finance & Accounts', 'Information Technology',
  'Operations', 'Sales & Marketing', 'Customer Service', 'Legal & Compliance',
  'Procurement', 'Logistics & Supply Chain', 'Research & Development', 'Communications',
  'Health & Safety', 'Facilities Management', 'Executive',
];
const EMPLOYMENT_TYPES = ['permanent', 'contract', 'part-time', 'intern'];
const COLOR_SWATCHES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function TypeFormModal({ initial, onClose, onSave }: { initial?: LeaveType; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '', code: initial?.code ?? '', description: initial?.description ?? '',
    isPaid: initial?.isPaid ?? true, isCarryOverAllowed: initial?.isCarryOverAllowed ?? false,
    maxCarryOverDays: initial?.maxCarryOverDays ?? '', carryOverExpiryMonths: initial?.carryOverExpiryMonths ?? '',
    requiresApproval: initial?.requiresApproval ?? true, requiresAttachment: initial?.requiresAttachment ?? false,
    minNoticeDays: initial?.minNoticeDays ?? '', maxConsecutiveDays: initial?.maxConsecutiveDays ?? '',
    eligibilityMonths: initial?.eligibilityMonths ?? '', countPublicHolidays: initial?.countPublicHolidays ?? false,
    color: initial?.color ?? COLOR_SWATCHES[0],
    targetDepartments: initial?.appliesTo?.departments ?? [] as string[],
    targetEmploymentTypes: initial?.appliesTo?.employmentTypes ?? [] as string[],
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k: 'targetDepartments' | 'targetEmploymentTypes', val: string) =>
    setForm(f => ({ ...f, [k]: f[k].includes(val) ? f[k].filter(x => x !== val) : [...f[k], val] }));

  const handleSave = () => {
    onSave({
      name: form.name, code: form.code, description: form.description,
      isPaid: form.isPaid, isCarryOverAllowed: form.isCarryOverAllowed,
      maxCarryOverDays: form.maxCarryOverDays === '' ? undefined : Number(form.maxCarryOverDays),
      carryOverExpiryMonths: form.carryOverExpiryMonths === '' ? undefined : Number(form.carryOverExpiryMonths),
      requiresApproval: form.requiresApproval, requiresAttachment: form.requiresAttachment,
      minNoticeDays: form.minNoticeDays === '' ? undefined : Number(form.minNoticeDays),
      maxConsecutiveDays: form.maxConsecutiveDays === '' ? undefined : Number(form.maxConsecutiveDays),
      eligibilityMonths: form.eligibilityMonths === '' ? undefined : Number(form.eligibilityMonths),
      countPublicHolidays: form.countPublicHolidays, color: form.color,
      appliesTo: { departments: form.targetDepartments, employmentTypes: form.targetEmploymentTypes },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">{initial ? 'Edit Leave Type' : 'New Leave Type'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Annual Leave"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Code <span className="text-red-400">*</span></label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="AL" maxLength={6}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Color</label>
            <div className="flex gap-1.5">
              {COLOR_SWATCHES.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={cn('h-7 w-7 rounded-full border-2 transition-transform', form.color === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary"><input type="checkbox" checked={form.isPaid} onChange={e => set('isPaid', e.target.checked)} className="accent-brand-primary" /> Paid Leave</label>
            <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary"><input type="checkbox" checked={form.requiresApproval} onChange={e => set('requiresApproval', e.target.checked)} className="accent-brand-primary" /> Requires Approval</label>
            <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary"><input type="checkbox" checked={form.requiresAttachment} onChange={e => set('requiresAttachment', e.target.checked)} className="accent-brand-primary" /> Requires Attachment</label>
            <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary"><input type="checkbox" checked={form.countPublicHolidays} onChange={e => set('countPublicHolidays', e.target.checked)} className="accent-brand-primary" /> Count Public Holidays</label>
            <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary"><input type="checkbox" checked={form.isCarryOverAllowed} onChange={e => set('isCarryOverAllowed', e.target.checked)} className="accent-brand-primary" /> Allow Carry-Over</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Min Notice (days)</label>
              <input type="number" value={form.minNoticeDays} onChange={e => set('minNoticeDays', e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Max Consecutive Days</label>
              <input type="number" value={form.maxConsecutiveDays} onChange={e => set('maxConsecutiveDays', e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Eligibility (months worked)</label>
              <input type="number" value={form.eligibilityMonths} onChange={e => set('eligibilityMonths', e.target.value)}
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
            </div>
            {form.isCarryOverAllowed && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Max Carry-Over Days</label>
                  <input type="number" value={form.maxCarryOverDays} onChange={e => set('maxCarryOverDays', e.target.value)}
                    className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Carry-Over Expiry (months)</label>
                  <input type="number" value={form.carryOverExpiryMonths} onChange={e => set('carryOverExpiryMonths', e.target.value)}
                    className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applies To Departments <span className="text-brand-text-muted normal-case">(leave empty for all)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map(d => (
                <button key={d} type="button" onClick={() => toggle('targetDepartments', d)}
                  className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', form.targetDepartments.includes(d) ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applies To Employment Types <span className="text-brand-text-muted normal-case">(leave empty for all)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYMENT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => toggle('targetEmploymentTypes', t)}
                  className={cn('text-[11px] px-2.5 py-1 rounded-full border capitalize transition-colors', form.targetEmploymentTypes.includes(t) ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-text-secondary')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || !form.code.trim()}
            className="h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {initial ? 'Save Changes' : 'Create Type'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveTypesPage() {
  const locale = useLocale();
  const { leaveTypes, loading, create, update, remove } = useLeaveTypes();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Leave
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Leave Types</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Configure the leave types employees can request</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Type
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveTypes.map(t => (
            <div key={t._id} className={cn('bg-brand-bg-soft border rounded-2xl p-5 flex flex-col gap-3', t.isActive ? 'border-brand-border/60' : 'border-brand-border opacity-50')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <h3 className="text-sm font-bold text-brand-text">{t.name}</h3>
                </div>
                <span className="text-[10px] font-mono text-brand-text-muted">{t.code}</span>
              </div>
              <p className="text-xs text-brand-text-secondary line-clamp-2">{t.description || 'No description'}</p>
              <div className="flex flex-wrap gap-1">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full', t.isPaid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-bg-muted text-brand-text-secondary')}>{t.isPaid ? 'Paid' : 'Unpaid'}</span>
                {t.requiresApproval && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Needs Approval</span>}
                {t.requiresAttachment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">Attachment Req.</span>}
                {t.isCarryOverAllowed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">Carry-Over</span>}
                {!t.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Archived</span>}
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-brand-border/60">
                <button onClick={() => { setEditing(t); setShowForm(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {t.isActive ? (
                  <button onClick={() => { if (window.confirm(`Archive "${t.name}"?`)) remove(t._id, () => toast.success('Archived.')); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors ml-auto">
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                ) : (
                  <button onClick={() => update(t._id, { isActive: true }, () => toast.success('Reactivated.'))}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors ml-auto">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TypeFormModal
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
