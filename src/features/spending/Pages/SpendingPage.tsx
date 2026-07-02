'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  CreditCard, FileText, ShoppingCart, Landmark,
  Plus, X, CheckCircle2, AlertCircle, Search,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Card {
  _id: string;
  last4: string;
  cardHolder: string;
  creditLimit?: number;
  currency: string;
  expiryDate?: string;
  network: string;
  status: string;
  totalSpent: number;
  employee?: { fullName: string; department: string } | null;
}

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  vendor: string;
  amount: number;
  currency: string;
  dueDate: string;
  description?: string;
  status: string;
  type: string;
  createdAt: string;
}

interface PurchaseRequest {
  _id: string;
  title: string;
  estimatedCost: number;
  currency: string;
  priority: string;
  status: string;
  department?: string;
  neededBy?: string;
  createdAt: string;
  requester?: { fullName: string; department: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-400',
  inactive:  'bg-slate-600/40 text-slate-400',
  blocked:   'bg-red-500/20 text-red-400',
  pending:   'bg-amber-500/20 text-amber-400',
  approved:  'bg-emerald-500/20 text-emerald-400',
  rejected:  'bg-red-500/20 text-red-400',
  paid:      'bg-blue-500/20 text-blue-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high:   'bg-amber-500/20 text-amber-400',
  normal: 'bg-slate-600/40 text-slate-300',
  low:    'bg-slate-700/40 text-slate-500',
};

const TABS = [
  { key: 'cards',        label: 'Corporate Cards', icon: CreditCard },
  { key: 'invoices',     label: 'Invoices',        icon: FileText },
  { key: 'procurement',  label: 'Procurement',     icon: ShoppingCart },
  { key: 'payable',      label: 'Accounts Payable', icon: Landmark },
];

// ── Card Chip ─────────────────────────────────────────────────────────────────
function CardChip({ card }: { card: Card }) {
  const utilPct = card.creditLimit ? (card.totalSpent / card.creditLimit) * 100 : 0;
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{card.network.toUpperCase()}</p>
          <p className="font-bold text-white text-lg tracking-widest mt-0.5">•••• •••• •••• {card.last4}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[card.status]}`}>
          {card.status}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-400">{card.cardHolder}</p>
        {card.employee && <p className="text-xs text-slate-500">{card.employee.department}</p>}
      </div>
      {card.creditLimit ? (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Spent: {fmt(card.totalSpent, card.currency)}</span>
            <span className="text-slate-400">Limit: {fmt(card.creditLimit, card.currency)}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${utilPct >= 90 ? 'bg-red-500' : utilPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(utilPct, 100)}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Total spent: {fmt(card.totalSpent, card.currency)}</p>
      )}
      {card.expiryDate && (
        <p className="text-xs text-slate-500">Expires {fmtDate(card.expiryDate)}</p>
      )}
    </div>
  );
}

// ── Create Card Modal ─────────────────────────────────────────────────────────
function CreateCardModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ last4: '', cardHolder: '', creditLimit: '', currency: 'KES', network: 'visa', expiryDate: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.last4 || !form.cardHolder) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/cards`,
      method: 'POST',
      data: { ...form, creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">Add Corporate Card</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: 'Last 4 Digits', key: 'last4', placeholder: '1234', maxLength: 4 },
            { label: 'Card Holder Name', key: 'cardHolder', placeholder: 'John Doe' },
            { label: 'Credit Limit', key: 'creditLimit', placeholder: 'Optional' },
          ].map(({ label, key, placeholder, maxLength }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder} maxLength={maxLength}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Network</label>
              <select value={form.network} onChange={e => set('network', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                {['visa', 'mastercard', 'amex', 'other'].map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.last4 || !form.cardHolder}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Invoice Modal ──────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ vendor: '', amount: '', currency: 'KES', dueDate: '', description: '', invoiceNumber: '', type: 'accounts_payable' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.vendor || !form.amount || !form.dueDate) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/invoices`,
      method: 'POST',
      data: { ...form, amount: Number(form.amount) },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">New Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vendor <span className="text-red-400">*</span></label>
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Vendor name"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Invoice No.</label>
              <input value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} placeholder="INV-001"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Amount <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Invoice description"
              className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500">
              <option value="accounts_payable">Accounts Payable</option>
              <option value="accounts_receivable">Accounts Receivable</option>
              <option value="project">Project Invoice</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.vendor || !form.amount || !form.dueDate}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Purchase Request Modal ─────────────────────────────────────────────
function CreatePRModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', estimatedCost: '', currency: 'KES', priority: 'normal', vendor: '', department: '', neededBy: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.title || !form.estimatedCost) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement`,
      method: 'POST',
      data: { ...form, estimatedCost: Number(form.estimatedCost) },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">New Purchase Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What do you need?"
              className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Justification / details"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Estimated Cost <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={form.estimatedCost} onChange={e => set('estimatedCost', e.target.value)} placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                {['urgent', 'high', 'normal', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vendor</label>
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Preferred vendor"
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Needed By</label>
              <input type="date" value={form.neededBy} onChange={e => set('neededBy', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.title || !form.estimatedCost}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ title, onClose, onConfirm }: { title: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">Reject — {title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs text-slate-400 mb-1">Reason <span className="text-red-400">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Explain why this is being rejected…"
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 resize-none" />
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
          <button disabled={!reason.trim() || saving} onClick={() => { setSaving(true); onConfirm(reason.trim()); }}
            className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
            {saving ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mark Paid Modal ───────────────────────────────────────────────────────────
function MarkPaidModal({ invoice, onClose, onPaid }: { invoice: Invoice; onClose: () => void; onPaid: () => void }) {
  const [ref, setRef] = useState('');
  const [saving, setSaving] = useState(false);
  const confirm = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/invoices/${invoice._id}/pay`,
      method: 'PUT',
      data: { paymentReference: ref.trim() || undefined },
      thenFn: () => { onPaid(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white">Mark as Paid</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">{invoice.vendor}</span>
            {invoice.invoiceNumber && <span className="text-slate-400"> · #{invoice.invoiceNumber}</span>}
            <span className="block text-slate-400 text-xs mt-0.5">{fmt(invoice.amount, invoice.currency)}</span>
          </p>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Reference <span className="text-slate-500">(optional)</span></label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Bank ref, cheque no., M-Pesa code…"
              className="w-full h-9 px-3 text-sm bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-600 text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={confirm} disabled={saving}
            className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cards Tab ─────────────────────────────────────────────────────────────────
function CardsTab() {
  const [cards, setCards]       = useState<Card[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/spending/cards`,
      showToast: false,
      thenFn: r => setCards(r?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cards.length} cards</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> Add Card
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map(c => <CardChip key={c._id} card={c} />)}
          {cards.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-500">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No corporate cards yet.</p>
            </div>
          )}
        </div>
      )}
      {showCreate && <CreateCardModal onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────
function InvoicesTab() {
  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [stats, setStats]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [rejectingInvoice, setRejectingInvoice] = useState<Invoice | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/spending/invoices?${params}`,
      showToast: false,
      thenFn: r => { setInvoices(r?.data?.data ?? []); setStats(r?.data?.stats ?? []); },
      finallyFn: () => setLoading(false),
    });
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/spending/invoices/${id}/approve`, method: 'PUT', thenFn: load });
  };
  const rejectInvoice = (reason: string) => {
    if (!rejectingInvoice) return;
    apiCallFunction({ url: `${API_BASE_URL}/spending/invoices/${rejectingInvoice._id}/reject`, method: 'PUT', data: { reason }, thenFn: () => { load(); setRejectingInvoice(null); } });
  };

