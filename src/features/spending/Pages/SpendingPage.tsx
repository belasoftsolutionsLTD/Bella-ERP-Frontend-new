'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
  CreditCard, FileText, ShoppingCart, Landmark, Building2, PackageCheck, ReceiptText,
  Plus, X, Check, CheckCircle2, AlertCircle, Search, Send, Truck, Ban, ArrowRightLeft, Pencil, Trash2,
} from 'lucide-react';
import { statusClasses, statusLabel, type Status } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

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

interface ApprovalChainEntry {
  level: number; approverId?: string; approverName?: string; approverRole?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actedAt?: string; comment?: string; thresholdAmount?: number;
}

interface RequisitionItem {
  id?: string; description: string; quantity: number; estimatedUnitPrice: number; specifications?: string;
}

interface PurchaseRequest {
  _id: string;
  title: string;
  description?: string;
  justification?: string;
  estimatedCost: number;
  currency: string;
  priority: string;
  status: string;
  department?: string;
  neededBy?: string;
  createdAt: string;
  vendor?: string;
  vendorId?: string;
  items?: RequisitionItem[];
  approvalChain?: ApprovalChainEntry[];
  currentApprovalLevel?: number;
  convertedToPOId?: string;
  requester?: { fullName: string; department: string } | null;
}

interface Vendor {
  _id: string; name: string; contactName?: string; email?: string; phone?: string;
  address?: string; category: string; type?: 'company' | 'individual'; taxId?: string; paymentTerms?: string;
  status: string; notes?: string;
}

interface POItem {
  id: string; description: string; quantity: number; unitPrice: number; currency: string; receivedQuantity: number; specifications?: string;
}

interface PurchaseOrder {
  _id: string; poNumber: string; requisitionId?: string; vendorId: string; departmentId?: string;
  status: string; items: POItem[]; totalAmount: number; currency: string;
  deliveryAddress?: string; expectedDeliveryDate?: string; actualDeliveryDate?: string;
  paymentTerms?: string; notes?: string; invoiceId?: string; createdAt: string;
  vendor?: { name: string; category: string } | null;
}

interface VendorInvoiceItem { description: string; quantity: number; unitPrice: number; totalPrice: number; }

