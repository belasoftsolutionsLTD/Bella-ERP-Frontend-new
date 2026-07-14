'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Search, X, Sliders } from 'lucide-react';
import { useLeaveBalances } from '../Hooks/useLeaveBalances';
import { useLeaveTypes } from '../Hooks/useLeaveTypes';

function AdjustModal({ employeeId, employeeName, onClose, onAdjust }: {
  employeeId: string; employeeName: string; onClose: () => void;
  onAdjust: (data: { leaveTypeId: string; amount: number; reason: string }) => void;
}) {
  const { leaveTypes } = useLeaveTypes();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Adjust Balance — {employeeName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Leave Type <span className="text-red-400">*</span></label>
            <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none">
              <option value="">Select…</option>
              {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Adjustment (+/-) <span className="text-red-400">*</span></label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5 or -2"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Reason <span className="text-red-400">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={() => onAdjust({ leaveTypeId, amount: Number(amount), reason })} disabled={!leaveTypeId || !amount || !reason.trim()}
            className="h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            Adjust
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveBalancesPage() {
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<{ employeeId: string; name: string } | null>(null);
  const { balances, loading, adjust } = useLeaveBalances();
  const { leaveTypes } = useLeaveTypes();

  const byEmployee = useMemo(() => {
    const grouped: Record<string, { employee: any; balances: Record<string, any> }> = {};
    for (const b of balances) {
      const key = String(b.employeeId);
      if (!grouped[key]) grouped[key] = { employee: b.employee ?? null, balances: {} };
      grouped[key].balances[String(b.leaveTypeId)] = b;
    }
    return grouped;
  }, [balances]);

  const rows = useMemo(() => {
    let entries = Object.entries(byEmployee);
    if (search) entries = entries.filter(([, v]) => v.employee?.fullName?.toLowerCase().includes(search.toLowerCase()));
    if (department) entries = entries.filter(([, v]) => v.employee?.department === department);
    return entries;
  }, [byEmployee, search, department]);

  const departments = useMemo(() => [...new Set(balances.map(b => b.employee?.department).filter(Boolean))], [balances]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Leave
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Leave Balances</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Every employee's balance across all leave types</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
            className="w-full h-9 pl-9 pr-3 border border-brand-border rounded-xl text-sm bg-brand-bg-soft text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
        </div>
        <select value={department} onChange={e => setDepartment(e.target.value)} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(search || department) && (
          <button onClick={() => { setSearch(''); setDepartment(''); }} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text px-2 py-1 rounded-lg hover:bg-brand-bg-muted transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No balance records found.</p>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg-soft/60">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">Employee</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">Department</th>
                {leaveTypes.map(t => (
                  <th key={t._id} className="px-3 py-2.5 text-center text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{t.code}</th>
                ))}
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([employeeId, v]) => (
                <tr key={employeeId} className="border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-text">{v.employee?.fullName ?? 'Unknown'}</p>
                    <p className="text-xs text-brand-text-muted">{v.employee?.staffNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-text-secondary">{v.employee?.department}</td>
                  {leaveTypes.map(t => {
                    const bal = v.balances[t._id];
                    return <td key={t._id} className="px-3 py-3 text-center text-brand-text-secondary">{bal ? bal.closingBalance : '—'}</td>;
                  })}
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setAdjustTarget({ employeeId, name: v.employee?.fullName ?? 'Employee' })}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors ml-auto">
                      <Sliders className="h-3.5 w-3.5" /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjustTarget && (
        <AdjustModal
          employeeId={adjustTarget.employeeId} employeeName={adjustTarget.name}
          onClose={() => setAdjustTarget(null)}
          onAdjust={(data) => adjust({ employeeId: adjustTarget.employeeId, ...data }, () => { toast.success('Balance adjusted.'); setAdjustTarget(null); })}
        />
      )}
    </div>
  );
}
