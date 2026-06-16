'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  Search, Trash2, X, CheckCircle2, ChevronLeft, ChevronRight,
  Receipt, Wallet, Plus, Pencil, ShoppingCart,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  paymentMethod: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

interface CategorySummary { _id: string; total: number; count: number }

interface EntryRow {
  id: number;
  description: string;
  category: string;
  amount: string;
  date: string;
  vendor: string;
  paymentMethod: string;
  notes: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'office_supplies',  label: 'Office Supplies' },
  { value: 'food_beverages',   label: 'Food & Beverages' },
  { value: 'utilities',        label: 'Utilities' },
  { value: 'maintenance',      label: 'Maintenance & Repairs' },
  { value: 'transport',        label: 'Transport & Fuel' },
  { value: 'printing',         label: 'Printing & Photocopying' },
  { value: 'cleaning',         label: 'Cleaning & Sanitation' },
  { value: 'marketing',        label: 'Marketing & Events' },
  { value: 'other',            label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'mpesa',         label: 'M-Pesa' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card',          label: 'Card' },
];

const CAT_COLORS: Record<string, string> = {
  office_supplies: 'bg-blue-100 text-blue-700',
  food_beverages:  'bg-amber-100 text-amber-700',
  utilities:       'bg-cyan-100 text-cyan-700',
  maintenance:     'bg-orange-100 text-orange-700',
  transport:       'bg-violet-100 text-violet-700',
  printing:        'bg-indigo-100 text-indigo-700',
  cleaning:        'bg-teal-100 text-teal-700',
  marketing:       'bg-rose-100 text-rose-700',
  other:           'bg-gray-100 text-gray-600',
};

const catLabel  = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v;
const pmLabel   = (v: string) => PAYMENT_METHODS.find(p => p.value === v)?.label ?? v;
const fmtAmount = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const fmtDate   = (d: string) => new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' });
const today     = () => new Date().toISOString().split('T')[0];

