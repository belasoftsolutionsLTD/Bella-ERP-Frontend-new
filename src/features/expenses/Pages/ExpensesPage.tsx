'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Check, XCircle, Download, ChevronLeft, ChevronRight, AlertTriangle, Eye, Pencil, Trash2, Banknote, Loader2, Paperclip, MessageSquareWarning, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { downloadFile, openFile } from '@/functions/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { DEPARTMENTS } from '@/features/employees/Components/EmployeeSchema';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

type ExpenseType   = 'regular' | 'per_diem' | 'mileage' | 'itemized';
type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | 'disputed';

interface ExpenseLineItem {
  id: string; categoryId?: string; categoryName: string; description?: string;
  amount: number; currency: string; expenseDate: string; receiptFile?: string | null;
  merchantName?: string | null; notes?: string | null; policyViolation?: string | null;
}

interface ApprovalChainEntry {
  level: number; approverId?: string; approverName?: string; approverRole?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actedAt?: string; comment?: string; thresholdAmount?: number;
}

interface ExpenseClaim {
  _id: string; type: ExpenseType; category?: string;
  amount: number; currency: string; date: string;
  description?: string; notes?: string; receiptFile?: string;
  destination?: string; startDate?: string; endDate?: string; perDiemDays?: number;
  fromLocation?: string; toLocation?: string; distanceKm?: number; isRoundTrip?: boolean;
  projectId?: string; isBillable?: boolean;
  items?: ExpenseLineItem[]; policyId?: string; department?: string;
  approvalChain?: ApprovalChainEntry[]; currentApprovalLevel?: number;
  isPolicyViolation: boolean; violationReason?: string;
  status: ExpenseStatus;
  employee?: { fullName: string; staffNumber: string; department: string };
  rejectionReason?: string; createdAt: string;
}

