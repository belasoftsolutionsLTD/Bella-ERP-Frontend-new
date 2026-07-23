'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Users, Trash2, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Scheme {
  _id: string;
  name: string;
  description: string;
  contributionAmount: number;
  contributionType: 'fixed' | 'percentage';
  isActive: boolean;
  memberCount: number;
}

interface Member {
  compensationId: string;
  employeeId: string;
  employee: { fullName: string; staffNumber: string; department: string } | null;
  amount: number;
  effectiveFrom: string;
}

const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

// ── New Scheme Modal ──────────────────────────────────────────────────────────

function NewSchemeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionType, setContributionType] = useState<'fixed' | 'percentage'>('fixed');
  const [contributionAmount, setContributionAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim() && Number(contributionAmount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">New Welfare Scheme</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Scheme Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Staff Welfare Fund"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Contribution Type</label>
            <select value={contributionType} onChange={e => setContributionType(e.target.value as any)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="fixed">Fixed amount per member</option>
              <option value="percentage">Percentage of gross salary</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              {contributionType === 'fixed' ? 'Contribution Amount (KES)' : 'Contribution Rate (%)'}
            </label>
            <input type="number" min={0} value={contributionAmount} onChange={e => setContributionAmount(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            <p className="text-[11px] text-brand-text-muted mt-1">
              {contributionType === 'fixed'
                ? 'Default deducted from each member every payroll cycle — can be overridden per member.'
                : 'Applied uniformly to every member\'s gross salary every payroll cycle.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button
            onClick={() => {
              setSaving(true);
              apiCallFunction({
                url: `${API_BASE_URL}/welfare/schemes`, method: 'POST',
                data: { name, description, contributionType, contributionAmount: Number(contributionAmount) },
                thenFn: () => { onCreated(); onClose(); },
                finallyFn: () => setSaving(false),
              });
            }}
            disabled={saving || !canSubmit}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Scheme'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scheme Detail Modal (members) ────────────────────────────────────────────

function SchemeDetailModal({ scheme, onClose, onChanged }: { scheme: Scheme; onClose: () => void; onChanged: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<{ _id: string; fullName: string }[]>([]);
  const [employeePick, setEmployeePick] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchDetail = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/welfare/schemes/${scheme._id}`, showToast: false,
      thenFn: r => setMembers(r.data?.members ?? []), finallyFn: () => setLoading(false) });
  }, [scheme._id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees?limit=500`, showToast: false,
      thenFn: r => setEmployees(r.data?.data ?? r.data ?? []) });
  }, []);

  const memberIds = new Set(members.map(m => m.employeeId));
  const availableEmployees = employees.filter(e => !memberIds.has(e._id));

  const addMember = () => {
    if (!employeePick) return;
    setAdding(true);
    apiCallFunction({
      url: `${API_BASE_URL}/welfare/schemes/${scheme._id}/members`, method: 'POST',
      data: { employeeId: employeePick },
      thenFn: () => { setEmployeePick(''); fetchDetail(); onChanged(); },
      finallyFn: () => setAdding(false),
    });
  };

  const removeMember = (employeeId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/welfare/schemes/${scheme._id}/members/${employeeId}`, method: 'DELETE',
      thenFn: () => { fetchDetail(); onChanged(); },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <p className="text-base font-bold text-brand-text">{scheme.name}</p>
            <p className="text-xs text-brand-text-muted">
              {scheme.contributionType === 'fixed' ? fmt(scheme.contributionAmount) : `${scheme.contributionAmount}%`} per member · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 py-4 border-b border-brand-border shrink-0 flex gap-2">
          <select value={employeePick} onChange={e => setEmployeePick(e.target.value)}
            className="flex-1 h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
            <option value="">Add an employee…</option>
            {availableEmployees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
          </select>
          <button onClick={addMember} disabled={!employeePick || adding}
            className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-brand-text-muted text-center py-8">Loading members…</p>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-brand-text-secondary mx-auto mb-2" />
              <p className="text-sm text-brand-text-muted">No members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.compensationId} className="flex items-center justify-between px-4 py-2.5 bg-brand-bg-soft border border-brand-border/60 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{m.employee?.fullName ?? 'Unknown'}</p>
                    <p className="text-xs text-brand-text-muted">{m.employee?.department} · {m.employee?.staffNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-brand-text-secondary">
                      {scheme.contributionType === 'fixed' ? fmt(m.amount) : `${scheme.contributionAmount}%`}
                    </span>
                    <button onClick={() => removeMember(m.employeeId)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WelfareSchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [detailScheme, setDetailScheme] = useState<Scheme | null>(null);

  const fetchSchemes = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/welfare/schemes`, showToast: false,
      thenFn: r => setSchemes(r.data ?? []), finallyFn: () => setLoading(false) });
  }, []);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  const toggleActive = (scheme: Scheme) => {
    apiCallFunction({
      url: `${API_BASE_URL}/welfare/schemes/${scheme._id}`, method: 'PATCH',
      data: { isActive: !scheme.isActive },
      thenFn: () => fetchSchemes(),
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-brand-text tracking-tight">Welfare Schemes</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Staff welfare funds with real payroll-deducted contributions</p>
          </div>
          <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors">
            <Plus className="h-4 w-4" /> New Scheme
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
        ) : schemes.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <HeartHandshake className="h-10 w-10 text-brand-text-secondary mx-auto" />
            <p className="text-brand-text-secondary font-semibold">No welfare schemes yet</p>
            <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors"><Plus className="h-4 w-4" /> Create First Scheme</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {schemes.map(s => (
              <div key={s._id} className={cn('bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5 cursor-pointer hover:border-brand-border-strong transition-colors', !s.isActive && 'opacity-60')}
                onClick={() => setDetailScheme(s)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-brand-text">{s.name}</h3>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {s.description && <p className="text-xs text-brand-text-secondary mb-3 line-clamp-2">{s.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-text">
                    {s.contributionType === 'fixed' ? fmt(s.contributionAmount) : `${s.contributionAmount}%`}
                  </span>
                  <span className="flex items-center gap-1 text-brand-text-muted text-xs">
                    <Users className="h-3.5 w-3.5" /> {s.memberCount} member{s.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleActive(s); }}
                  className="mt-3 text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                >
                  {s.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {newOpen && <NewSchemeModal onClose={() => setNewOpen(false)} onCreated={fetchSchemes} />}
      {detailScheme && (
        <SchemeDetailModal
          scheme={detailScheme}
          onClose={() => setDetailScheme(null)}
          onChanged={fetchSchemes}
        />
      )}
    </div>
  );
}