interface VendorInvoice {
  _id: string; purchaseOrderId: string; vendorId: string; invoiceNumber: string;
  invoiceDate: string; dueDate: string; items: VendorInvoiceItem[]; totalAmount: number; currency: string;
  status: string; threeWayMatchStatus: string; discrepancyNotes?: string;
  approvedAt?: string; paidAt?: string; createdAt: string;
  vendor?: { name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n: number, cur = 'KES') => `${cur} ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-400',
  inactive:  'bg-slate-600/40 text-brand-text-secondary',
  blocked:   'bg-red-500/20 text-red-400',
  blacklisted: 'bg-red-500/20 text-red-400',
  pending:   'bg-amber-500/20 text-amber-400',
  pending_approval: 'bg-amber-500/20 text-amber-400',
  approved:  'bg-emerald-500/20 text-emerald-400',
  rejected:  'bg-red-500/20 text-red-400',
  paid:      'bg-blue-500/20 text-blue-400',
  draft:     'bg-slate-600/40 text-brand-text-secondary',
  sent:      'bg-cyan-500/20 text-cyan-400',
  acknowledged: 'bg-brand-primary/20 text-indigo-400',
  partiallyReceived: 'bg-amber-500/20 text-amber-400',
  fullyReceived: 'bg-emerald-500/20 text-emerald-400',
  invoiced:  'bg-violet-500/20 text-violet-400',
  cancelled: 'bg-red-500/20 text-red-400',
  converted: 'bg-violet-500/20 text-violet-400',
  received:  'bg-slate-600/40 text-brand-text-secondary',
  underReview: 'bg-amber-500/20 text-amber-400',
  matched:   'bg-emerald-500/20 text-emerald-400',
  mismatched: 'bg-red-500/20 text-red-400',
  disputed:  'bg-orange-500/20 text-orange-400',
  complete:  'bg-emerald-500/20 text-emerald-400',
  partial:   'bg-amber-500/20 text-amber-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high:   'bg-amber-500/20 text-amber-400',
  normal: 'bg-slate-600/40 text-brand-text-secondary',
  low:    'bg-brand-bg-muted/40 text-brand-text-muted',
};

const APPROVAL_STATUS_MAP: Record<ApprovalChainEntry['status'], Status> = {
  pending: 'pending', approved: 'approved', rejected: 'rejected', skipped: 'inactive',
};

const TABS = [
  { key: 'cards',            label: 'Corporate Cards', icon: CreditCard,  hrOnly: true  },
  { key: 'invoices',         label: 'AP/AR Invoices',  icon: FileText,    hrOnly: true  },
  { key: 'procurement',      label: 'Procurement',     icon: ShoppingCart, hrOnly: false },
  { key: 'vendors',          label: 'Vendors',         icon: Building2,   hrOnly: true  },
  { key: 'purchase-orders',  label: 'Purchase Orders', icon: PackageCheck, hrOnly: false, deptHeadUp: true },
  { key: 'vendor-invoices',  label: 'Vendor Invoices', icon: ReceiptText, hrOnly: true  },
  { key: 'payable',          label: 'Accounts Payable', icon: Landmark,   hrOnly: true  },
];

// ── Card Chip ─────────────────────────────────────────────────────────────────
function CardChip({ card }: { card: Card }) {
  const utilPct = card.creditLimit ? (card.totalSpent / card.creditLimit) * 100 : 0;
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-brand-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-brand-text-muted font-medium uppercase tracking-wide">{card.network.toUpperCase()}</p>
          <p className="font-bold text-white text-lg tracking-widest mt-0.5">•••• •••• •••• {card.last4}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[card.status]}`}>
          {card.status}
        </span>
      </div>
      <div>
        <p className="text-sm text-brand-text-secondary">{card.cardHolder}</p>
        {card.employee && <p className="text-xs text-brand-text-muted">{card.employee.department}</p>}
      </div>
      {card.creditLimit ? (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-brand-text-secondary">Spent: {fmt(card.totalSpent, card.currency)}</span>
            <span className="text-brand-text-secondary">Limit: {fmt(card.creditLimit, card.currency)}</span>
          </div>
          <div className="h-1.5 bg-brand-bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${utilPct >= 90 ? 'bg-red-500' : utilPct >= 70 ? 'bg-amber-500' : 'bg-brand-primary'}`}
              style={{ width: `${Math.min(utilPct, 100)}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-brand-text-muted">Total spent: {fmt(card.totalSpent, card.currency)}</p>
      )}
      {card.expiryDate && (
        <p className="text-xs text-brand-text-muted">Expires {fmtDate(card.expiryDate)}</p>
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
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-bold text-white">Add Corporate Card</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: 'Last 4 Digits', key: 'last4', placeholder: '1234', maxLength: 4 },
            { label: 'Card Holder Name', key: 'cardHolder', placeholder: 'John Doe' },
            { label: 'Credit Limit', key: 'creditLimit', placeholder: 'Optional' },
          ].map(({ label, key, placeholder, maxLength }) => (
            <div key={key}>
              <label className="block text-xs text-brand-text-secondary mb-1">{label}</label>
              <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder} maxLength={maxLength}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Network</label>
              <select value={form.network} onChange={e => set('network', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
                {['visa', 'mastercard', 'amex', 'other'].map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.last4 || !form.cardHolder}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
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
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-bold text-white">New Invoice</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Vendor <span className="text-red-400">*</span></label>
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Vendor name"
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Invoice No.</label>
              <input value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} placeholder="INV-001"
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Amount <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Due Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Invoice description"
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
              <option value="accounts_payable">Accounts Payable</option>
              <option value="accounts_receivable">Accounts Receivable</option>
              <option value="project">Project Invoice</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.vendor || !form.amount || !form.dueDate}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Purchase Request Modal ─────────────────────────────────────────────
function CreatePRModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', justification: '', currency: 'KES', priority: 'normal', vendorId: '', neededBy: '' });
  const [items, setItems] = useState<RequisitionItem[]>([{ description: '', quantity: 1, estimatedUnitPrice: 0 }]);
  const [manualCost, setManualCost] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement/vendors?status=active`, showToast: false,
      thenFn: r => setVendors(r?.data ?? []) });
  }, []);

  const addItem    = () => setItems(prev => [...prev, { description: '', quantity: 1, estimatedUnitPrice: 0 }]);
  const removeItem  = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem  = (i: number, field: keyof RequisitionItem, value: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: field === 'description' || field === 'specifications' ? value : Number(value) } : it));

  const validItems  = items.filter(it => it.description.trim() && it.quantity > 0);
  const itemsTotal  = validItems.reduce((s, it) => s + it.quantity * it.estimatedUnitPrice, 0);
  const estimatedCost = validItems.length ? itemsTotal : Number(manualCost) || 0;

  const save = () => {
    if (!form.title || !estimatedCost) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement`,
      method: 'POST',
      data: { ...form, estimatedCost, items: validItems, vendorId: form.vendorId || undefined },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="font-bold text-white">New Purchase Request</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What do you need?"
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="What this is for"
              className="w-full px-3 py-2 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Justification</label>
            <textarea value={form.justification} onChange={e => set('justification', e.target.value)} rows={2}
              placeholder="Why is this needed / business case"
              className="w-full px-3 py-2 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Vendor</label>
              <select value={form.vendorId} onChange={e => set('vendorId', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
                <option value="">No preferred vendor</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
                {['urgent', 'high', 'normal', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Needed By</label>
            <input type="date" value={form.neededBy} onChange={e => set('neededBy', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-brand-text-secondary">Line Items (optional — leave blank to enter a lump sum)</label>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_90px_auto] gap-2 items-center">
                <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description"
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty"
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary" />
                <input type="number" min="0" value={it.estimatedUnitPrice || ''} onChange={e => updateItem(i, 'estimatedUnitPrice', e.target.value)} placeholder="Unit price"
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary" />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                  className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 flex items-center justify-center transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>

          {validItems.length === 0 && (
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Estimated Cost <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={manualCost} onChange={e => setManualCost(e.target.value)} placeholder="0.00"
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          )}
          {estimatedCost > 0 && (
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 py-3 text-sm text-indigo-300 font-semibold">
              Total: <span className="text-lg font-black">{fmt(estimatedCost, form.currency)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.title || !estimatedCost}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
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
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-bold text-white">Reject — {title}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs text-brand-text-secondary mb-1">Reason <span className="text-red-400">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Explain why this is being rejected…"
            className="w-full px-3 py-2 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-red-500 resize-none" />
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
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
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-bold text-white">Mark as Paid</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-brand-text-secondary">
            <span className="font-semibold text-white">{invoice.vendor}</span>
            {invoice.invoiceNumber && <span className="text-brand-text-secondary"> · #{invoice.invoiceNumber}</span>}
            <span className="block text-brand-text-secondary text-xs mt-0.5">{fmt(invoice.amount, invoice.currency)}</span>
          </p>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Payment Reference <span className="text-brand-text-muted">(optional)</span></label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Bank ref, cheque no., M-Pesa code…"
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
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
        <p className="text-sm text-brand-text-secondary">{cards.length} cards</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> Add Card
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map(c => <CardChip key={c._id} card={c} />)}
          {cards.length === 0 && (
            <div className="col-span-3 text-center py-12 text-brand-text-muted">
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
          <div key={s._id} className="bg-brand-bg-soft rounded-xl p-3 border border-brand-border">
            <p className="text-xs text-brand-text-secondary capitalize mb-1">{s._id}</p>
            <p className="font-bold text-white">{fmt(s.total)}</p>
            <p className="text-xs text-brand-text-muted">{s.count} invoices</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or invoice #…"
            className="w-full pl-9 pr-3 h-9 text-sm bg-brand-bg-soft border border-brand-border rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-primary">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'paid', 'rejected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-brand-bg-soft rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-xs text-brand-text-muted uppercase">
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Vendor</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {invoices.map(inv => {
                const isOverdue = inv.status === 'pending' && new Date(inv.dueDate) < overdueDate;
                return (
                  <tr key={inv._id} className="hover:bg-brand-bg-soft transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-brand-text-secondary font-mono text-xs">{inv.invoiceNumber || '—'}</p>
                      {inv.description && <p className="text-xs text-brand-text-muted truncate max-w-xs">{inv.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-white">{inv.vendor}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={isOverdue ? 'text-red-400 font-medium' : 'text-brand-text-secondary'}>{fmtDate(inv.dueDate)}</span>
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
                  <td colSpan={6} className="px-4 py-10 text-center text-brand-text-muted">No invoices found.</td>
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
// ── Convert Requisition to PO Modal ───────────────────────────────────────────
function ConvertToPOModal({ pr, onClose, onSaved }: { pr: PurchaseRequest; onClose: () => void; onSaved: () => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState(pr.vendorId ?? '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement/vendors?status=active`, showToast: false,
      thenFn: r => setVendors(r?.data ?? []) });
  }, []);

  const convert = () => {
    if (!vendorId) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement/${pr._id}/convert`, method: 'POST',
      data: { vendorId, expectedDeliveryDate: expectedDeliveryDate || undefined, deliveryAddress: deliveryAddress || undefined },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-bold text-white">Convert to Purchase Order</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-brand-text-secondary">{pr.title} — <span className="font-semibold">{fmt(pr.estimatedCost, pr.currency)}</span></p>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Vendor <span className="text-red-400">*</span></label>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
              <option value="">Select vendor…</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Expected Delivery Date</label>
            <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Delivery Address</label>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Optional"
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={convert} disabled={saving || !vendorId}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Converting…' : 'Convert to PO'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalChainStrip({ chain, currentLevel }: { chain: ApprovalChainEntry[]; currentLevel?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {chain.map(a => {
        const st = APPROVAL_STATUS_MAP[a.status] ?? 'pending';
        const isCurrent = a.level === currentLevel && a.status === 'pending';
        return (
          <span key={a.level} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusClasses(st), isCurrent && 'ring-1 ring-indigo-400')}>
            L{a.level} {a.approverName || a.approverRole || '—'} · {statusLabel(st)}
          </span>
        );
      })}
    </div>
  );
}

function ProcurementTab() {
  const { isHR, isDeptHead, userData } = useAuth();
  const isManager = isHR || isDeptHead;
  const myEmployeeId = userData?.employeeId ?? null;
  const [requests, setRequests]   = useState<PurchaseRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [rejectingPR, setRejectingPR] = useState<PurchaseRequest | null>(null);
  const [convertingPR, setConvertingPR] = useState<PurchaseRequest | null>(null);

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

  const canApprove = (pr: PurchaseRequest) =>
    isManager || (pr.approvalChain ?? []).some(a =>
      a.level === pr.currentApprovalLevel && a.status === 'pending' && myEmployeeId && String(a.approverId) === String(myEmployeeId));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-primary">
          <option value="">All Statuses</option>
          {['pending', 'approved', 'rejected', 'converted'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(pr => (
            <div key={pr._id} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-4">
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
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    {pr.requester?.fullName ?? 'Unknown'} · {pr.requester?.department ?? pr.department ?? '—'}
                    {pr.neededBy && ` · Needed by ${fmtDate(pr.neededBy)}`}
                  </p>
                  {pr.justification && <p className="text-xs text-brand-text-muted mt-1 italic">"{pr.justification}"</p>}
                  {pr.approvalChain && pr.approvalChain.length > 0 && (
                    <ApprovalChainStrip chain={pr.approvalChain} currentLevel={pr.currentApprovalLevel} />
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-white">{fmt(pr.estimatedCost, pr.currency)}</p>
                  {pr.status === 'pending' && canApprove(pr) && (
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
                  {isHR && pr.status === 'approved' && !pr.convertedToPOId && (
                    <button onClick={() => setConvertingPR(pr)}
                      className="flex items-center gap-1 h-7 px-2.5 text-xs bg-brand-primary/20 text-indigo-400 rounded-lg hover:bg-brand-primary-hover/30 transition-colors mt-2">
                      <ArrowRightLeft className="h-3 w-3" /> Convert to PO
                    </button>
                  )}
                  {pr.convertedToPOId && (
                    <p className="text-[10px] text-violet-400 font-semibold mt-2">Converted to PO</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-12 text-brand-text-muted">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No purchase requests yet.</p>
            </div>
          )}
        </div>
      )}
      {showCreate && <CreatePRModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {rejectingPR && <RejectModal title={rejectingPR.title} onClose={() => setRejectingPR(null)} onConfirm={reject} />}
      {convertingPR && <ConvertToPOModal pr={convertingPR} onClose={() => setConvertingPR(null)} onSaved={load} />}
    </div>
  );
}

// ── Vendor Form Modal ─────────────────────────────────────────────────────────
const VENDOR_CATEGORIES = ['Office Supplies', 'IT & Equipment', 'Professional Services', 'Facilities', 'Travel', 'Logistics', 'Marketing', 'Other'];

const COMPANY_KYC_FIELDS: { key: 'kraPinCertificate' | 'registrationCertificate' | 'businessPermit'; label: string }[] = [
  { key: 'kraPinCertificate', label: 'KRA PIN Certificate' },
  { key: 'registrationCertificate', label: 'Certificate of Registration' },
  { key: 'businessPermit', label: 'Business Permit' },
];

function VendorFormModal({ vendor, onClose, onSaved }: { vendor: Vendor | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: vendor?.name ?? '', contactName: vendor?.contactName ?? '', email: vendor?.email ?? '',
    phone: vendor?.phone ?? '', address: vendor?.address ?? '', category: vendor?.category ?? VENDOR_CATEGORIES[0],
    type: vendor?.type ?? 'company', taxId: vendor?.taxId ?? '', paymentTerms: vendor?.paymentTerms ?? '',
    status: vendor?.status ?? 'active', notes: vendor?.notes ?? '',
  });
  const [kycFiles, setKycFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name || !form.category) return;
    if (!vendor && form.type === 'company' && COMPANY_KYC_FIELDS.some(f => !kycFiles[f.key])) return;
    setSaving(true);
    let payload: FormData | typeof form = form;
    if (!vendor && form.type === 'company') {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      COMPANY_KYC_FIELDS.forEach(f => { if (kycFiles[f.key]) fd.append(f.key, kycFiles[f.key] as File); });
      payload = fd;
    }
    const req = vendor
      ? apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/vendors/${vendor._id}`, method: 'PATCH', data: form, thenFn: () => { onSaved(); onClose(); }, finallyFn: () => setSaving(false) })
      : apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/vendors`, method: 'POST', data: payload, thenFn: () => { onSaved(); onClose(); }, finallyFn: () => setSaving(false) });
    void req;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="font-bold text-white">{vendor ? 'Edit Vendor' : 'New Vendor'}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Vendor Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Category <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
                {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {!vendor && (
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Vendor Type <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {(['company', 'individual'] as const).map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-colors capitalize ${
                      form.type === t ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-bg-soft border-brand-border-strong text-brand-text-secondary hover:text-brand-text'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!vendor && form.type === 'company' && (
            <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3 space-y-2">
              <p className="text-xs text-indigo-300">Company vendors must provide the following to be verified:</p>
              {COMPANY_KYC_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-brand-text-secondary mb-1">{f.label} <span className="text-red-400">*</span></label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setKycFiles(prev => ({ ...prev, [f.key]: e.target.files?.[0] ?? null }))}
                    className="w-full text-xs text-brand-text-secondary file:mr-2 file:text-xs file:font-medium file:border-0 file:bg-brand-primary file:text-white file:rounded-lg file:px-2 file:py-1.5" />
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Contact Name</label>
              <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Tax ID</label>
              <input value={form.taxId} onChange={e => set('taxId', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Payment Terms</label>
              <input value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} placeholder="e.g. Net 30"
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          {vendor && (
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
                {['pending_approval', 'active', 'inactive', 'rejected', 'blacklisted'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendors Tab ───────────────────────────────────────────────────────────────
function VendorsTab() {
  const { userData, isHR } = useAuth();
  const isSuperAdmin = userData?.role === 'super_admin';
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingVendor, setEditingVendor] = useState<Vendor | null | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement/vendors`, showToast: false,
      thenFn: r => setVendors(r?.data ?? []), finallyFn: () => setLoading(false) });
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = (id: string) => {
    if (!confirm('Remove this vendor from the directory?')) return;
    setDeletingId(id);
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/vendors/${id}`, method: 'DELETE', thenFn: load, finallyFn: () => setDeletingId(null) });
  };

  const approve = (id: string) => {
    setDecidingId(id);
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/vendors/${id}/approve`, method: 'PATCH', thenFn: load, finallyFn: () => setDecidingId(null) });
  };

  const reject = (id: string) => {
    const rejectionReason = window.prompt('Reason for rejecting this vendor:');
    if (!rejectionReason) return;
    setDecidingId(id);
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement/vendors/${id}/reject`, method: 'PATCH', data: { rejectionReason }, thenFn: load, finallyFn: () => setDecidingId(null) });
  };

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
            className="w-full pl-9 pr-3 h-9 text-sm bg-brand-bg-soft border border-brand-border rounded-xl text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
        </div>
        <button onClick={() => setEditingVendor(null)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> New Vendor
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v._id} className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{v.name}</p>
                  <p className="text-xs text-brand-text-secondary">{v.category}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[v.status]}`}>{v.status}</span>
              </div>
              {v.contactName && <p className="text-xs text-brand-text-muted">{v.contactName}{v.phone ? ` · ${v.phone}` : ''}</p>}
              {v.email && <p className="text-xs text-brand-text-muted truncate">{v.email}</p>}
              {v.paymentTerms && <p className="text-xs text-brand-text-muted">Terms: {v.paymentTerms}</p>}
              {isHR && v.status === 'pending_approval' && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => approve(v._id)} disabled={decidingId === v._id}
                    className="flex items-center gap-1 h-7 px-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 transition-colors">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button onClick={() => reject(v._id)} disabled={decidingId === v._id}
                    className="flex items-center gap-1 h-7 px-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                    <X className="h-3 w-3" /> Reject
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                <button onClick={() => setEditingVendor(v)} className="flex items-center gap-1 h-7 px-2 text-xs bg-brand-bg-muted text-brand-text-secondary rounded-lg hover:bg-brand-border-strong transition-colors">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                {isSuperAdmin && (
                  <button onClick={() => remove(v._id)} disabled={deletingId === v._id} className="flex items-center gap-1 h-7 px-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-brand-text-muted">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vendors yet.</p>
            </div>
          )}
        </div>
      )}
      {editingVendor !== undefined && <VendorFormModal vendor={editingVendor} onClose={() => setEditingVendor(undefined)} onSaved={load} />}
    </div>
  );
}