interface Stats {
  pendingCount: number; pendingTotal: number;
  approvedCount: number; approvedTotal: number; violations: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<ExpenseStatus, { status: Status; label: string }> = {
  draft:      { status: 'draft',     label: 'Draft' },
  submitted:  { status: 'submitted', label: 'Submitted' },
  approved:   { status: 'approved',  label: 'Approved' },
  rejected:   { status: 'rejected',  label: 'Rejected' },
  reimbursed: { status: 'completed', label: 'Reimbursed' },
  disputed:   { status: 'pending',   label: 'Disputed' },
};

const TYPE_CFG: Record<ExpenseType, { label: string; bg: string; text: string }> = {
  regular:  { label: 'Regular',  bg: 'bg-brand-bg-muted',    text: 'text-brand-text-secondary' },
  per_diem: { label: 'Per Diem', bg: 'bg-cyan-500/15',  text: 'text-cyan-400'  },
  mileage:  { label: 'Mileage',  bg: 'bg-orange-500/15',text: 'text-orange-400'},
  itemized: { label: 'Itemized', bg: 'bg-emerald-500/15',text: 'text-emerald-400'},
};

const APPROVAL_STATUS_MAP: Record<ApprovalChainEntry['status'], Status> = {
  pending: 'pending', approved: 'approved', rejected: 'rejected', skipped: 'inactive',
};

const CATEGORIES = ['Travel','Meals','Accommodation','Office Supplies','Equipment','Entertainment','Other'];

const fmt    = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtDate= (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—';

// ── Submit Expense Drawer ─────────────────────────────────────────────────────

function SubmitDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type,         setType]         = useState<ExpenseType>('regular');
  const [category,     setCategory]     = useState('');
  const [amount,       setAmount]       = useState('');
  const [currency,     setCurrency]     = useState('KES');
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [description,  setDescription]  = useState('');
  const [notes,        setNotes]        = useState('');
  const [destination,  setDestination]  = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [fromLoc,      setFromLoc]      = useState('');
  const [toLoc,        setToLoc]        = useState('');
  const [distanceKm,    setDistanceKm]    = useState('');
  const [isRoundTrip,   setIsRoundTrip]   = useState(false);
  const [calcLoading,   setCalcLoading]   = useState(false);
  const [isBillable,   setIsBillable]   = useState(false);
  const [receipt,      setReceipt]      = useState<File | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [policyRates,  setPolicyRates]  = useState<{ mileageRate: number; perDiemRate: number }>({ mileageRate: 15, perDiemRate: 3000 });
  const [items, setItems] = useState<{ category: string; description: string; amount: string; expenseDate: string }[]>([
    { category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0] },
  ]);

  const addItemRow    = () => setItems(prev => [...prev, { category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0] }]);
  const removeItemRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItemRow = (i: number, field: string, value: string) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  const itemsTotal    = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/expense-claims/policy`, showToast: false,
      thenFn: r => {
        const p = r.data ?? {};
        setPolicyRates({ mileageRate: p.mileageRate ?? 15, perDiemRate: p.defaultPerDiemRate ?? 3000 });
      },
    });
  }, []);

  // Per diem preview
  const perDiemDays  = (startDate && endDate) ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24)) + 1 : 0;
  const perDiemRate  = policyRates.perDiemRate;
  const perDiemTotal = perDiemDays * perDiemRate;

  // Mileage preview
  const km            = Number(distanceKm) * (isRoundTrip ? 2 : 1);
  const mileageRate   = policyRates.mileageRate;
  const mileageTotal  = km * mileageRate;

  const handleSubmit = () => {
    if (type === 'itemized') {
      const validItems = items.filter(it => it.category && Number(it.amount) > 0);
      if (!validItems.length) { alert('Add at least one line item with a category and amount.'); return; }
      setSaving(true);
      apiCallFunction({
        url: `${API_BASE_URL}/expense-claims`, method: 'POST',
        data: {
          type: 'itemized', currency, notes, isBillable,
          items: validItems.map(it => ({
            categoryId: it.category,
            categoryName: CATEGORIES.find(c => c.toLowerCase().replace(' ', '_') === it.category) ?? it.category,
            description: it.description, amount: Number(it.amount), expenseDate: it.expenseDate,
          })),
        },
        thenFn: () => { onSaved(); onClose(); },
        finallyFn: () => setSaving(false),
      });
      return;
    }
    if (!receipt) { alert('Please attach a receipt (PDF or image) before submitting.'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('type', type);
    fd.append('currency', currency);
    fd.append('notes', notes);
    fd.append('isBillable', String(isBillable));
    if (type === 'regular')  { fd.append('category', category); fd.append('amount', amount); fd.append('date', date); fd.append('description', description); }
    if (type === 'per_diem') { fd.append('destination', destination); fd.append('startDate', startDate); fd.append('endDate', endDate); fd.append('description', description); }
    if (type === 'mileage')  { fd.append('fromLocation', fromLoc); fd.append('toLocation', toLoc); fd.append('distanceKm', distanceKm); fd.append('isRoundTrip', String(isRoundTrip)); fd.append('date', date); fd.append('description', description); }
    fd.append('receipt', receipt);
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims`, method: 'POST', data: fd,
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  const Toggle = ({ val, set, label }: { val: boolean; set: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-text-secondary">{label}</span>
      <button type="button" onClick={() => set(!val)} className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', val ? 'bg-brand-primary' : 'bg-brand-bg-muted')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', val ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">Submit Expense</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['regular','per_diem','mileage','itemized'] as ExpenseType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={cn('py-3 rounded-xl border text-center transition-all', type === t ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg-soft hover:border-brand-border-strong')}>
                <p className="text-lg mb-0.5">{t === 'regular' ? '📄' : t === 'per_diem' ? '🗓️' : t === 'mileage' ? '🚗' : '🧾'}</p>
                <p className={cn('text-xs font-bold', type === t ? 'text-indigo-300' : 'text-brand-text-secondary')}>{TYPE_CFG[t].label}</p>
              </button>
            ))}
          </div>

          {type === 'regular' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Category <span className="text-red-400">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c.toLowerCase().replace(' ','_')}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Amount <span className="text-red-400">*</span></label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                    <option>KES</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Date <span className="text-red-400">*</span></label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description <span className="text-red-400">*</span></label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
            </>
          )}

          {type === 'per_diem' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Destination <span className="text-red-400">*</span></label>
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Mombasa" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Start Date <span className="text-red-400">*</span></label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">End Date <span className="text-red-400">*</span></label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                </div>
              </div>
              {perDiemDays > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-300 font-semibold">
                  {perDiemDays} day{perDiemDays !== 1 ? 's' : ''} × KES {perDiemRate.toLocaleString()}/day = <span className="text-lg font-black">{fmt(perDiemTotal)}</span>
                </div>
              )}
            </>
          )}

          {type === 'mileage' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">From <span className="text-red-400">*</span></label>
                  <input value={fromLoc} onChange={e => { setFromLoc(e.target.value); setDistanceKm(''); }} placeholder="Origin address" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">To <span className="text-red-400">*</span></label>
                  <input value={toLoc} onChange={e => { setToLoc(e.target.value); setDistanceKm(''); }} placeholder="Destination address" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Distance (km) <span className="text-red-400">*</span></label>
                  <button type="button" disabled={!fromLoc.trim() || !toLoc.trim() || calcLoading}
                    onClick={() => {
                      setCalcLoading(true);
                      apiCallFunction<any>({
                        url: `${API_BASE_URL}/expense-claims/calculate-distance`,
                        method: 'POST',
                        data: { origin: fromLoc, destination: toLoc },
                        thenFn: r => setDistanceKm(String(r.data?.distanceKm ?? '')),
                        finallyFn: () => setCalcLoading(false),
                      });
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {calcLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                    {calcLoading ? 'Calculating…' : 'Auto-calculate via Maps'}
                  </button>
                </div>
                <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} placeholder="0" min={0} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <Toggle val={isRoundTrip} set={setIsRoundTrip} label="Round trip (doubles km)" />
              {Number(distanceKm) > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-300 font-semibold">
                  {km} km × KES {mileageRate}/km = <span className="text-lg font-black">{fmt(mileageTotal)}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Date <span className="text-red-400">*</span></label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
            </>
          )}

          {type === 'itemized' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Line Items <span className="text-red-400">*</span></label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-7 px-2 bg-brand-bg-soft border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-primary">
                  <option>KES</option><option>USD</option><option>EUR</option>
                </select>
              </div>
              {items.map((it, i) => (
                <div key={i} className="bg-brand-bg-soft/60 border border-brand-border rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={it.category} onChange={e => updateItemRow(i, 'category', e.target.value)}
                      className="h-9 px-2 bg-brand-bg-soft border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-primary">
                      <option value="">Category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c.toLowerCase().replace(' ', '_')}>{c}</option>)}
                    </select>
                    <input type="number" value={it.amount} onChange={e => updateItemRow(i, 'amount', e.target.value)} placeholder="Amount"
                      className="h-9 px-2 bg-brand-bg-soft border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-primary" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input value={it.description} onChange={e => updateItemRow(i, 'description', e.target.value)} placeholder="Description"
                      className="h-9 px-2 bg-brand-bg-soft border border-brand-border rounded-lg text-xs text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                    <input type="date" value={it.expenseDate} onChange={e => updateItemRow(i, 'expenseDate', e.target.value)}
                      className="h-9 px-2 bg-brand-bg-soft border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-primary" />
                    <button type="button" onClick={() => removeItemRow(i)} disabled={items.length === 1}
                      className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 flex items-center justify-center transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
              {itemsTotal > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 font-semibold">
                  Total: <span className="text-lg font-black">{fmt(itemsTotal, currency)}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Notes for approver (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add context for your manager…" className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <Toggle val={isBillable} set={setIsBillable} label="Billable to client?" />

          {/* Receipt upload – required (not for itemized, which itemizes spend line-by-line) */}
          {type !== 'itemized' && (
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Receipt / Evidence <span className="text-red-400">*</span>
            </label>
            <label className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              receipt ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-brand-border-strong hover:border-brand-primary/50 hover:bg-brand-primary-hover/5'
            )}>
              <Paperclip className={cn('h-4 w-4 shrink-0', receipt ? 'text-emerald-400' : 'text-brand-text-muted')} />
              <div className="flex-1 min-w-0">
                {receipt ? (
                  <p className="text-sm font-semibold text-emerald-400 truncate">{receipt.name}</p>
                ) : (
                  <p className="text-sm text-brand-text-muted">Click to attach PDF or image</p>
                )}
                <p className="text-[11px] text-brand-text-muted mt-0.5">PDF, PNG, JPG — max 10 MB</p>
              </div>
              {receipt && (
                <button type="button" onClick={e => { e.preventDefault(); setReceipt(null); }}
                  className="text-brand-text-muted hover:text-red-400 shrink-0 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                onChange={e => setReceipt(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || (type !== 'itemized' && !receipt)} className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ec4899','#3b82f6','#a78bfa','#f87171','#34d399','#fbbf24','#60a5fa'];

function AnalyticsTab() {
  const now  = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/expense-claims/analytics?year=${year}`, showToast: false,
      thenFn: r => setData(r.data ?? null) });
  }, [year]);

  if (!data) return <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>;

  const monthlyData = (data.byMonth ?? Array(12).fill(0)).map((v: number, i: number) => ({
    month: MONTHS_SHORT[i],
    amount: v,
    isCurrent: i === now.getMonth() && year === now.getFullYear(),
  }));

  const categoryData = (data.byCategory ?? []).map((c: any) => ({
    name: c._id ?? 'Other',
    value: c.total,
    count: c.count,
  }));

  const deptData = (data.byDept ?? [])
    .filter((d: any) => d._id)
    .map((d: any) => ({ name: d._id, amount: d.total }));

  const totalSpend = (data.byMonth ?? []).reduce((s: number, v: number) => s + v, 0);

  const fmtAxis = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-brand-bg-soft border border-brand-border-strong rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-brand-text-secondary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{fmt(p.value)}</p>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="bg-brand-bg-soft border border-brand-border-strong rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-brand-text-secondary font-semibold capitalize">{d.name}</p>
        <p className="text-sm font-bold text-white">{fmt(d.value)}</p>
        <p className="text-xs text-brand-text-muted">{d.payload.count} claims</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Year nav + summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-bold text-brand-text w-16 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= now.getFullYear()} className="h-8 w-8 rounded-lg bg-brand-bg-soft border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {totalSpend > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-brand-text-secondary">
            Total approved: <span className="font-bold text-brand-text">{fmt(totalSpend)}</span>
          </div>
        )}
      </div>

      {/* Monthly area chart */}
      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-brand-text mb-4">Monthly Spend — {year}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtAxis} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#expGrad)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category pie chart */}
        {categoryData.length > 0 && (
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-brand-text mb-4">Spend by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={45} paddingAngle={3}>
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'capitalize' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Department bar chart */}
        {deptData.length > 0 && (
          <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-brand-text mb-4">Spend by Department</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={fmtAxis} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {deptData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top spenders */}
      {(data.topSpenders ?? []).length > 0 && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border"><h3 className="text-sm font-bold text-brand-text">Top Spenders</h3></div>
          {data.topSpenders.map((s: any, i: number) => {
            const pct = totalSpend > 0 ? Math.round((s.total / totalSpend) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-brand-border/60 last:border-0">
                <span className="text-sm font-bold text-brand-text-muted w-5 text-center">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-text truncate">{s.employee?.fullName ?? 'Unknown'}</p>
                  <div className="mt-1 h-1 bg-brand-bg-muted rounded-full w-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
                <span className="text-xs text-brand-text-muted shrink-0">{s.count} claims</span>
                <span className="text-sm font-bold text-brand-text shrink-0">{fmt(s.total)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Policy Settings Tab ───────────────────────────────────────────────────────

const POLICY_ROLE_OPTIONS = ['staff', 'department_head', 'hr_manager'];

interface TargetedPolicy {
  _id: string; name: string; description?: string; isDefault: boolean; isActive: boolean;
  appliesTo?: { roles?: string[]; departments?: string[] };
  mileageRate?: number; defaultPerDiemRate?: number; autoApproveUnder?: number;
}

function PolicyFormModal({ policy, onClose, onSaved }: { policy: TargetedPolicy | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName]                     = useState(policy?.name ?? '');
  const [role, setRole]                     = useState(policy?.appliesTo?.roles?.[0] ?? '');
  const [department, setDepartment]         = useState(policy?.appliesTo?.departments?.[0] ?? '');
  const [mileageRate, setMileageRate]       = useState(String(policy?.mileageRate ?? 15));
  const [defaultPerDiem, setDefaultPerDiem] = useState(String(policy?.defaultPerDiemRate ?? 3000));
  const [autoApproveUnder, setAutoApprove]  = useState(String(policy?.autoApproveUnder ?? 0));
  const [isDefault, setIsDefault]           = useState(policy?.isDefault ?? false);
  const [saving, setSaving]                 = useState(false);

  const save = () => {
    if (!name.trim()) { alert('Policy name is required.'); return; }
    setSaving(true);
    const data = {
      name: name.trim(),
      appliesTo: { roles: role ? [role] : undefined, departments: department ? [department] : undefined },
      mileageRate: Number(mileageRate), defaultPerDiemRate: Number(defaultPerDiem),
      autoApproveUnder: Number(autoApproveUnder), isDefault,
    };
    const req = policy
      ? apiCallFunction({ url: `${API_BASE_URL}/expense-claims/policies/${policy._id}`, method: 'PATCH', data, thenFn: () => { onSaved(); onClose(); }, finallyFn: () => setSaving(false) })
      : apiCallFunction({ url: `${API_BASE_URL}/expense-claims/policies`, method: 'POST', data, thenFn: () => { onSaved(); onClose(); }, finallyFn: () => setSaving(false) });
    void req;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">{policy ? 'Edit Policy' : 'New Targeted Policy'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Policy Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Team Travel Policy"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applies to role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">Any role</option>
                {POLICY_ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Applies to department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">Any department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Mileage rate/km</label>
              <input type="number" value={mileageRate} onChange={e => setMileageRate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Per diem/day</label>
              <input type="number" value={defaultPerDiem} onChange={e => setDefaultPerDiem(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Auto-approve under</label>
              <input type="number" value={autoApproveUnder} onChange={e => setAutoApprove(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-brand-bg-soft/50 rounded-lg px-3 py-2.5">
            <span className="text-sm text-brand-text-secondary">Make this the org default policy</span>
            <button type="button" onClick={() => setIsDefault(v => !v)} className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', isDefault ? 'bg-brand-primary' : 'bg-brand-bg-muted')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', isDefault ? 'translate-x-4' : 'translate-x-0.5')} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PolicyTab() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [mileageRate, setMileageRate]         = useState('');
  const [defaultPerDiem, setDefaultPerDiem]   = useState('');
  const [autoApproveUnder, setAutoApprove]    = useState('');
  const [policies, setPolicies]     = useState<TargetedPolicy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<TargetedPolicy | null | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPolicy = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/expense-claims/policy`, showToast: false,
      thenFn: r => {
        const p = r.data ?? {};
        setMileageRate(String(p.mileageRate ?? 15));
        setDefaultPerDiem(String(p.defaultPerDiemRate ?? 3000));
        setAutoApprove(String(p.autoApproveUnder ?? 0));
      }
    });
  }, []);

  const loadPolicies = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/expense-claims/policies`, showToast: false,
      thenFn: r => setPolicies(r.data ?? []) });
  }, []);

  useEffect(() => { loadPolicy(); loadPolicies(); }, [loadPolicy, loadPolicies]);

  const save = () => {
    setSaving(true);
    setSaved(false);
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims/policy`, method: 'PUT',
      data: { mileageRate: Number(mileageRate), defaultPerDiemRate: Number(defaultPerDiem), autoApproveUnder: Number(autoApproveUnder) },
      thenFn: () => { setSaved(true); loadPolicy(); loadPolicies(); },
      finallyFn: () => setSaving(false),
    });
  };

  const deletePolicy = (id: string) => {
    if (!confirm('Deactivate this policy?')) return;
    setDeletingId(id);
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims/policies/${id}`, method: 'DELETE',
      thenFn: loadPolicies, finallyFn: () => setDeletingId(null) });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-brand-text">Default Policy</h3>
        <p className="text-xs text-brand-text-muted -mt-3">Applies org-wide unless a targeted policy below matches an employee's role or department.</p>
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Mileage rate per km (KES)</label>
            <input type="number" value={mileageRate} onChange={e => setMileageRate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Default per diem daily rate (KES)</label>
            <input type="number" value={defaultPerDiem} onChange={e => setDefaultPerDiem(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Auto-approve under (KES) — set 0 to disable</label>
            <input type="number" value={autoApproveUnder} onChange={e => setAutoApprove(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Default Policy'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-brand-text">Targeted Policies</h3>
            <p className="text-xs text-brand-text-muted">Override the default for a specific role or department.</p>
          </div>
          <button onClick={() => setEditingPolicy(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Policy
          </button>
        </div>
        {policies.length === 0 ? (
          <p className="text-xs text-brand-text-muted py-4 text-center">No targeted policies yet — the default policy applies to everyone.</p>
        ) : (
          <div className="space-y-2">
            {policies.map(p => (
              <div key={p._id} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text flex items-center gap-2">
                    {p.name}
                    {p.isDefault && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/15 text-indigo-400">DEFAULT</span>}
                  </p>
                  <p className="text-[11px] text-brand-text-muted mt-0.5">
                    {p.appliesTo?.roles?.length ? `Role: ${p.appliesTo.roles.join(', ').replace(/_/g,' ')}` : ''}
                    {p.appliesTo?.roles?.length && p.appliesTo?.departments?.length ? ' · ' : ''}
                    {p.appliesTo?.departments?.length ? `Dept: ${p.appliesTo.departments.join(', ')}` : ''}
                    {!p.appliesTo?.roles?.length && !p.appliesTo?.departments?.length ? 'Applies to everyone' : ''}
                    {' · '}Km rate {p.mileageRate ?? '—'} · Per diem {p.defaultPerDiemRate ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditingPolicy(p)} className="h-7 w-7 rounded-lg bg-brand-bg-muted flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-border-strong transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!p.isDefault && (
                    <button onClick={() => deletePolicy(p._id)} disabled={deletingId === p._id} className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                      {deletingId === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingPolicy !== undefined && (
        <PolicyFormModal policy={editingPolicy} onClose={() => setEditingPolicy(undefined)} onSaved={() => { loadPolicies(); loadPolicy(); }} />
      )}
    </div>
  );
}

// ── Dispute Claim Modal ───────────────────────────────────────────────────────

function DisputeClaimModal({ claim, onClose, onSaved }: { claim: ExpenseClaim; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/expense-claims/${claim._id}/dispute`,
      method: 'PUT',
      data: { reason: reason.trim() || undefined },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-orange-400 shrink-0" />
          <h3 className="text-base font-bold text-brand-text">Dispute Rejection</h3>
        </div>
        <p className="text-xs text-brand-text-secondary">Explain why you believe this claim should be reconsidered. HR will review your dispute.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for dispute (optional)…" rows={3}
          className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Claim Modal ────────────────────────────────────────────────────────

function RejectClaimModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-brand-text">Reject Expense Claim</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection…"
          rows={3}
          className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-red-500 resize-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-5 py-2 rounded-lg bg-brand-danger hover:bg-brand-danger/90 text-white text-sm font-bold disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Claim Detail Drawer ───────────────────────────────────────────────────────

function ClaimDetailDrawer({ claim, isHR, canApprove, onClose, onRefresh, onDisputeClick }: {
  claim: ExpenseClaim; isHR: boolean; canApprove: boolean; onClose: () => void; onRefresh: () => void; onDisputeClick: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const act = (action: string, url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: object) => {
    setBusy(action);
    apiCallFunction({ url, method, data: body,
      thenFn: () => { onRefresh(); onClose(); },
      finallyFn: () => setBusy(null),
    });
  };

  const stCfg = STATUS_MAP[claim.status] ?? STATUS_MAP.submitted;
  const tyCfg = TYPE_CFG[claim.type];

  const Row = ({ label, value }: { label: string; value?: string | number | null }) =>
    value != null && value !== '' ? (
      <div className="flex justify-between gap-4 py-2 border-b border-brand-border last:border-0">
        <span className="text-xs text-brand-text-muted shrink-0">{label}</span>
        <span className="text-xs text-brand-text text-right">{String(value)}</span>
      </div>
    ) : null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">Claim Details</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5 flex items-center gap-1.5">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', tyCfg.bg, tyCfg.text)}>{tyCfg.label}</span>
              <StatusBadge status={stCfg.status} label={stCfg.label} className="text-[10px]" />
              {claim.isPolicyViolation && (
                <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                  <AlertTriangle className="h-3 w-3" /> Policy violation
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {claim.employee && (
            <div className="flex items-center gap-3 bg-brand-bg-soft rounded-xl px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-brand-primary/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                {claim.employee.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text">{claim.employee.fullName}</p>
                <p className="text-xs text-brand-text-secondary">{claim.employee.department} · {claim.employee.staffNumber}</p>
              </div>
            </div>
          )}

          <div className="bg-brand-bg-soft/50 rounded-xl px-4 py-2">
            <Row label="Amount"       value={fmt(claim.amount, claim.currency)} />
            <Row label="Date"         value={fmtDate(claim.date)} />
            <Row label="Description"  value={claim.description} />
            <Row label="Category"     value={claim.category} />
            <Row label="Notes"        value={claim.notes} />
            {claim.type === 'per_diem' && <>
              <Row label="Destination"   value={claim.destination} />
              <Row label="From"          value={fmtDate(claim.startDate)} />
              <Row label="To"            value={fmtDate(claim.endDate)} />
              <Row label="Days"          value={claim.perDiemDays} />
            </>}
            {claim.type === 'mileage' && <>
              <Row label="From"          value={claim.fromLocation} />
              <Row label="To"            value={claim.toLocation} />
              <Row label="Distance"      value={claim.distanceKm ? `${claim.distanceKm} km` : null} />
              <Row label="Round trip"    value={claim.isRoundTrip ? 'Yes' : 'No'} />
            </>}
            <Row label="Billable"     value={claim.isBillable ? 'Yes' : undefined} />
            <Row label="Submitted"    value={fmtDate(claim.createdAt)} />
            {claim.rejectionReason && (
              <div className="py-2">
                <p className="text-xs text-red-400 font-semibold">Rejection Reason</p>
                <p className="text-xs text-brand-text-secondary mt-1">{claim.rejectionReason}</p>
              </div>
            )}
            {claim.isPolicyViolation && claim.violationReason && (
              <div className="py-2">
                <p className="text-xs text-amber-400 font-semibold">Policy Violation</p>
                <p className="text-xs text-brand-text-secondary mt-1">{claim.violationReason}</p>
              </div>
            )}
          </div>

          {/* Line items (itemized claims) */}
          {claim.type === 'itemized' && claim.items && claim.items.length > 0 && (
            <div className="bg-brand-bg-soft/50 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Line Items</p>
              {claim.items.map(it => (
                <div key={it.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-brand-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs text-brand-text capitalize truncate">{it.categoryName || it.categoryId}</p>
                    {it.description && <p className="text-[11px] text-brand-text-muted truncate">{it.description}</p>}
                    {it.policyViolation && <p className="text-[11px] text-amber-400">{it.policyViolation}</p>}
                  </div>
                  <span className="text-xs font-bold text-brand-text shrink-0">{fmt(it.amount, it.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Approval chain progress */}
          {claim.approvalChain && claim.approvalChain.length > 0 && (
            <div className="bg-brand-bg-soft/50 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Approval Progress</p>
              {claim.approvalChain.map(a => {
                const aStatus = APPROVAL_STATUS_MAP[a.status] ?? 'pending';
                const isCurrent = a.level === claim.currentApprovalLevel && a.status === 'pending';
                return (
                  <div key={a.level} className={cn('flex items-center justify-between gap-3 py-1.5 border-b border-brand-border last:border-0', isCurrent && 'opacity-100')}>
                    <div className="min-w-0">
                      <p className="text-xs text-brand-text truncate">
                        Level {a.level} — {a.approverName || a.approverRole || 'Unassigned'}
                        {isCurrent && <span className="ml-1.5 text-[10px] text-indigo-400 font-bold">CURRENT</span>}
                      </p>
                      {a.comment && <p className="text-[11px] text-brand-text-muted truncate">{a.comment}</p>}
                    </div>
                    <StatusBadge status={aStatus} className="text-[10px] px-2 py-0.5 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Receipt */}
          {claim.receiptFile && (
            <div className="bg-brand-bg-soft/50 rounded-xl px-4 py-3 space-y-3">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Receipt / Evidence</p>
              {/\.(jpg|jpeg|png|webp|gif)$/i.test(claim.receiptFile) ? (
                <img
                  src={`${API_BASE_URL.replace(/\/api$/, '/uploads')}/${claim.receiptFile}?token=${typeof window !== 'undefined' ? sessionStorage.getItem('token') ?? '' : ''}`}
                  alt="Receipt"
                  className="w-full max-h-64 object-contain rounded-lg border border-brand-border bg-white"
                />
              ) : (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-brand-border bg-white/60">
                  <Download className="h-4 w-4 text-brand-text-muted shrink-0" />
                  <span className="text-xs text-brand-text-secondary truncate flex-1">{claim.receiptFile.split('/').pop()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => openFile(`${API_BASE_URL.replace(/\/api$/, '/uploads')}/${claim.receiptFile}`).catch(() => alert('Could not open receipt.'))}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-brand-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-brand-primary-hover/10 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => {
                    const filename = claim.receiptFile!.split('/').pop() ?? 'receipt';
                    downloadFile(`${API_BASE_URL.replace(/\/api$/, '/uploads')}/${claim.receiptFile}`, filename).catch(() => alert('Could not download receipt.'));
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text border border-brand-border-strong px-2.5 py-1.5 rounded-lg hover:bg-brand-bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="px-6 py-4 border-t border-brand-border shrink-0 space-y-2">
          {canApprove && (claim.status === 'submitted' || claim.status === 'disputed') && (
            <>
              {claim.status === 'disputed' && (
                <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 text-xs text-orange-400 mb-1">
                  <MessageSquareWarning className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Employee disputed this rejection. Review and approve or re-reject below.</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => act('approve', `${API_BASE_URL}/expense-claims/${claim._id}/approve`, 'PUT', {})}
                  disabled={busy !== null}
                  className="flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                  {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                </button>
                <button onClick={() => setShowReject(true)}
                  disabled={busy !== null}
                  className="flex items-center justify-center gap-2 h-9 rounded-lg bg-brand-danger hover:bg-brand-danger/90 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                  {busy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} {claim.status === 'disputed' ? 'Re-reject' : 'Reject'}
                </button>
              </div>
            </>
          )}
          {isHR && claim.status === 'approved' && (
            <button onClick={() => act('reimburse', `${API_BASE_URL}/expense-claims/${claim._id}/reimburse`, 'PUT', {})}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {busy === 'reimburse' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Mark as Reimbursed
            </button>
          )}
          {/* Employee: delete own draft/rejected claim */}
          {!isHR && (claim.status === 'draft' || claim.status === 'rejected') && (
            <button onClick={() => {
                if (confirm('Delete this expense claim? This cannot be undone.'))
                  act('delete', `${API_BASE_URL}/expense-claims/${claim._id}`, 'DELETE');
              }}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-red-800 text-red-400 hover:bg-red-500/10 text-sm font-semibold disabled:opacity-50 transition-colors">
              {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete Claim
            </button>
          )}
          {/* Employee: dispute rejected claim */}
          {!isHR && claim.status === 'rejected' && (
            <button onClick={onDisputeClick}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-orange-800 text-orange-400 hover:bg-orange-500/10 text-sm font-semibold transition-colors">
              <MessageSquareWarning className="h-4 w-4" /> Dispute Rejection
            </button>
          )}
        </div>
      </div>
    </div>
    {showReject && (
      <RejectClaimModal
        onClose={() => setShowReject(false)}
        onConfirm={reason => { setShowReject(false); act('reject', `${API_BASE_URL}/expense-claims/${claim._id}/reject`, 'PUT', { reason }); }}
      />
    )}
    </>
  );
}

// ── Edit Claim Drawer ─────────────────────────────────────────────────────────

function EditClaimDrawer({ claim, onClose, onSaved }: { claim: ExpenseClaim; onClose: () => void; onSaved: () => void }) {
  const [amount,      setAmount]      = useState(String(claim.amount ?? ''));
  const [description, setDescription] = useState(claim.description ?? '');
  const [category,    setCategory]    = useState(claim.category ?? '');
  const [date,        setDate]        = useState(claim.date ? claim.date.slice(0, 10) : '');
  const [notes,       setNotes]       = useState(claim.notes ?? '');
  const [saving,      setSaving]      = useState(false);

  const handleSave = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/expense-claims/${claim._id}`,
      method: 'PUT',
      data: { amount: Number(amount), description, category, date, notes },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">Edit Claim</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Amount ({claim.currency})</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="">No category</option>
              {CATEGORIES.map(c => <option key={c} value={c.toLowerCase().replace(' ','_')}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes…"
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <p className="text-[11px] text-brand-text-muted">Only amount, date, category, description and notes can be changed. Other fields are locked after submission.</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabKey = 'my' | 'team' | 'all' | 'analytics' | 'policy';

export default function ExpensesPage() {
  const { isHR, isDeptHead, userData } = useAuth();
  const isManager = isHR || isDeptHead;
  const myEmployeeId = userData?.employeeId ?? null;
  const canApprove = (c: ExpenseClaim) =>
    isManager || (c.approvalChain ?? []).some(a =>
      a.level === c.currentApprovalLevel && a.status === 'pending' && myEmployeeId && String(a.approverId) === String(myEmployeeId));
  const [tab,        setTab]        = useState<TabKey>('my');
  const [claims,     setClaims]     = useState<ExpenseClaim[]>([]);
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [submitOpen,     setSubmitOpen]     = useState(false);
  const [rejectingClaim, setRejectingClaim]  = useState<ExpenseClaim | null>(null);
  const [detailClaim,    setDetailClaim]     = useState<ExpenseClaim | null>(null);
  const [editingClaim,   setEditingClaim]    = useState<ExpenseClaim | null>(null);
  const [disputingClaim, setDisputingClaim]  = useState<ExpenseClaim | null>(null);
  const [deletingId,     setDeletingId]      = useState<string | null>(null);

  const fetchClaims = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (tab === 'team' || tab === 'all') params.all = 'true';
    apiCallFunction<any>({ url: `${API_BASE_URL}/expense-claims`, params, showToast: false,
      thenFn: r => { setClaims(r.data?.data ?? []); setStats(r.data?.stats ?? null); },
      finallyFn: () => setLoading(false),
    });
  }, [tab, status]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const approve   = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/expense-claims/${id}/approve`, method: 'PUT', data: {}, thenFn: fetchClaims });
  const doReject  = (id: string, reason: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims/${id}/reject`, method: 'PUT', data: { reason }, thenFn: fetchClaims });
    setRejectingClaim(null);
  };
  const doDelete  = (id: string) => {
    if (!confirm('Delete this expense claim? This cannot be undone.')) return;
    setDeletingId(id);
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims/${id}`, method: 'DELETE',
      thenFn: fetchClaims, finallyFn: () => setDeletingId(null) });
  };
  const doReimburse = (id: string) =>
    apiCallFunction({ url: `${API_BASE_URL}/expense-claims/${id}/reimburse`, method: 'PUT', data: {}, thenFn: fetchClaims });

  const filtered = claims.filter(c => !search || c.description?.toLowerCase().includes(search.toLowerCase()) || c.employee?.fullName?.toLowerCase().includes(search.toLowerCase()));

  const tabs = ([
    { key: 'my',        label: 'My Expenses',   show: true       },
    { key: 'team',      label: 'Team Expenses',  show: isManager  },
    { key: 'all',       label: 'All Expenses',   show: isHR       },
    { key: 'analytics', label: 'Analytics',      show: isHR       },
    { key: 'policy',    label: 'Policy',         show: isHR       },
  ].filter(t => t.show)) as { key: TabKey; label: string; show: boolean }[];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="text-xl font-black text-brand-text tracking-tight">Expenses</h1>
              <p className="text-xs text-brand-text-secondary mt-0.5">Submit and manage expense claims</p>
            </div>
            <div className="flex items-center gap-2">
              {isHR && <button onClick={() => downloadFile(`${API_BASE_URL}/expense-claims/export`, 'expenses-export.csv').catch(err => alert(err.message))} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold transition-colors"><Download className="h-4 w-4" /> Export</button>}
              <button onClick={() => setSubmitOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors"><Plus className="h-4 w-4" /> Submit Expense</button>
            </div>
          </div>
          {/* Stats (HR only) */}
          {stats && isHR && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Pending Approval', value: `${stats.pendingCount} claims`, sub: fmt(stats.pendingTotal), color: 'text-amber-600' },
                { label: 'Approved This Month', value: `${stats.approvedCount} claims`, sub: fmt(stats.approvedTotal), color: 'text-emerald-600' },
                { label: 'Policy Violations', value: String(stats.violations), sub: '', color: stats.violations > 0 ? 'text-red-400' : 'text-brand-text-secondary' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl px-4 py-3">
                  <p className="text-[11px] text-brand-text-muted uppercase tracking-wide">{label}</p>
                  <p className={cn('text-base font-bold mt-0.5', color)}>{value}</p>
                  {sub && <p className="text-xs text-brand-text-muted mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          )}
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {tabs.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn('px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all border-b-2',
                  tab === key ? 'text-indigo-300 border-brand-primary bg-white/60' : 'text-brand-text-muted border-transparent hover:text-brand-text-secondary hover:bg-brand-bg-soft/40')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 'analytics' ? <AnalyticsTab /> :
         tab === 'policy'    ? <PolicyTab />    : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…" className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">All Statuses</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {(search || status) && <button onClick={() => { setSearch(''); setStatus(''); }} className="flex items-center gap-1 text-xs text-brand-text-muted hover:text-brand-text-secondary px-2 py-1 rounded-lg hover:bg-brand-bg-soft transition-colors"><X className="h-3.5 w-3.5" /> Clear</button>}
              <span className="text-xs text-brand-text-muted ml-auto self-center">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
              <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '80px 1fr 100px 120px 100px 120px 80px 140px' }}>
                {['Date','Description','Type','Category','Amount','Employee','Status','Actions'].map(h => (
                  <div key={h} className="px-3 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
                ))}
              </div>
              {loading ? (
                <div className="py-16 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-brand-text-secondary text-sm font-semibold">No expenses found</p>
                  <button onClick={() => setSubmitOpen(true)} className="mt-3 text-indigo-400 text-xs underline">Submit your first expense</button>
                </div>
              ) : filtered.map(c => {
                const stCfg = STATUS_MAP[c.status] ?? STATUS_MAP.submitted;
                const tyCfg = TYPE_CFG[c.type];
                return (
                  <div key={c._id} style={{ gridTemplateColumns: '80px 1fr 100px 120px 100px 120px 80px 140px' }}
                    className="grid border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors items-center">
                    <div className="px-3 py-3 text-xs text-brand-text-secondary">{fmtDate(c.date)}</div>
                    <div className="px-3 py-3">
                      <p className="text-sm font-medium text-brand-text truncate flex items-center gap-1">
                        {c.isPolicyViolation && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                        {c.description ?? c.destination ?? (c.type === 'itemized' ? `${c.items?.length ?? 0} line items` : c.distanceKm != null ? `${c.distanceKm}km trip` : '—')}
                      </p>
                      {c.notes && <p className="text-[10px] text-brand-text-muted truncate">{c.notes}</p>}
                    </div>
                    <div className="px-3 py-3"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tyCfg.bg, tyCfg.text)}>{tyCfg.label}</span></div>
                    <div className="px-3 py-3 text-xs text-brand-text-secondary capitalize">{c.category ?? '—'}</div>
                    <div className="px-3 py-3 text-sm font-bold text-brand-text">{fmt(c.amount, c.currency)}</div>
                    <div className="px-3 py-3 text-xs text-brand-text-secondary truncate">{c.employee?.fullName ?? 'You'}</div>
                    <div className="px-3 py-3"><StatusBadge status={stCfg.status} label={stCfg.label} className="text-[10px]" /></div>
                    <div className="px-3 py-3 flex items-center gap-1 flex-wrap">
                      {/* View */}
                      <button title="View details" onClick={() => setDetailClaim(c)}
                        className="h-7 w-7 rounded-lg bg-brand-bg-muted flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-border-strong transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {/* Approve / Reject */}
                      {canApprove(c) && (c.status === 'submitted' || c.status === 'disputed') && (
                        <>
                          <button title="Approve" onClick={() => approve(c._id)}
                            className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button title="Reject" onClick={() => setRejectingClaim(c)}
                            className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {/* Mark reimbursed */}
                      {isHR && c.status === 'approved' && (
                        <button title="Mark as reimbursed" onClick={() => doReimburse(c._id)}
                          className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 hover:bg-violet-500/20 transition-colors">
                          <Banknote className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {/* Employee: delete own draft/rejected claim */}
                      {!isHR && (c.status === 'draft' || c.status === 'rejected') && (
                        <button title="Delete claim" onClick={() => doDelete(c._id)} disabled={deletingId === c._id}
                          className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                          {deletingId === c._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      {/* Employee: dispute rejected claim */}
                      {!isHR && c.status === 'rejected' && (
                        <button title="Dispute rejection" onClick={() => setDisputingClaim(c)}
                          className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 transition-colors">
                          <MessageSquareWarning className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {submitOpen && <SubmitDrawer onClose={() => setSubmitOpen(false)} onSaved={fetchClaims} />}
      {rejectingClaim && (
        <RejectClaimModal
          onClose={() => setRejectingClaim(null)}
          onConfirm={reason => doReject(rejectingClaim._id, reason)}
        />
      )}
      {detailClaim && (
        <ClaimDetailDrawer
          claim={detailClaim}
          isHR={isHR}
          canApprove={canApprove(detailClaim)}
          onClose={() => setDetailClaim(null)}
          onRefresh={fetchClaims}
          onDisputeClick={() => { setDisputingClaim(detailClaim); setDetailClaim(null); }}
        />
      )}
      {disputingClaim && (
        <DisputeClaimModal
          claim={disputingClaim}
          onClose={() => setDisputingClaim(null)}
          onSaved={fetchClaims}
        />
      )}
      {editingClaim && (
        <EditClaimDrawer
          claim={editingClaim}
          onClose={() => setEditingClaim(null)}
          onSaved={fetchClaims}
        />
      )}
    </div>
  );
}
