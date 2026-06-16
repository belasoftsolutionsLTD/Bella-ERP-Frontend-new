'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Smartphone, Banknote, CheckCircle2, Globe, CreditCard, Landmark } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

type AccountType = 'bank' | 'swift' | 'mpesa' | 'flutterwave' | 'paypal' | 'stripe' | 'wise' | 'cash';

interface CompanyAccount {
  _id: string;
  name: string;
  accountType: AccountType;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  ibanNumber?: string;
  mpesaNumber?: string;
  paypalEmail?: string;
  wiseEmail?: string;
  stripeAccountId?: string;
  flutterwaveAccountId?: string;
  currency?: string;
  isActive?: boolean;
}

interface Props {
  items: CompanyAccount[];
  refetch: () => void;
}

const TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  bank:         <Building2 className="h-4 w-4" />,
  swift:        <Globe className="h-4 w-4" />,
  mpesa:        <Smartphone className="h-4 w-4" />,
  flutterwave:  <CreditCard className="h-4 w-4" />,
  paypal:       <CreditCard className="h-4 w-4" />,
  stripe:       <CreditCard className="h-4 w-4" />,
  wise:         <Landmark className="h-4 w-4" />,
  cash:         <Banknote className="h-4 w-4" />,
};
const TYPE_LABELS: Record<AccountType, string> = {
  bank:         'Bank Transfer (Local)',
  swift:        'International Bank (SWIFT/IBAN)',
  mpesa:        'M-Pesa',
  flutterwave:  'Flutterwave',
  paypal:       'PayPal',
  stripe:       'Stripe',
  wise:         'Wise (Transferwise)',
  cash:         'Cash',
};

const EMPTY: Omit<CompanyAccount, '_id'> = {
  name: '', accountType: 'bank',
  bankName: '', accountNumber: '', swiftCode: '', ibanNumber: '',
  mpesaNumber: '', paypalEmail: '', wiseEmail: '',
  stripeAccountId: '', flutterwaveAccountId: '', currency: '',
};