  const overdueDate  = new Date();

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s._id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400 capitalize mb-1">{s._id}</p>
            <p className="font-bold text-white">{fmt(s.total)}</p>
            <p className="text-xs text-slate-500">{s.count} invoices</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or invoice #…"
            className="w-full pl-9 pr-3 h-9 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'paid', 'rejected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Vendor</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {invoices.map(inv => {
                const isOverdue = inv.status === 'pending' && new Date(inv.dueDate) < overdueDate;
                return (
                  <tr key={inv._id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-slate-300 font-mono text-xs">{inv.invoiceNumber || '—'}</p>
                      {inv.description && <p className="text-xs text-slate-500 truncate max-w-xs">{inv.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-white">{inv.vendor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}>{fmtDate(inv.dueDate)}</span>
                      {isOverdue && <p className="text-xs text-red-400">Overdue</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === 'pending' && (
                          <>
                            <button onClick={() => approve(inv._id)}
                              className="h-7 px-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => setRejectingInvoice(inv)}
                              className="h-7 px-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                              Reject
                            </button>
                          </>
                        )}
                        {inv.status === 'approved' && (
                          <button onClick={() => setPayingInvoice(inv)}
                            className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {payingInvoice && <MarkPaidModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} onPaid={load} />}
      {rejectingInvoice && <RejectModal title={rejectingInvoice.vendor} onClose={() => setRejectingInvoice(null)} onConfirm={rejectInvoice} />}
    </div>
  );
}

// ── Procurement Tab ───────────────────────────────────────────────────────────
function ProcurementTab() {
  const [requests, setRequests]   = useState<PurchaseRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [rejectingPR, setRejectingPR] = useState<PurchaseRequest | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/spending/procurement?${params}`,
      showToast: false,
      thenFn: r => setRequests(r?.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/${id}/approve`, method: 'PUT', thenFn: load });
  };
  const reject = (reason: string) => {
    if (!rejectingPR) return;
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/${rejectingPR._id}/reject`, method: 'PUT', data: { reason }, thenFn: () => { load(); setRejectingPR(null); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'rejected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(pr => (
            <div key={pr._id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[pr.priority]}`}>
                      {pr.priority}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[pr.status]}`}>
                      {pr.status}
                    </span>
                  </div>
                  <p className="font-semibold text-white">{pr.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pr.requester?.fullName ?? 'Unknown'} · {pr.requester?.department ?? pr.department ?? '—'}
                    {pr.neededBy && ` · Needed by ${fmtDate(pr.neededBy)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-white">{fmt(pr.estimatedCost, pr.currency)}</p>
                  {pr.status === 'pending' && (
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => approve(pr._id)}
                        className="h-7 px-2.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                        Approve
                      </button>
                      <button onClick={() => setRejectingPR(pr)}
                        className="h-7 px-2.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No purchase requests yet.</p>
            </div>
          )}
        </div>
      )}
      {showCreate && <CreatePRModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {rejectingPR && <RejectModal title={rejectingPR.title} onClose={() => setRejectingPR(null)} onConfirm={reject} />}
    </div>
  );
}