// ── Log Goods Receipt Modal ────────────────────────────────────────────────────
function GoodsReceiptModal({ po, onClose, onSaved }: { po: PurchaseOrder; onClose: () => void; onSaved: () => void }) {
  const [rows, setRows] = useState(po.items.map(it => ({ poItemId: it.id, receivedQuantity: String(it.quantity - it.receivedQuantity), condition: 'good', notes: '' })));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const updateRow = (i: number, field: string, value: string) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const save = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement-receipts`, method: 'POST',
      data: { purchaseOrderId: po._id, notes: notes || undefined, items: rows.filter(r => Number(r.receivedQuantity) > 0).map(r => ({ ...r, receivedQuantity: Number(r.receivedQuantity) })) },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="font-bold text-white">Log Goods Receipt — {po.poNumber}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {po.items.map((it, i) => (
            <div key={it.id} className="bg-brand-bg-soft/60 border border-brand-border rounded-xl p-3 space-y-2">
              <p className="text-sm text-white">{it.description}</p>
              <p className="text-xs text-brand-text-muted">Ordered {it.quantity} · Already received {it.receivedQuantity}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-brand-text-secondary mb-1">Received Qty</label>
                  <input type="number" min="0" value={rows[i].receivedQuantity} onChange={e => updateRow(i, 'receivedQuantity', e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] text-brand-text-secondary mb-1">Condition</label>
                  <select value={rows[i].condition} onChange={e => updateRow(i, 'condition', e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary">
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="short">Short-shipped</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Log Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Purchase Orders Tab ────────────────────────────────────────────────────────
function PurchaseOrdersTab() {
  const { isHR } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement-orders?${params}`, showToast: false,
      thenFn: r => setOrders(r?.data?.data ?? []), finallyFn: () => setLoading(false) });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const send = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-orders/${id}/send`, method: 'PUT', thenFn: load });
  const acknowledge = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-orders/${id}/acknowledge`, method: 'PUT', thenFn: load });
  const cancel = (id: string) => { if (confirm('Cancel this purchase order?')) apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-orders/${id}`, method: 'DELETE', thenFn: load }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-primary">
          <option value="">All Statuses</option>
          {['draft', 'sent', 'acknowledged', 'partiallyReceived', 'fullyReceived', 'invoiced', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(po => (
            <div key={po._id} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-brand-text-secondary">{po.poNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[po.status]}`}>{po.status}</span>
                  </div>
                  <p className="font-semibold text-white">{po.vendor?.name ?? 'Unknown vendor'}</p>
                  <p className="text-xs text-brand-text-secondary mt-0.5">{po.items.length} line item{po.items.length !== 1 ? 's' : ''}
                    {po.expectedDeliveryDate && ` · Expected ${fmtDate(po.expectedDeliveryDate)}`}</p>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="font-bold text-white">{fmt(po.totalAmount, po.currency)}</p>
                  {isHR && (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {po.status === 'draft' && (
                        <button onClick={() => send(po._id)} className="flex items-center gap-1 h-7 px-2 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                          <Send className="h-3 w-3" /> Send
                        </button>
                      )}
                      {po.status === 'sent' && (
                        <button onClick={() => acknowledge(po._id)} className="flex items-center gap-1 h-7 px-2 text-xs bg-brand-primary/20 text-indigo-400 rounded-lg hover:bg-brand-primary-hover/30 transition-colors">
                          <CheckCircle2 className="h-3 w-3" /> Acknowledge
                        </button>
                      )}
                      {['sent', 'acknowledged', 'partiallyReceived'].includes(po.status) && (
                        <button onClick={() => setReceivingPO(po)} className="flex items-center gap-1 h-7 px-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                          <Truck className="h-3 w-3" /> Log Receipt
                        </button>
                      )}
                      {!['fullyReceived', 'paid', 'cancelled'].includes(po.status) && (
                        <button onClick={() => cancel(po._id)} className="flex items-center gap-1 h-7 px-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                          <Ban className="h-3 w-3" /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-brand-text-muted">
              <PackageCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No purchase orders yet.</p>
            </div>
          )}
        </div>
      )}
      {receivingPO && <GoodsReceiptModal po={receivingPO} onClose={() => setReceivingPO(null)} onSaved={load} />}
    </div>
  );
}