const emptyRow = (id: number): EntryRow => ({
  id, description: '', category: 'office_supplies', amount: '',
  date: today(), vendor: '', paymentMethod: 'cash', notes: '',
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [summary, setSummary]     = useState<CategorySummary[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);

  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterPm, setFilterPm]         = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');

  const [showBatch, setShowBatch]       = useState(false);
  const [rows, setRows]                 = useState<EntryRow[]>([emptyRow(1)]);
  const [saving, setSaving]             = useState(false);
  const [nextId, setNextId]             = useState(2);

  const [editExpense, setEditExpense]   = useState<Expense | null>(null);
  const [editForm, setEditForm]         = useState<Partial<Expense>>({});
  const [editSaving, setEditSaving]     = useState(false);

  const LIMIT = 25;

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search)     params.set('search',        search);
    if (filterCat)  params.set('category',      filterCat);
    if (filterPm)   params.set('paymentMethod', filterPm);
    if (filterFrom) params.set('from',          filterFrom);
    if (filterTo)   params.set('to',            filterTo);

    apiCallFunction<any>({
      url: `${API_BASE_URL}/expenses?${params}`,
      showToast: false,
      thenFn: r => {
        const p = r?.data;
        setExpenses(p?.data ?? []);
        setTotal(p?.total ?? 0);
        setSummary(p?.summary ?? []);
        setGrandTotal(p?.grandTotal ?? 0);
      },
      finallyFn: () => setLoading(false),
    });
  }, [page, search, filterCat, filterPm, filterFrom, filterTo]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Row helpers ───────────────────────────────────────────────────────────
  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows(r => [...r, emptyRow(nextId)]);
    setNextId(n => n + 1);
    // carry forward date & payment method from last row
    setRows(r => r.map((row, i) => i === r.length - 1 ? { ...row, date: last?.date ?? today(), paymentMethod: last?.paymentMethod ?? 'cash' } : row));
  };

  const removeRow = (id: number) => setRows(r => r.filter(row => row.id !== id));

  const updateRow = (id: number, field: keyof EntryRow, value: string) =>
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  const applyDateToAll = (date: string) =>
    setRows(r => r.map(row => ({ ...row, date })));

  // ── Save batch ────────────────────────────────────────────────────────────
  const saveBatch = () => {
    const valid = rows.filter(r => r.description.trim() && r.amount && r.date);
    if (!valid.length) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/expenses/batch`,
      method: 'POST',
      data: { entries: valid.map(r => ({ ...r, amount: parseFloat(r.amount) })) },
      thenFn: () => {
        setShowBatch(false);
        setRows([emptyRow(1)]);
        setNextId(2);
        fetchExpenses();
      },
      finallyFn: () => setSaving(false),
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (exp: Expense) => {
    setEditExpense(exp);
    setEditForm({ description: exp.description, category: exp.category, amount: exp.amount, date: exp.date, vendor: exp.vendor, paymentMethod: exp.paymentMethod, notes: exp.notes });
  };

  const saveEdit = () => {
    if (!editExpense) return;
    setEditSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/expenses/${editExpense._id}`,
      method: 'PUT',
      data: editForm,
      thenFn: () => { setEditExpense(null); fetchExpenses(); },
      finallyFn: () => setEditSaving(false),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this expense?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/expenses/${id}`,
      method: 'DELETE',
      thenFn: () => fetchExpenses(),
    });
  };

  const totalPages   = Math.ceil(total / LIMIT);
  const validRows    = rows.filter(r => r.description.trim() && r.amount && r.date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-foreground/50 mt-0.5">Record and track all company expenditure</p>
        </div>
        <button onClick={() => { setShowBatch(true); setRows([emptyRow(1)]); setNextId(2); }}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Record Expenses
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-1 rounded-2xl border bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-foreground/40 font-medium uppercase tracking-wide">Total Spent</p>
            <p className="text-xl font-bold text-foreground leading-tight">{fmtAmount(grandTotal)}</p>
            <p className="text-xs text-foreground/40">{total} records</p>
          </div>
        </div>
        {summary.slice(0, 3).map(s => (
          <div key={s._id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', CAT_COLORS[s._id] ?? 'bg-gray-100 text-gray-600')}>
              {catLabel(s._id)}
            </span>
            <p className="text-lg font-bold text-foreground mt-2">{fmtAmount(s.total)}</p>
            <p className="text-xs text-foreground/40">{s.count} entries</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search description…"
              className="w-full pl-9 pr-3 h-9 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filterPm} onChange={e => { setFilterPm(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {(search || filterCat || filterPm || filterFrom || filterTo) && (
            <button onClick={() => { setSearch(''); setFilterCat(''); setFilterPm(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}
              className="h-9 px-3 text-sm text-foreground/50 hover:text-foreground border rounded-xl flex items-center gap-1.5 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-foreground/30 gap-2">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p className="text-sm">No expenses recorded yet.</p>
            <p className="text-xs">Click "Record Expenses" to add entries.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-foreground/40 uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                    <th className="text-left px-5 py-3 font-semibold">Description</th>
                    <th className="text-left px-5 py-3 font-semibold">Category</th>
                    <th className="text-left px-5 py-3 font-semibold">Vendor</th>
                    <th className="text-left px-5 py-3 font-semibold">Payment</th>
                    <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    <th className="text-left px-5 py-3 font-semibold">By</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map(exp => (
                    <tr key={exp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-foreground/60 whitespace-nowrap">{fmtDate(exp.date)}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">{exp.description}</p>
                        {exp.notes && <p className="text-xs text-foreground/40 truncate max-w-xs">{exp.notes}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', CAT_COLORS[exp.category] ?? 'bg-gray-100 text-gray-600')}>
                          {catLabel(exp.category)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-foreground/60">{exp.vendor || '—'}</td>
                      <td className="px-5 py-3.5 text-foreground/60">{pmLabel(exp.paymentMethod)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground whitespace-nowrap">
                        {fmtAmount(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-foreground/40">{exp.recordedBy}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(exp)}
                            className="h-7 w-7 flex items-center justify-center text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(exp._id)}
                            className="h-7 w-7 flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-gray-50">
                    <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wide">
                      Page total
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-foreground">
                      {fmtAmount(expenses.reduce((s, e) => s + e.amount, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
              <p className="text-xs text-foreground/40">{total} total · page {page} of {totalPages}</p>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-white transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Batch Entry Modal ─────────────────────────────────────────────────── */}
      {showBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-bold text-foreground text-lg">Record Expenses</h2>
                <p className="text-xs text-foreground/40 mt-0.5">Add as many rows as needed, then save all at once</p>
              </div>
              <button onClick={() => setShowBatch(false)} className="text-foreground/40 hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Apply-date-to-all helper */}
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-3">
              <span className="text-xs text-foreground/50 font-medium">Apply one date to all rows:</span>
              <input type="date" defaultValue={today()}
                onChange={e => applyDateToAll(e.target.value)}
                className="h-8 px-2.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            {/* Spreadsheet rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-foreground/40 uppercase tracking-wider">
                    <th className="text-left px-3 py-2.5 font-semibold w-8">#</th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-52">Description <span className="text-red-400">*</span></th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-44">Category <span className="text-red-400">*</span></th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-32">Amount (KES) <span className="text-red-400">*</span></th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-36">Date <span className="text-red-400">*</span></th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-36">Vendor / Supplier</th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-36">Payment Method</th>
                    <th className="text-left px-3 py-2.5 font-semibold min-w-44">Notes</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-2 text-xs text-foreground/30 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input value={row.description} onChange={e => updateRow(row.id, 'description', e.target.value)}
                          placeholder="e.g. Office coffee"
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={row.category} onChange={e => updateRow(row.id, 'category', e.target.value)}
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" step="0.01" value={row.amount}
                          onChange={e => updateRow(row.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)}
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={row.vendor} onChange={e => updateRow(row.id, 'vendor', e.target.value)}
                          placeholder="Shop / Supplier"
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={row.paymentMethod} onChange={e => updateRow(row.id, 'paymentMethod', e.target.value)}
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                          {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={row.notes} onChange={e => updateRow(row.id, 'notes', e.target.value)}
                          placeholder="Optional notes"
                          className="w-full h-8 px-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="px-3 py-2">
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(row.id)}
                            className="h-7 w-7 flex items-center justify-center text-foreground/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row + running total */}
            <div className="px-6 py-3 border-t border-b bg-gray-50 flex items-center justify-between">
              <button onClick={addRow}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                <Plus className="h-4 w-4" /> Add another row
              </button>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-foreground/40">{rows.length} row{rows.length !== 1 ? 's' : ''} · {validRows.length} valid</span>
                <span className="font-bold text-foreground">
                  Total: {fmtAmount(validRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0))}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4">
              <button onClick={() => setShowBatch(false)}
                className="h-10 px-5 rounded-xl border text-sm text-foreground/60 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveBatch} disabled={saving || validRows.length === 0}
                className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? 'Saving…' : `Save ${validRows.length} Expense${validRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editExpense && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-foreground">Edit Expense</h2>
              <button onClick={() => setEditExpense(null)} className="text-foreground/40 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Description', field: 'description', type: 'text' },
                { label: 'Amount (KES)', field: 'amount', type: 'number' },
                { label: 'Date', field: 'date', type: 'date' },
                { label: 'Vendor', field: 'vendor', type: 'text' },
                { label: 'Notes', field: 'notes', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">{label}</label>
                  <input type={type} value={String((editForm as any)[field] ?? '')}
                    onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Category</label>
                <select value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Payment Method</label>
                <select value={editForm.paymentMethod ?? ''} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                  {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setEditExpense(null)}
                className="flex-1 h-10 rounded-xl border text-sm text-foreground/60 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