// ── Accounts Payable Tab ──────────────────────────────────────────────────────
function AccountsPayableTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/spending/invoices?type=accounts_payable`,
      showToast: false,
      thenFn: r => setInvoices(r?.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const totalPending  = invoices.filter(i => i.status === 'pending' || i.status === 'approved').reduce((s, i) => s + i.amount, 0);
  const totalOverdue  = invoices.filter(i => i.status !== 'paid' && new Date(i.dueDate) < new Date()).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-400">{fmt(totalPending)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalOverdue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.filter(i => i.status !== 'paid').map(inv => {
            const isOverdue = new Date(inv.dueDate) < new Date();
            return (
              <div key={inv._id} className={`bg-slate-800 border rounded-xl px-4 py-3 flex items-center gap-3 ${isOverdue ? 'border-red-500/30' : 'border-slate-700'}`}>
                {isOverdue && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{inv.vendor}</p>
                  <p className="text-xs text-slate-400">{inv.invoiceNumber || 'No ref'} · Due {fmtDate(inv.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{fmt(inv.amount, inv.currency)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                </div>
              </div>
            );
          })}
          {invoices.filter(i => i.status !== 'paid').length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-50" />
              <p className="text-sm">All invoices paid. Good work!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SpendingPage() {
  const [tab, setTab] = useState('cards');

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Spending</h1>
        <p className="text-sm text-slate-400 mt-0.5">Corporate cards, invoices, procurement, and accounts payable</p>
      </div>

      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'cards'       && <CardsTab />}
      {tab === 'invoices'    && <InvoicesTab />}
      {tab === 'procurement' && <ProcurementTab />}
      {tab === 'payable'     && <AccountsPayableTab />}
    </div>
  );
}