// ── Create Vendor Invoice Modal ────────────────────────────────────────────────
function CreateVendorInvoiceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<VendorInvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement-orders?status=acknowledged`, showToast: false,
      thenFn: r => setOrders(r?.data?.data ?? []) });
  }, []);

  const selectedPO = orders.find(o => o._id === purchaseOrderId);
  const updateItem = (i: number, field: keyof VendorInvoiceItem, value: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: field === 'description' ? value : Number(value) } : it));
  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const save = () => {
    if (!purchaseOrderId || !invoiceNumber || !dueDate || !selectedPO) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/spending/procurement-invoices`, method: 'POST',
      data: { purchaseOrderId, vendorId: selectedPO.vendorId, invoiceNumber, invoiceDate, dueDate, items },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="font-bold text-white">Record Vendor Invoice</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Purchase Order <span className="text-red-400">*</span></label>
            <select value={purchaseOrderId} onChange={e => setPurchaseOrderId(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary">
              <option value="">Select PO (acknowledged)…</option>
              {orders.map(o => <option key={o._id} value={o._id}>{o.poNumber} — {o.vendor?.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Invoice Number <span className="text-red-400">*</span></label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs text-brand-text-secondary mb-1">Due Date <span className="text-red-400">*</span></label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-text-secondary mb-1">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-brand-bg-soft border border-brand-border-strong rounded-xl text-white focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-brand-text-secondary">Line Items</label>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_50px_80px_auto] gap-2 items-center">
                <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description"
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary" />
                <input type="number" min="0" value={it.unitPrice || ''} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="Price"
                  className="h-9 px-2 text-xs bg-brand-bg-soft border border-brand-border-strong rounded-lg text-white focus:outline-none focus:border-brand-primary" />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                  className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 flex items-center justify-center transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>
          {total > 0 && (
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 py-3 text-sm text-indigo-300 font-semibold">
              Total: <span className="text-lg font-black">{fmt(total)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !purchaseOrderId || !invoiceNumber || !dueDate}
            className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Record Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Invoices Tab (3-way match) ─────────────────────────────────────────
function VendorInvoicesTab() {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [disputingInvoice, setDisputingInvoice] = useState<VendorInvoice | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/spending/procurement-invoices`, showToast: false,
      thenFn: r => setInvoices(r?.data?.data ?? []), finallyFn: () => setLoading(false) });
  }, []);

  useEffect(() => { load(); }, [load]);

  const match   = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-invoices/${id}/match`, method: 'PATCH', thenFn: load });
  const approve = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-invoices/${id}/approve`, method: 'PATCH', thenFn: load });
  const pay     = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-invoices/${id}/pay`, method: 'PATCH', thenFn: load });
  const dispute = (reason: string) => {
    if (!disputingInvoice) return;
    apiCallFunction({ url: `${API_BASE_URL}/spending/procurement-invoices/${disputingInvoice._id}/dispute`, method: 'PATCH', data: { reason }, thenFn: () => { load(); setDisputingInvoice(null); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors">
          <Plus className="h-4 w-4" /> Record Invoice
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-brand-bg-soft rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-xs text-brand-text-muted uppercase">
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Vendor</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">3-Way Match</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-brand-bg-soft transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-brand-text-secondary font-mono text-xs">{inv.invoiceNumber}</p>
                    <p className="text-xs text-brand-text-muted">Due {fmtDate(inv.dueDate)}</p>
                  </td>
                  <td className="px-4 py-3 text-white">{inv.vendor?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{fmt(inv.totalAmount, inv.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.threeWayMatchStatus] ?? 'bg-slate-600/40 text-brand-text-secondary'}`}>{inv.threeWayMatchStatus}</span>
                    {inv.discrepancyNotes && <p className="text-[10px] text-amber-400 mt-1 max-w-xs truncate">{inv.discrepancyNotes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {inv.threeWayMatchStatus === 'pending' && (
                        <button onClick={() => match(inv._id)} className="flex items-center gap-1 h-7 px-2 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                          <ArrowRightLeft className="h-3 w-3" /> Match
                        </button>
                      )}
                      {['received', 'underReview', 'matched'].includes(inv.status) && (
                        <>
                          <button onClick={() => approve(inv._id)} className="h-7 px-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">Approve</button>
                          <button onClick={() => setDisputingInvoice(inv)} className="h-7 px-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Dispute</button>
                        </>
                      )}
                      {inv.status === 'approved' && (
                        <button onClick={() => pay(inv._id)} className="h-7 px-2 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">Pay</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-text-muted">No vendor invoices recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showCreate && <CreateVendorInvoiceModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {disputingInvoice && <RejectModal title={disputingInvoice.invoiceNumber} onClose={() => setDisputingInvoice(null)} onConfirm={dispute} />}
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
        <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
          <p className="text-xs text-brand-text-secondary mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-400">{fmt(totalPending)}</p>
        </div>
        <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
          <p className="text-xs text-brand-text-secondary mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalOverdue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.filter(i => i.status !== 'paid').map(inv => {
            const isOverdue = new Date(inv.dueDate) < new Date();
            return (
              <div key={inv._id} className={`bg-brand-bg-soft border rounded-xl px-4 py-3 flex items-center gap-3 ${isOverdue ? 'border-red-500/30' : 'border-brand-border'}`}>
                {isOverdue && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{inv.vendor}</p>
                  <p className="text-xs text-brand-text-secondary">{inv.invoiceNumber || 'No ref'} · Due {fmtDate(inv.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{fmt(inv.amount, inv.currency)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                </div>
              </div>
            );
          })}
          {invoices.filter(i => i.status !== 'paid').length === 0 && (
            <div className="text-center py-12 text-brand-text-muted">
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
  const { isHR, isDeptHead } = useAuth();
  const isManager = isHR || isDeptHead;
  const visibleTabs = TABS.filter(t => (t.hrOnly ? isHR : true) || (t.deptHeadUp && isManager));
  const [tab, setTab] = useState(visibleTabs[0]?.key ?? 'procurement');

  useEffect(() => {
    if (!visibleTabs.some(t => t.key === tab)) setTab(visibleTabs[0]?.key ?? 'procurement');
  }, [visibleTabs, tab]);

  return (
    <div className="min-h-screen bg-white text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Procurement</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Corporate cards, invoices, procurement, and accounts payable</p>
      </div>

      <div className="flex gap-1 bg-brand-bg-soft/50 p-1 rounded-xl w-fit border border-brand-border flex-wrap">
        {visibleTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted'
              }`}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'cards'           && <CardsTab />}
      {tab === 'invoices'        && <InvoicesTab />}
      {tab === 'procurement'     && <ProcurementTab />}
      {tab === 'vendors'         && <VendorsTab />}
      {tab === 'purchase-orders' && <PurchaseOrdersTab />}
      {tab === 'vendor-invoices' && <VendorInvoicesTab />}
      {tab === 'payable'         && <AccountsPayableTab />}
    </div>
  );
}