export function CompanyAccountsPanel({ items, refetch }: Props) {
  const [editing, setEditing] = useState<CompanyAccount | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm({ ...EMPTY }); setEditing(null); setIsNew(true); };
  const openEdit = (item: CompanyAccount) => {
    setForm({
      name: item.name, accountType: item.accountType,
      bankName: item.bankName || '', accountNumber: item.accountNumber || '',
      swiftCode: item.swiftCode || '', ibanNumber: item.ibanNumber || '',
      mpesaNumber: item.mpesaNumber || '', paypalEmail: item.paypalEmail || '',
      wiseEmail: item.wiseEmail || '', stripeAccountId: item.stripeAccountId || '',
      flutterwaveAccountId: item.flutterwaveAccountId || '', currency: item.currency || '',
    });
    setEditing(item); setIsNew(true);
  };
  const closeForm = () => { setIsNew(false); setEditing(null); };

  const handleSave = () => {
    if (!form.name || !form.accountType) return;
    setSaving(true);
    const url = editing ? `${API_BASE_URL}/config/company-accounts/${editing._id}` : `${API_BASE_URL}/config/company-accounts`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { refetch(); closeForm(); },
      finallyFn: () => setSaving(false),
    });
  };

  const handleDelete = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/config/company-accounts/${id}`,
      method: 'DELETE',
      thenFn: () => refetch(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Company Payment Accounts</h3>
          <p className="text-xs text-foreground/50 mt-0.5">Payment accounts and methods the company uses to pay employees — local and international.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Account
        </button>
      </div>

      {/* Add / Edit form */}
      {isNew && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">{editing ? 'Edit Account' : 'New Account'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Account Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. KCB Business Account"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Account Type *</label>
              <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value as AccountType }))}
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                <optgroup label="Local">
                  <option value="bank">Bank Transfer (Local)</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Cash</option>
                </optgroup>
                <optgroup label="International">
                  <option value="swift">International Bank (SWIFT / IBAN)</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="wise">Wise (Transferwise)</option>
                  <option value="flutterwave">Flutterwave</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Local bank */}
          {form.accountType === 'bank' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">Bank Name</label>
                <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. KCB, Equity, GTBank"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">Account Number</label>
                <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="e.g. 1234567890"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}

          {/* International SWIFT */}
          {form.accountType === 'swift' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">Bank Name</label>
                <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. Barclays, HSBC"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">SWIFT / BIC Code</label>
                <input value={form.swiftCode} onChange={e => setForm(f => ({ ...f, swiftCode: e.target.value }))}
                  placeholder="e.g. BARCGB22"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">IBAN / Account Number</label>
                <input value={form.ibanNumber} onChange={e => setForm(f => ({ ...f, ibanNumber: e.target.value }))}
                  placeholder="e.g. GB29NWBK60161331926819"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-foreground/60">Currency</label>
                <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  placeholder="e.g. USD, GBP, EUR"
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}

          {/* M-Pesa */}
          {form.accountType === 'mpesa' && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-foreground/60">M-Pesa Number / Paybill / Till</label>
              <input value={form.mpesaNumber} onChange={e => setForm(f => ({ ...f, mpesaNumber: e.target.value }))}
                placeholder="e.g. 254712345678"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* PayPal */}
          {form.accountType === 'paypal' && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-foreground/60">PayPal Email</label>
              <input type="email" value={form.paypalEmail} onChange={e => setForm(f => ({ ...f, paypalEmail: e.target.value }))}
                placeholder="e.g. payments@company.com"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* Wise */}
          {form.accountType === 'wise' && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-foreground/60">Wise Email / Account</label>
              <input type="email" value={form.wiseEmail} onChange={e => setForm(f => ({ ...f, wiseEmail: e.target.value }))}
                placeholder="e.g. payments@company.com"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* Stripe */}
          {form.accountType === 'stripe' && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-foreground/60">Stripe Account ID</label>
              <input value={form.stripeAccountId} onChange={e => setForm(f => ({ ...f, stripeAccountId: e.target.value }))}
                placeholder="e.g. acct_1ABC..."
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* Flutterwave */}
          {form.accountType === 'flutterwave' && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-foreground/60">Flutterwave Account / Merchant ID</label>
              <input value={form.flutterwaveAccountId} onChange={e => setForm(f => ({ ...f, flutterwaveAccountId: e.target.value }))}
                placeholder="e.g. FLW-MERCHANT-12345"
                className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={closeForm} className="text-xs text-foreground/40 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name}
              className="text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {items.length === 0 && !isNew ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-foreground/40">
          No company accounts added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item._id} className="flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:border-primary/20 transition-colors">
              <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                {TYPE_ICONS[item.accountType] ?? <Building2 className="h-4 w-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-foreground/50 capitalize">{TYPE_LABELS[item.accountType]}</span>
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {item.accountType === 'bank'        && [item.bankName, item.accountNumber].filter(Boolean).join(' · ')}
                  {item.accountType === 'swift'       && [item.bankName, item.swiftCode, item.ibanNumber, item.currency].filter(Boolean).join(' · ')}
                  {item.accountType === 'mpesa'       && item.mpesaNumber}
                  {item.accountType === 'paypal'      && item.paypalEmail}
                  {item.accountType === 'wise'        && item.wiseEmail}
                  {item.accountType === 'stripe'      && item.stripeAccountId}
                  {item.accountType === 'flutterwave' && item.flutterwaveAccountId}
                  {item.accountType === 'cash'        && 'Physical cash disbursement'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg text-foreground/30 hover:text-danger hover:bg-danger/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-foreground/40 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          {items.length} account{items.length !== 1 ? 's' : ''} available for payroll disbursement
        </p>
      )}
    </div>
  );
}
