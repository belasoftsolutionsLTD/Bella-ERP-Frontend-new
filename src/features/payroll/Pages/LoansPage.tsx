'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, Plus, X, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { LOAN_TYPES } from '../loanTypes';

interface EmpSummary {
  _id: string; fullName: string; staffNumber: string; department: string;
}

interface ActiveLoan {
  _id: string; employeeId: string; loanType: string; principal: number; monthlyInstallment: number;
  balanceRemaining: number; totalRepaid: number; status: 'active' | 'completed' | 'cancelled';
  startDate: string; completedAt: string | null; notes: string | null;
  employee: { fullName: string; staffNumber: string; department: string } | null;
}

// A loan being 'active' means it's still an ongoing repayment obligation, not a positive
// state — unlike an active employee, so this deliberately maps to amber, not the canonical
// green 'active' status.
const LOAN_STATUS_MAP: Record<string, Status> = {
  active: 'inProgress', completed: 'completed', cancelled: 'cancelled',
};

const fmt = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

// ── Add Loan Modal (employee-picker first, then the loan form) ─────────────────

function AddLoanModal({ employees, onClose, onSaved }: { employees: EmpSummary[]; onClose: () => void; onSaved: () => void }) {
  const [empSearch, setEmpSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loanType, setLoanType] = useState('Staff Loan');
  const [loanTypeIsOther, setLoanTypeIsOther] = useState(false);
  const [principal, setPrincipal] = useState('');
  const [monthlyInstallment, setInstallment] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredEmployees = employees.filter(e =>
    !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.staffNumber?.toLowerCase().includes(empSearch.toLowerCase())
  );
  const selectedEmp = employees.find(e => e._id === employeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Add Staff Loan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Employee <span className="text-red-400">*</span></label>
            {selectedEmp ? (
              <div className="flex items-center justify-between h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text">
                <span className="truncate">{selectedEmp.fullName} · {selectedEmp.staffNumber}</span>
                <button onClick={() => setEmployeeId('')} className="text-xs text-brand-text-muted hover:text-brand-text ml-2 shrink-0">Change</button>
              </div>
            ) : (
              <>
                <div className="relative mb-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                  <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees…"
                    className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                </div>
                <div className="max-h-40 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/60">
                  {filteredEmployees.length === 0 ? (
                    <p className="px-3 py-2.5 text-xs text-brand-text-muted">No employees found.</p>
                  ) : filteredEmployees.slice(0, 50).map(e => (
                    <button key={e._id} onClick={() => setEmployeeId(e._id)}
                      className="w-full text-left px-3 py-2 text-sm text-brand-text hover:bg-brand-bg-soft transition-colors">
                      {e.fullName} <span className="text-brand-text-muted text-xs">· {e.staffNumber} · {e.department}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Loan Type</label>
            <select value={loanTypeIsOther ? 'Other' : loanType}
              onChange={e => {
                if (e.target.value === 'Other') { setLoanTypeIsOther(true); setLoanType(''); }
                else { setLoanTypeIsOther(false); setLoanType(e.target.value); }
              }}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {loanTypeIsOther && (
              <input value={loanType} onChange={e => setLoanType(e.target.value)} placeholder="Type the loan type" autoFocus
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary mt-1.5" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Principal Amount <span className="text-red-400">*</span></label>
              <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} min={0} placeholder="e.g. 60000"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Monthly Installment <span className="text-red-400">*</span></label>
              <input type="number" value={monthlyInstallment} onChange={e => setInstallment(e.target.value)} min={0} placeholder="e.g. 5000"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <p className="text-xs text-brand-text-muted">
            Each payroll cycle deducts the installment automatically and reduces the balance — it stops on its own once fully repaid.
          </p>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. approved by HR on..."
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button disabled={!employeeId || !principal || !monthlyInstallment || !loanType || saving} onClick={() => {
            setSaving(true);
            apiCallFunction({ url: `${API_BASE_URL}/payroll/loans`, method: 'POST',
              data: { employeeId, loanType, principal: Number(principal), monthlyInstallment: Number(monthlyInstallment), startDate, notes: notes || undefined },
              thenFn: () => { onSaved(); onClose(); },
              finallyFn: () => setSaving(false),
            });
          }} className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Adding…' : 'Add Loan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LoansPage() {
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [employees, setEmployees] = useState<EmpSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const fetchLoans = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/loans/active`, showToast: false,
      thenFn: r => setLoans(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => {
    fetchLoans();
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/employees`, showToast: false,
      thenFn: r => setEmployees(r.data ?? []) });
  }, [fetchLoans]);

  const cancelLoan = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/payroll/loans/${id}`, method: 'PUT', data: { action: 'cancel' }, thenFn: () => fetchLoans() });
  };

  const filtered = loans.filter(l =>
    !search ||
    l.employee?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    l.employee?.staffNumber?.toLowerCase().includes(search.toLowerCase()) ||
    l.loanType.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = loans.reduce((sum, l) => sum + (l.balanceRemaining || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-brand-text tracking-tight">Staff Loans</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Everyone with an active loan or salary advance, org-wide</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Loan
            </button>
            <a href="/en/payroll" className="px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">← Back to Payroll</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-3 mb-5 max-w-xl">
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
            <p className="text-[10px] text-brand-text-muted uppercase tracking-wide">Active Loans</p>
            <p className="text-lg font-bold text-brand-text mt-0.5">{loans.length}</p>
          </div>
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 col-span-2">
            <p className="text-[10px] text-brand-text-muted uppercase tracking-wide">Total Outstanding Balance</p>
            <p className="text-lg font-bold text-amber-500 mt-0.5">{fmt(totalOutstanding)}</p>
          </div>
        </div>

        <div className="relative max-w-xs mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, staff no. or loan type…"
            className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
        </div>

        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 140px 120px 120px 130px 160px 80px' }}>
            {['Employee','Loan Type','Principal','Installment','Balance','Repayment','Actions'].map(h => (
              <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="py-16 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Landmark className="h-6 w-6 text-brand-text-muted mx-auto" />
              <p className="text-brand-text-muted text-sm">No active loans found.</p>
            </div>
          ) : filtered.map(loan => {
            const pct = loan.principal > 0 ? Math.round((loan.totalRepaid / loan.principal) * 100) : 0;
            return (
              <div key={loan._id} style={{ gridTemplateColumns: '1fr 140px 120px 120px 130px 160px 80px' }}
                className="grid border-b border-brand-border/60 last:border-0 items-center">
                <div className="px-4 py-3 flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                    {(loan.employee?.fullName ?? '??').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">{loan.employee?.fullName ?? 'Unknown employee'}</p>
                    <p className="text-[10px] text-brand-text-muted">{loan.employee?.staffNumber} · {loan.employee?.department}</p>
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-brand-text-secondary truncate">{loan.loanType}</div>
                <div className="px-4 py-3 text-sm text-brand-text">{fmt(loan.principal)}</div>
                <div className="px-4 py-3 text-sm text-brand-text">{fmt(loan.monthlyInstallment)}</div>
                <div className="px-4 py-3 text-sm font-bold text-amber-500">{fmt(loan.balanceRemaining)}</div>
                <div className="px-4 py-3">
                  <div className="h-1.5 bg-brand-bg-muted rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-brand-text-muted">{pct}% repaid</p>
                </div>
                <div className="px-4 py-3 flex items-center gap-2">
                  <StatusBadge status={LOAN_STATUS_MAP[loan.status] ?? 'inProgress'} label={loan.status} className="py-1" />
                  <button onClick={() => cancelLoan(loan._id)} title="Write off / cancel"
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {addOpen && <AddLoanModal employees={employees} onClose={() => setAddOpen(false)} onSaved={fetchLoans} />}
    </div>
  );
}
