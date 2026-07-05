'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Star, Edit2, Trash2, Copy, X, ChevronDown, ChevronUp, Ban, Play, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveColor, LEAVE_TYPE_LABELS } from '../constants';
import type { LeavePolicy, PolicyLeaveType } from '../constants';

// ── Create/Edit policy drawer ─────────────────────────────────────────────────

const ACCRUAL_TYPES   = [{ v: 'upfront', l: 'Upfront (all days Jan 1)' }, { v: 'monthly', l: 'Monthly accrual' }, { v: 'per_pay_period', l: 'Per pay period' }];
const CARRYOVER_TYPES = [{ v: 'none', l: 'No carryover' }, { v: 'limited', l: 'Limited carryover' }, { v: 'unlimited', l: 'Unlimited carryover' }];
const PALETTE = ['#6366f1','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];

function emptyType(): PolicyLeaveType {
  return { name: '', color: '#6366f1', totalDays: 21, accrualType: 'upfront', carryoverType: 'none', requiresApproval: true };
}

interface DrawerProps { policy?: LeavePolicy; onClose: () => void; onSaved: () => void }

function PolicyDrawer({ policy, onClose, onSaved }: DrawerProps) {
  const [name,         setName]         = useState(policy?.name ?? '');
  const [description,  setDescription]  = useState(policy?.description ?? '');
  const [isDefault,    setIsDefault]    = useState(policy?.isDefault ?? false);
  const [leaveTypes,   setLeaveTypes]   = useState<PolicyLeaveType[]>(policy?.leaveTypes ?? [emptyType()]);
  const [approverType, setApproverType] = useState(policy?.approvalChain?.approverType ?? 'manager');
  const [escalateDays, setEscalateDays] = useState(policy?.approvalChain?.escalateAfterDays ?? 3);
  const [assignType,   setAssignType]   = useState(policy?.assignedTo?.type ?? 'all');
  const [saving,       setSaving]       = useState(false);
  const [expanded,     setExpanded]     = useState<Record<number, boolean>>({ 0: true });

  const addType    = () => { setLeaveTypes(p => [...p, emptyType()]); setExpanded(e => ({ ...e, [leaveTypes.length]: true })); };
  const removeType = (i: number) => setLeaveTypes(p => p.filter((_, idx) => idx !== i));
  const updType    = <K extends keyof PolicyLeaveType>(i: number, k: K, v: PolicyLeaveType[K]) =>
    setLeaveTypes(p => p.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const handleSave = () => {
    if (!name.trim()) return;
    setSaving(true);
    const url    = policy?._id ? `${API_BASE_URL}/leave/policies/${policy._id}` : `${API_BASE_URL}/leave/policies`;
    const method = policy?._id ? 'PUT' : 'POST';
    apiCallFunction({
      url, method,
      data: { name, description, isDefault, leaveTypes,
              approvalChain: { approverType, escalateAfterDays: escalateDays },
              assignedTo: { type: assignType } },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[92vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-bold text-slate-100">{policy?._id ? 'Edit Policy' : 'Create Leave Policy'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          <PolicySection label="Policy Details">
            <FormField label="Policy Name *">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Kenya Policy"
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </FormField>
            <FormField label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
            </FormField>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Set as default policy</p>
                <p className="text-xs text-slate-500">Applied to all employees without an explicit assignment</p>
              </div>
              <button type="button" onClick={() => setIsDefault(v => !v)}
                className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', isDefault ? 'bg-indigo-500' : 'bg-slate-700')}>
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', isDefault ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </div>
          </PolicySection>

          <PolicySection label="Leave Types">
            <div className="space-y-3">
              {leaveTypes.map((lt, i) => (
                <div key={i} className="border border-slate-700 rounded-xl overflow-hidden">
                  <button type="button"
                    onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lt.color || '#6366f1' }} />
                    <span className="text-sm font-semibold text-slate-200 flex-1 truncate">{lt.name || 'New Leave Type'}</span>
                    <span className="text-xs text-slate-500">{lt.totalDays} days/yr</span>
                    {expanded[i] ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>

                  {expanded[i] && (
                    <div className="px-4 py-4 space-y-3 bg-slate-900">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <FormField label="Leave Type Name *">
                            <input value={lt.name} onChange={e => updType(i, 'name', e.target.value)} placeholder="e.g. Annual Leave"
                              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                          </FormField>
                        </div>
                        <FormField label="Days/Year">
                          <input type="number" value={lt.totalDays} min={0} max={365}
                            onChange={e => updType(i, 'totalDays', Number(e.target.value))}
                            className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                        </FormField>
                      </div>

                      <FormField label="Color">
                        <div className="flex gap-2 flex-wrap">
                          {PALETTE.map(c => (
                            <button key={c} type="button" onClick={() => updType(i, 'color', c)}
                              className={cn('h-6 w-6 rounded-full border-2 transition-all', lt.color === c ? 'border-white scale-110' : 'border-transparent')}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </FormField>

                      <FormField label="Accrual">
                        <div className="space-y-1.5">
                          {ACCRUAL_TYPES.map(a => (
                            <label key={a.v} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`accrual-${i}`} value={a.v} checked={lt.accrualType === a.v}
                                onChange={() => updType(i, 'accrualType', a.v as PolicyLeaveType['accrualType'])}
                                className="accent-indigo-500" />
                              <span className="text-xs text-slate-300">{a.l}</span>
                            </label>
                          ))}
                        </div>
                      </FormField>

                      <FormField label="Carryover">
                        <div className="space-y-1.5">
                          {CARRYOVER_TYPES.map(c => (
                            <label key={c.v} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`carry-${i}`} value={c.v} checked={lt.carryoverType === c.v}
                                onChange={() => updType(i, 'carryoverType', c.v as PolicyLeaveType['carryoverType'])}
                                className="accent-indigo-500" />
                              <span className="text-xs text-slate-300">{c.l}</span>
                            </label>
                          ))}
                        </div>
                        {lt.carryoverType === 'limited' && (
                          <div className="mt-2 flex items-center gap-2">
                            <input type="number" value={lt.carryoverMax ?? 5} min={0}
                              onChange={e => updType(i, 'carryoverMax', Number(e.target.value))}
                              className="w-16 h-8 bg-slate-800 border border-slate-700 rounded px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                            <span className="text-xs text-slate-400">max days</span>
                          </div>
                        )}
                      </FormField>

                      <div className="grid grid-cols-2 gap-3">
                        <MiniToggle label="Requires approval" on={lt.requiresApproval} onToggle={() => updType(i, 'requiresApproval', !lt.requiresApproval)} />
                        <MiniToggle label="Can go negative" on={!!lt.canGoNegative} onToggle={() => updType(i, 'canGoNegative', !lt.canGoNegative)} />
                      </div>

                      <FormField label="Minimum notice (days)">
                        <div className="flex items-center gap-2">
                          <input type="number" value={lt.minNoticeDays ?? 0} min={0} max={90}
                            onChange={e => updType(i, 'minNoticeDays', Number(e.target.value))}
                            className="w-20 h-8 bg-slate-800 border border-slate-700 rounded px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                          <span className="text-xs text-slate-500">days before start date</span>
                        </div>
                      </FormField>

                      {leaveTypes.length > 1 && (
                        <button type="button" onClick={() => removeType(i)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                          <Trash2 className="h-3 w-3" /> Remove this leave type
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addType}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-600 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors">
                <Plus className="h-4 w-4" /> Add Leave Type
              </button>
            </div>
          </PolicySection>

          <PolicySection label="Approval Chain">
            <FormField label="Approver type">
              <div className="space-y-2">
                {[{ v: 'manager', l: 'Direct Manager' }, { v: 'hr_team', l: 'HR Team' }, { v: 'specific', l: 'Specific Person' }].map(opt => (
                  <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="approver-type" value={opt.v} checked={approverType === opt.v}
                      onChange={() => setApproverType(opt.v as 'manager' | 'specific' | 'hr_team')}
                      className="accent-indigo-500" />
                    <span className="text-xs text-slate-300">{opt.l}</span>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="Escalate after (days)">
              <input type="number" value={escalateDays} min={1} max={30}
                onChange={e => setEscalateDays(Number(e.target.value))}
                className="w-24 h-9 bg-slate-800 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </FormField>
          </PolicySection>

          <PolicySection label="Assign Employees">
            {[{ v: 'all', l: 'All employees (default)' }, { v: 'departments', l: 'Specific departments' }, { v: 'employees', l: 'Specific employees' }].map(opt => (
              <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="assign-type" value={opt.v} checked={assignType === opt.v}
                  onChange={() => setAssignType(opt.v as 'all' | 'departments' | 'employees')}
                  className="accent-indigo-500" />
                <span className="text-sm text-slate-300">{opt.l}</span>
              </label>
            ))}
          </PolicySection>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : policy?._id ? 'Save Changes' : 'Create Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Blackout Periods ──────────────────────────────────────────────────────────

interface Blackout { _id: string; name: string; startDate: string; endDate: string; leaveTypes: string[]; reason?: string }

const ALL_LEAVE_TYPES = Object.entries(LEAVE_TYPE_LABELS).map(([v, l]) => ({ v, l }));

function BlackoutsSection() {
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', reason: '', leaveTypes: [] as string[] });

  const year = new Date().getFullYear();

  const fetchBlackouts = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/blackouts?year=${year}`,
      showToast: false,
      thenFn: r => setBlackouts(Array.isArray(r.data) ? r.data : []),
      finallyFn: () => setLoading(false),
    });
  }, [year]);

  useEffect(() => { fetchBlackouts(); }, [fetchBlackouts]);

  const toggleType = (v: string) =>
    setForm(f => ({ ...f, leaveTypes: f.leaveTypes.includes(v) ? f.leaveTypes.filter(t => t !== v) : [...f.leaveTypes, v] }));

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/blackouts`,
      method: 'POST',
      data: form,
      thenFn: () => { fetchBlackouts(); setShowForm(false); setForm({ name: '', startDate: '', endDate: '', reason: '', leaveTypes: [] }); },
      finallyFn: () => setSaving(false),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this blackout period?')) return;
    apiCallFunction({ url: `${API_BASE_URL}/leave/blackouts/${id}`, method: 'DELETE', thenFn: fetchBlackouts });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" /> Blackout Periods
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Date ranges when leave requests are blocked (e.g. peak season, year-end close)</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Add Blackout
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Year-End Freeze"
                className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">End Date *</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-1">Reason (optional)</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Quarter-end"
                className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 uppercase tracking-wide mb-2">
              Affected Leave Types <span className="text-slate-600 normal-case font-normal">(leave empty to block all types)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_LEAVE_TYPES.map(({ v, l }) => {
                const on = form.leaveTypes.includes(v);
                return (
                  <button key={v} type="button" onClick={() => toggleType(v)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      on ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500')}>
                    {l}
                  </button>
                );
              })}
            </div>
            {form.leaveTypes.length === 0 && (
              <p className="text-[11px] text-amber-400 mt-1.5">All leave types will be blocked during this period.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || !form.name || !form.startDate || !form.endDate}
              className="flex items-center gap-1.5 h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
              <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Blackout'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="h-8 px-3 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : blackouts.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No blackout periods set for {year}.</p>
      ) : (
        <div className="space-y-2">
          {blackouts.map(b => (
            <div key={b._id} className="flex items-center justify-between gap-4 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.startDate} – {b.endDate}{b.reason ? ` · ${b.reason}` : ''}</p>
                  {b.leaveTypes.length > 0 ? (
                    <p className="text-[11px] text-slate-600 mt-0.5">{b.leaveTypes.map(t => LEAVE_TYPE_LABELS[t] ?? t).join(', ')}</p>
                  ) : (
                    <p className="text-[11px] text-red-400/70 mt-0.5">All leave types blocked</p>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(b._id)} className="text-red-400 hover:text-red-300 transition-colors shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Accrual Controls & Min Notice ─────────────────────────────────────────────

const NOTICE_LEAVE_TYPES = Object.entries(LEAVE_TYPE_LABELS);

function AccrualControlsSection() {
  const [config,         setConfig]         = useState<Record<string, number>>({});
  const [loadingCfg,     setLoadingCfg]     = useState(true);
  const [savingCfg,      setSavingCfg]      = useState(false);
  const [runningAccrual, setRunningAccrual] = useState(false);
  const [runningCF,      setRunningCF]      = useState(false);
  const [cfYear,         setCfYear]         = useState(new Date().getFullYear() - 1);

  const fetchConfig = useCallback(() => {
    setLoadingCfg(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/config`,
      showToast: false,
      thenFn: r => setConfig(r.data?.minNoticeDays ?? {}),
      finallyFn: () => setLoadingCfg(false),
    });
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const setNotice = (type: string, val: number) => setConfig(c => ({ ...c, [type]: val }));

  const saveConfig = () => {
    setSavingCfg(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/config`,
      method: 'PATCH',
      data: { minNoticeDays: config },
      thenFn: fetchConfig,
      finallyFn: () => setSavingCfg(false),
    });
  };

  const runAccrual = () => {
    setRunningAccrual(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/accrual/run`,
      method: 'POST',
      data: {},
      finallyFn: () => setRunningAccrual(false),
    });
  };

  const runCarryForward = () => {
    if (!confirm(`Run year-end carry-forward from ${cfYear} → ${cfYear + 1}? This will add unused days to next year's balances.`)) return;
    setRunningCF(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/year-end/carry-forward`,
      method: 'POST',
      data: { year: cfYear },
      finallyFn: () => setRunningCF(false),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-indigo-400" /> Accrual & Year-End Controls
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure minimum notice periods and run automated leave tasks</p>
      </div>

      {/* Min notice settings */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">Minimum Notice Days (per leave type)</p>
          <p className="text-xs text-slate-500 mt-0.5">Staff must submit requests this many days before the start date. Set 0 to disable.</p>
        </div>
        {loadingCfg ? (
          <div className="flex justify-center py-4"><div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NOTICE_LEAVE_TYPES.map(([type, label]) => (
              <div key={type}>
                <label className="block text-[11px] text-slate-400 mb-1">{label}</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={0} max={90} value={config[type] ?? 0}
                    onChange={e => setNotice(type, Number(e.target.value))}
                    className="w-14 h-8 bg-slate-900 border border-slate-700 rounded px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                  <span className="text-xs text-slate-600">days</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={saveConfig} disabled={savingCfg || loadingCfg}
          className="flex items-center gap-1.5 h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
          <Save className="h-3.5 w-3.5" /> {savingCfg ? 'Saving…' : 'Save Notice Settings'}
        </button>
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" /> Monthly Accrual
          </p>
          <p className="text-xs text-slate-500">
            Run the monthly annual leave accrual now (1.75 days per employee). Safe to re-run — idempotent per calendar month.
          </p>
          <button onClick={runAccrual} disabled={runningAccrual}
            className="flex items-center gap-1.5 h-8 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {runningAccrual
              ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running…</>
              : <><Play className="h-3.5 w-3.5" /> Run Accrual</>}
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-violet-400" /> Year-End Carry-Forward
          </p>
          <p className="text-xs text-slate-500">
            Apply carry-forward rules from the default policy and credit unused days to the next year.
          </p>
          <div className="flex items-center gap-2">
            <select value={cfYear} onChange={e => setCfYear(Number(e.target.value))}
              className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
              {[0, 1, 2].map(n => {
                const y = new Date().getFullYear() - 1 - n;
                return <option key={y} value={y}>{y} → {y + 1}</option>;
              })}
            </select>
            <button onClick={runCarryForward} disabled={runningCF}
              className="flex items-center gap-1.5 h-8 px-4 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
              {runningCF
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running…</>
                : <><RefreshCw className="h-3.5 w-3.5" /> Run</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main policies tab ─────────────────────────────────────────────────────────

export function PoliciesTab() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState<{ policy?: LeavePolicy } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchPolicies = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/policies`,
      showToast: false,
      thenFn: r => setPolicies(Array.isArray(r.data) ? r.data : []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const setDefault = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/leave/policies/${id}/set-default`, method: 'POST', data: {}, thenFn: fetchPolicies });
    setMenuOpen(null);
  };

  const deletePolicy = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/leave/policies/${id}`, method: 'DELETE', thenFn: fetchPolicies });
    setMenuOpen(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Leave Policies</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure leave entitlements and rules</p>
        </div>
        <button onClick={() => setDrawer({})}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Create Policy
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : policies.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-slate-400 text-sm">No leave policies yet.</p>
          <button onClick={() => setDrawer({})}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            Create your first policy
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map(policy => (
            <div key={policy._id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-100 truncate">{policy.name}</h3>
                    {policy.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Star className="h-2.5 w-2.5" /> Default
                      </span>
                    )}
                  </div>
                  {policy.description && <p className="text-xs text-slate-500 mb-3">{policy.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {policy.leaveTypes?.map((lt, i) => {
                      const color = lt.color ?? leaveColor(lt.name.toLowerCase(), i);
                      return (
                        <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: color + '15', color, borderColor: color + '35' }}>
                          {lt.name} · {lt.totalDays}d
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDrawer({ policy })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === policy._id ? null : policy._id)}
                      className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
                      ···
                    </button>
                    {menuOpen === policy._id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                        <button onClick={() => setDrawer({ policy: { ...policy, _id: '' } })}
                          className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors">
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        {!policy.isDefault && (
                          <button onClick={() => setDefault(policy._id)}
                            className="w-full px-4 py-2 text-left text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-2 transition-colors">
                            <Star className="h-3.5 w-3.5" /> Set as default
                          </button>
                        )}
                        <button onClick={() => deletePolicy(policy._id)}
                          className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-slate-800 flex items-center gap-2 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {drawer && (
        <PolicyDrawer policy={drawer.policy} onClose={() => setDrawer(null)} onSaved={fetchPolicies} />
      )}

      <div className="border-t border-slate-700/60 pt-6">
        <BlackoutsSection />
      </div>

      <div className="border-t border-slate-700/60 pt-6">
        <AccrualControlsSection />
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PolicySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function MiniToggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
      <span className="text-xs text-slate-300">{label}</span>
      <button type="button" onClick={onToggle}
        className={cn('h-4 w-8 rounded-full relative transition-colors', on ? 'bg-indigo-500' : 'bg-slate-700')}>
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}
