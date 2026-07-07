'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface EmpSummary {
  _id: string; fullName: string; staffNumber: string; department: string; designation: string;
  basicSalary: number; totalEarnings: number; totalDeductions: number; netEstimate: number;
  compensationCount: number; lastUpdated: string;
}

interface Compensation {
  _id: string; conceptId: string; conceptName: string; conceptCode: string;
  category: string; subCategory: string; amount: number; currency: string;
  effectiveFrom: string; effectiveTo: string | null; isActive: boolean; notes: string | null;
  concept?: { type: string };
}

interface Concept {
  _id: string; name: string; code: string; category: string; subCategory: string; type: string; currency: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  earnings: 'bg-emerald-500/10 text-emerald-400',
  deductions: 'bg-red-500/10 text-red-400',
  benefits: 'bg-blue-500/10 text-blue-400',
  employer_contributions: 'bg-violet-500/10 text-violet-400',
};

const fmt = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

// ── Add Compensation Drawer ───────────────────────────────────────────────────

function AddCompModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [conceptId, setConceptId] = useState('');
  const [amount, setAmount]       = useState('');
  const [currency, setCurrency]   = useState('KES');
  const [effectiveFrom, setFrom]  = useState(new Date().toISOString().split('T')[0]);
  const [effectiveTo,   setTo]    = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/concepts?limit=200&isActive=true`, showToast: false,
      thenFn: r => setConcepts(r.data?.data ?? []) });
  }, []);

  const selected = concepts.find(c => c._id === conceptId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-bold text-slate-100">Add Compensation Item</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Concept <span className="text-red-400">*</span></label>
            <select value={conceptId} onChange={e => setConceptId(e.target.value)} className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="">Select concept…</option>
              {(['earnings','deductions','benefits','employer_contributions'] as const).map(cat => (
                <optgroup key={cat} label={cat.replace('_',' ').toUpperCase()}>
                  {concepts.filter(c => c.category === cat).map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {selected && <div className={cn('text-xs font-semibold px-2 py-1 rounded-full w-fit', CATEGORY_COLOR[selected.category] ?? 'bg-slate-700 text-slate-400')}>{selected.category}</div>}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Amount <span className="text-red-400">*</span></label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} placeholder="0"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                <option>KES</option><option>USD</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Effective From</label>
              <input type="date" value={effectiveFrom} onChange={e => setFrom(e.target.value)} className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Effective To (optional)</label>
              <input type="date" value={effectiveTo} onChange={e => setTo(e.target.value)} className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. negotiated during contract renewal"
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button disabled={!conceptId || !amount || saving} onClick={() => {
            setSaving(true);
            apiCallFunction({ url: `${API_BASE_URL}/payroll/compensations`, method: 'POST',
              data: { employeeId, conceptId, amount: Number(amount), currency, effectiveFrom, effectiveTo: effectiveTo || undefined, notes: notes || undefined },
              thenFn: () => { onSaved(); onClose(); },
              finallyFn: () => setSaving(false),
            });
          }} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Employee Detail Drawer ────────────────────────────────────────────────────

interface AuditLogEntry {
  _id: string; action: 'added' | 'updated' | 'removed'; conceptName: string;
  changes: { field: string; oldValue: unknown; newValue: unknown }[];
  performedByName: string; performedAt: string;
}

function EmployeeDrawer({ emp, onClose }: { emp: EmpSummary; onClose: () => void }) {
  const [comps,    setComps]    = useState<Compensation[]>([]);
  const [addOpen,  setAddOpen]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [logOpen,  setLogOpen]  = useState(false);
  const [logs,     setLogs]     = useState<AuditLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const fetchComps = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/${emp._id}`, showToast: false,
      thenFn: r => setComps(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [emp._id]);

  useEffect(() => { fetchComps(); }, [fetchComps]);

  const toggleLog = () => {
    if (!logOpen && logs.length === 0) {
      setLogLoading(true);
      apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/${emp._id}/audit-log`, showToast: false,
        thenFn: r => setLogs(r.data ?? []),
        finallyFn: () => setLogLoading(false),
      });
    }
    setLogOpen(v => !v);
  };

  const refreshLog = () => {
    if (!logOpen) return;
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/${emp._id}/audit-log`, showToast: false, thenFn: r => setLogs(r.data ?? []) });
  };

  const remove = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/payroll/compensations/${id}`, method: 'DELETE', thenFn: () => { fetchComps(); refreshLog(); } });
  };

  const grouped = (['earnings','deductions','benefits','employer_contributions'] as const).map(cat => ({
    cat, items: comps.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-2xl flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[92vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
            <div>
              <p className="text-base font-bold text-slate-100">{emp.fullName}</p>
              <p className="text-xs text-slate-500">{emp.designation} · {emp.department} · {emp.staffNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-slate-700 shrink-0">
            {[
              { label: 'Total Earnings',    value: fmt(emp.totalEarnings),    color: 'text-emerald-400' },
              { label: 'Total Deductions',  value: fmt(emp.totalDeductions),  color: 'text-red-400'     },
              { label: 'Est. Net Pay',      value: fmt(emp.netEstimate),      color: 'text-indigo-400'  },
              { label: 'Items',             value: String(emp.compensationCount), color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 rounded-xl px-3 py-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={cn('text-sm font-bold mt-0.5', color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {loading ? (
              <div className="py-10 flex justify-center"><div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
            ) : comps.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-slate-500 text-sm">No compensation items yet.</p>
                <button onClick={() => setAddOpen(true)} className="text-indigo-400 text-xs underline">Add first item</button>
              </div>
            ) : (
              grouped.map(({ cat, items }) => (
                <div key={cat}>
                  <p className={cn('text-xs font-bold uppercase tracking-wide mb-2 px-1', CATEGORY_COLOR[cat] ?? 'text-slate-500')}>
                    {cat.replace('_',' ')}
                  </p>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {items.map((comp, i) => (
                      <div key={comp._id} className={cn('flex items-center justify-between px-4 py-3', i < items.length - 1 && 'border-b border-slate-700/60')}>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{comp.conceptName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{comp.conceptCode}
                            {comp.effectiveTo && ` · ends ${new Date(comp.effectiveTo).toLocaleDateString('en-KE', { month:'short', year:'numeric' })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-100">{fmt(comp.amount, comp.currency)}</span>
                          <button onClick={() => remove(comp._id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div>
              <button onClick={toggleLog} className="text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wide mb-2 px-1">
                {logOpen ? '▾' : '▸'} Audit Log
              </button>
              {logOpen && (
                logLoading ? (
                  <div className="py-6 flex justify-center"><div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-slate-500 px-1">No changes recorded yet.</p>
                ) : (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {logs.map((l, i) => (
                      <div key={l._id} className={cn('px-4 py-2.5 text-xs', i < logs.length - 1 && 'border-b border-slate-700/60')}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">
                            <span className={cn(l.action === 'added' ? 'text-emerald-400' : l.action === 'removed' ? 'text-red-400' : 'text-amber-400')}>{l.action}</span>
                            {' '}{l.conceptName}
                          </span>
                          <span className="text-slate-500">{new Date(l.performedAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          by {l.performedByName}
                          {l.changes.length > 0 && ' — ' + l.changes.map(c => `${c.field}: ${c.oldValue ?? '—'} → ${c.newValue ?? '—'}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {addOpen && <AddCompModal employeeId={emp._id} onClose={() => setAddOpen(false)} onSaved={() => { fetchComps(); refreshLog(); }} />}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

// ── Pay Groups panel ──────────────────────────────────────────────────────────

interface PayGroupSummary { payGroup: string; employeeCount: number; payFrequency: string }

function PayGroupsPanel() {
  const [groups, setGroups] = useState<PayGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [freqDraft, setFreqDraft] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees/pay-groups`, showToast: false,
      thenFn: r => setGroups(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const saveFrequency = (payGroup: string) => {
    setSaving(true);
    apiCallFunction({ url: `${API_BASE_URL}/employees/pay-groups/${encodeURIComponent(payGroup)}/frequency`, method: 'PATCH',
      data: { payFrequency: freqDraft },
      thenFn: () => { setEditing(null); fetchGroups(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden mb-5">
      <div className="px-5 py-3 border-b border-slate-700"><h3 className="text-sm font-bold text-slate-100">Pay Groups &amp; Schedule</h3></div>
      {loading ? (
        <div className="py-8 flex justify-center"><div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
      ) : (
        <div className="grid border-b border-slate-700 bg-slate-800/60" style={{ gridTemplateColumns: '1fr 120px 140px 140px' }}>
          {['Pay Group', 'Employees', 'Pay Frequency', ''].map(h => (
            <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
          ))}
        </div>
      )}
      {!loading && groups.map(g => (
        <div key={g.payGroup} style={{ gridTemplateColumns: '1fr 120px 140px 140px' }} className="grid border-b border-slate-700/60 last:border-0 items-center">
          <div className="px-4 py-3 text-sm font-medium text-slate-200">{g.payGroup}</div>
          <div className="px-4 py-3 text-sm text-slate-300">{g.employeeCount}</div>
          <div className="px-4 py-3">
            {editing === g.payGroup ? (
              <select value={freqDraft} onChange={e => setFreqDraft(e.target.value as any)} className="h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200">
                <option value="monthly">Monthly</option>
                <option value="biweekly">Biweekly</option>
                <option value="weekly">Weekly</option>
              </select>
            ) : (
              <span className="text-xs text-slate-400 capitalize">{g.payFrequency}</span>
            )}
          </div>
          <div className="px-4 py-3">
            {editing === g.payGroup ? (
              <div className="flex gap-2">
                <button onClick={() => saveFrequency(g.payGroup)} disabled={saving} className="text-xs font-semibold text-emerald-400 hover:underline disabled:opacity-50">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditing(g.payGroup); setFreqDraft(g.payFrequency === 'mixed' ? 'monthly' : (g.payFrequency as any)); }} className="text-xs font-semibold text-primary hover:underline">
                Set Frequency
              </button>
            )}
          </div>
        </div>
      ))}
      {!loading && groups.length === 0 && <div className="py-8 text-center text-slate-600 text-sm">No pay groups yet — assign employees to a group via their profile.</div>}
    </div>
  );
}

export default function PayrollEmployeesPage() {
  const [employees, setEmployees] = useState<EmpSummary[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<EmpSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/employees`, showToast: false,
      thenFn: r => setEmployees(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const filtered = employees.filter(e =>
    !search || e.fullName.toLowerCase().includes(search.toLowerCase()) || e.staffNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="border-b border-slate-700/60 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">Employee Compensations</h1>
            <p className="text-xs text-slate-400 mt-0.5">Assign payroll concepts to each employee</p>
          </div>
          <a href="/en/payroll" className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">← Back to Payroll</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PayGroupsPanel />

        <div className="relative max-w-xs mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…"
            className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="grid border-b border-slate-700 bg-slate-800/60" style={{ gridTemplateColumns: '1fr 130px 130px 120px 100px 80px' }}>
            {['Employee','Basic Salary','Total Earnings','Deductions','Net Est.','Items'].map(h => (
              <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="py-16 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-600 text-sm">No employees found.</div>
          ) : filtered.map(emp => (
            <div key={emp._id} onClick={() => setSelected(emp)} style={{ gridTemplateColumns: '1fr 130px 130px 120px 100px 80px' }}
              className="grid border-b border-slate-700/60 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer items-center">
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                  {emp.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{emp.fullName}</p>
                  <p className="text-[10px] text-slate-500">{emp.department}</p>
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-slate-300">{fmt(emp.basicSalary)}</div>
              <div className="px-4 py-3 text-sm text-emerald-400 font-semibold">{fmt(emp.totalEarnings)}</div>
              <div className="px-4 py-3 text-sm text-red-400">{fmt(emp.totalDeductions)}</div>
              <div className="px-4 py-3 text-sm font-bold text-slate-100">{fmt(emp.netEstimate)}</div>
              <div className="px-4 py-3 text-sm text-slate-500">{emp.compensationCount}</div>
            </div>
          ))}
        </div>
      </div>

      {selected && <EmployeeDrawer emp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
