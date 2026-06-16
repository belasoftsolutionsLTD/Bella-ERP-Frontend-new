'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award, Plus, Trash2, Search, Users, CheckSquare, ChevronLeft, ChevronRight,
  X, Loader2, Trophy, Pencil, Star, Clock, Calendar, BarChart2, Repeat2,
} from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AwardType {
  _id: string; name: string; description?: string; category?: string;
  repeatInterval?: string; nextDueDate?: string;
}
interface Employee  { _id: string; fullName: string; staffNumber?: string; department?: string; designation?: string }
interface EmpAward  {
  _id: string; employeeName: string; staffNumber?: string; department?: string;
  awardTypeName: string; notes?: string; year: number; awardedBy: string; awardedAt: string;
}
interface StatItem  { name: string; count: number }
interface TopEmp    { employeeName: string; staffNumber?: string; department?: string; count: number }
interface AwardStats {
  year: number; total: number;
  byType: StatItem[]; byDepartment: StatItem[]; topEmployees: TopEmp[];
}
interface UpcomingAward extends AwardType { daysUntilDue: number }

// ── Inline bar chart ──────────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: StatItem[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 7).map(d => (
        <div key={d.name} className="flex items-center gap-2 text-xs">
          <span className="w-28 truncate text-foreground/60 shrink-0" title={d.name}>{d.name}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-6 text-right font-semibold text-foreground/70">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-black text-foreground">{value}</p>
        <p className="text-xs text-foreground/50">{label}</p>
      </div>
    </div>
  );
}

// ── Award type manager ────────────────────────────────────────────────────────

const REPEAT_OPTS = [
  { label: 'No repeat',  value: 'none' },
  { label: 'Monthly',    value: 'monthly' },
  { label: 'Quarterly',  value: 'quarterly' },
  { label: 'Annually',   value: 'annually' },
];

function AwardTypesManager({
  types, onRefetch, onAdvance,
}: {
  types: AwardType[];
  onRefetch: () => void;
  onAdvance: (id: string) => void;
}) {
  const EMPTY = { name: '', description: '', category: '', repeatInterval: 'none', nextDueDate: '' };
  const [form, setForm]     = useState(EMPTY);
  const [editing, setEditing] = useState<AwardType | null>(null);
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!form.name) return;
    setSaving(true);
    const url    = editing ? `${API_BASE_URL}/awards/types/${editing._id}` : `${API_BASE_URL}/awards/types`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { onRefetch(); setOpen(false); setEditing(null); setForm(EMPTY); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/awards/types/${id}`, method: 'DELETE', thenFn: onRefetch });

  const startEdit = (t: AwardType) => {
    setEditing(t);
    setForm({
      name: t.name, description: t.description || '', category: t.category || '',
      repeatInterval: t.repeatInterval || 'none',
      nextDueDate: t.nextDueDate ? t.nextDueDate.slice(0, 10) : '',
    });
    setOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Award Types</h3>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> New Type
        </button>
      </div>

      {open && (
        <div className="border-2 border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">
            {editing ? 'Edit Award Type' : 'New Award Type'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Award name *"
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Category (e.g. Performance)"
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Repeat interval</label>
              <select value={form.repeatInterval} onChange={e => setForm(f => ({ ...f, repeatInterval: e.target.value }))}
                className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                {REPEAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {form.repeatInterval !== 'none' && (
              <div className="space-y-1">
                <label className="text-xs text-foreground/50">Next due date</label>
                <input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))}
                  className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-xs text-foreground/40 hover:text-foreground px-3 py-1.5 rounded-lg">Cancel</button>
            <button onClick={save} disabled={saving || !form.name}
              className="text-xs font-semibold bg-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {types.length === 0
        ? <p className="text-xs text-foreground/40 text-center py-4">No award types yet. Create one to get started.</p>
        : (
          <div className="space-y-2">
            {types.map(t => (
              <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/20">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-foreground/40">{[t.category, t.description].filter(Boolean).join(' · ')}</p>
                    {t.repeatInterval && t.repeatInterval !== 'none' && (
                      <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-600 text-xs px-2 py-0.5 rounded-full border border-violet-200">
                        <Repeat2 className="h-2.5 w-2.5" /> {t.repeatInterval}
                        {t.nextDueDate && ` · ${new Date(t.nextDueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}`}
                      </span>
                    )}
                  </div>
                </div>
                {t.repeatInterval && t.repeatInterval !== 'none' && (
                  <button onClick={() => onAdvance(t._id)}
                    title="Mark as done & advance schedule"
                    className="p-1.5 rounded-lg text-foreground/30 hover:text-violet-500 hover:bg-violet-50 transition-colors">
                    <Repeat2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => startEdit(t)}
                  className="p-1.5 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => del(t._id)} className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Upcoming awards panel ─────────────────────────────────────────────────────

function UpcomingPanel({ items, onAdvance }: { items: UpcomingAward[]; onAdvance: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-violet-500" />
        <h3 className="font-bold text-sm text-violet-700">Upcoming / Due Awards</h3>
        <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(a => {
          const overdue = a.daysUntilDue < 0;
          const soon    = a.daysUntilDue <= 7 && !overdue;
          return (
            <div key={a._id}
              className={cn('flex items-center gap-3 p-3 rounded-xl border',
                overdue ? 'border-red-200 bg-red-50' : soon ? 'border-amber-200 bg-amber-50' : 'border-violet-100 bg-violet-50/40')}>
              <Calendar className={cn('h-4 w-4 shrink-0', overdue ? 'text-red-500' : soon ? 'text-amber-500' : 'text-violet-400')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.name}</p>
                <p className="text-xs text-foreground/50">
                  {a.nextDueDate && new Date(a.nextDueDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  {' · '}
                  {overdue
                    ? <span className="text-red-600 font-medium">{Math.abs(a.daysUntilDue)}d overdue</span>
                    : soon
                      ? <span className="text-amber-600 font-medium">Due in {a.daysUntilDue}d</span>
                      : <span className="text-violet-600">Due in {a.daysUntilDue}d</span>
                  }
                </p>
              </div>
              <span className="text-xs bg-white border rounded-full px-2 py-0.5 text-foreground/40 capitalize">{a.repeatInterval}</span>
              <button onClick={() => onAdvance(a._id)} title="Mark done & advance"
                className="p-1.5 rounded-lg text-foreground/30 hover:text-violet-600 hover:bg-white transition-colors">
                <Repeat2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bulk award modal ──────────────────────────────────────────────────────────

function BulkAwardModal({ types, onClose, onSuccess }: { types: AwardType[]; onClose: () => void; onSuccess: () => void }) {
  const [q, setQ]                     = useState('');
  const [dept, setDept]               = useState('');
  const [page, setPage]               = useState(1);
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [total, setTotal]             = useState(0);
  const [loadingEmp, setLoadingEmp]   = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [awardTypeId, setAwardTypeId] = useState('');
  const [notes, setNotes]             = useState('');
  const [year, setYear]               = useState(new Date().getFullYear());
  const [granting, setGranting]       = useState(false);
  const limit = 20;
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEmployees = useCallback((pageNum = 1, query = q, department = dept) => {
    setLoadingEmp(true);
    apiCallFunction<{ data: { data: Employee[]; total: number } }>({
      url: `${API_BASE_URL}/awards/employees/search?q=${encodeURIComponent(query)}&department=${encodeURIComponent(department)}&page=${pageNum}&limit=${limit}`,
      showToast: false,
      thenFn: r => { setEmployees(r.data?.data ?? []); setTotal(r.data?.total ?? 0); },
      finallyFn: () => setLoadingEmp(false),
    });
  }, [q, dept]);

  useEffect(() => { fetchEmployees(1); }, []);

  const handleSearch = (val: string) => {
    setQ(val); setPage(1);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchEmployees(1, val, dept), 350);
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const grant = () => {
    if (!awardTypeId || selected.size === 0) return;
    setGranting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/awards/bulk`, method: 'POST',
      data: { employeeIds: [...selected], awardTypeId, notes, year },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setGranting(false),
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base">Bulk Award Grant</h2>
            {selected.size > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{selected.size} selected</span>
            )}
          </div>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 border-r">
            <div className="px-4 py-3 border-b space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                <input value={q} onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name or staff number…"
                  className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <input value={dept} onChange={e => { setDept(e.target.value); setPage(1); fetchEmployees(1, q, e.target.value); }}
                placeholder="Filter by department"
                className="w-full h-8 border border-gray-200 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <button onClick={() => setSelected(new Set(employees.map(e => e._id)))} className="text-primary hover:underline">Select page</button>
                <span>·</span>
                <button onClick={() => setSelected(new Set())} className="hover:underline">Clear all</button>
                <span className="ml-auto">{total} employees</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y">
              {loadingEmp
                ? <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                : employees.length === 0
                  ? <p className="text-xs text-foreground/40 text-center py-8">No employees found.</p>
                  : employees.map(e => {
                      const isSel = selected.has(e._id);
                      return (
                        <button key={e._id} onClick={() => toggleSelect(e._id)}
                          className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors', isSel && 'bg-primary/5')}>
                          <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center shrink-0', isSel ? 'bg-primary border-primary' : 'border-gray-300')}>
                            {isSel && <CheckSquare className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{e.fullName}</p>
                            <p className="text-xs text-foreground/40">{[e.staffNumber, e.department].filter(Boolean).join(' · ')}</p>
                          </div>
                        </button>
                      );
                    })
              }
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
                <button onClick={() => { const p = page - 1; setPage(p); fetchEmployees(p); }} disabled={page === 1}
                  className="p-1 rounded-lg disabled:opacity-30 hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs text-foreground/50">Page {page} of {totalPages}</span>
                <button onClick={() => { const p = page + 1; setPage(p); fetchEmployees(p); }} disabled={page >= totalPages}
                  className="p-1 rounded-lg disabled:opacity-30 hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>

          <div className="w-full md:w-72 p-5 space-y-4 shrink-0 overflow-y-auto">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Award Details</p>
            <div className="space-y-1">
              <label className="text-xs text-foreground/60">Award Type *</label>
              <select value={awardTypeId} onChange={e => setAwardTypeId(e.target.value)}
                className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">— Select award —</option>
                {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-foreground/60">Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
                className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-foreground/60">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="e.g. Q3 top performers"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            {selected.size > 0 && awardTypeId && (
              <div className="bg-primary/5 rounded-xl p-3 text-xs text-primary font-medium">
                Grant &ldquo;{types.find(t => t._id === awardTypeId)?.name}&rdquo; to {selected.size} employee{selected.size !== 1 ? 's' : ''}
              </div>
            )}
            <button onClick={grant} disabled={granting || !awardTypeId || selected.size === 0}
              className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
              {granting ? 'Granting…' : `Grant Award (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const [types, setTypes]           = useState<AwardType[]>([]);
  const [awards, setAwards]         = useState<EmpAward[]>([]);
  const [awardTotal, setAwardTotal] = useState(0);
  const [awardPage, setAwardPage]   = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchQ, setSearchQ]       = useState('');
  const [showBulk, setShowBulk]     = useState(false);
  const [tab, setTab]               = useState<'overview' | 'awards' | 'types'>('overview');
  const [stats, setStats]           = useState<AwardStats | null>(null);
  const [upcoming, setUpcoming]     = useState<UpcomingAward[]>([]);
  const [statsYear, setStatsYear]   = useState(new Date().getFullYear());
  const limit = 20;

  const fetchTypes = useCallback(() => {
    apiCallFunction<{ data: AwardType[] }>({
      url: `${API_BASE_URL}/awards/types`, showToast: false,
      thenFn: r => setTypes(r.data ?? []), catchFn: () => {},
    });
  }, []);

  const fetchAwards = useCallback((pg = awardPage) => {
    const params = new URLSearchParams({ page: String(pg), limit: String(limit) });
    if (filterType) params.set('awardTypeId', filterType);
    if (filterYear) params.set('year', filterYear);
    if (searchQ)    params.set('search', searchQ);
    apiCallFunction<{ data: { data: EmpAward[]; total: number } }>({
      url: `${API_BASE_URL}/awards?${params}`, showToast: false,
      thenFn: r => { setAwards(r.data?.data ?? []); setAwardTotal(r.data?.total ?? 0); },
      catchFn: () => {},
    });
  }, [awardPage, filterType, filterYear, searchQ]);

  const fetchStats = useCallback(() => {
    apiCallFunction<{ data: AwardStats }>({
      url: `${API_BASE_URL}/awards/stats?year=${statsYear}`, showToast: false,
      thenFn: r => setStats(r.data ?? null), catchFn: () => {},
    });
  }, [statsYear]);

  const fetchUpcoming = useCallback(() => {
    apiCallFunction<{ data: UpcomingAward[] }>({
      url: `${API_BASE_URL}/awards/upcoming`, showToast: false,
      thenFn: r => setUpcoming(r.data ?? []), catchFn: () => {},
    });
  }, []);

  const advanceSchedule = (typeId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/awards/types/${typeId}/advance-schedule`, method: 'POST',
      thenFn: () => { fetchTypes(); fetchUpcoming(); fetchStats(); },
    });
  };

  useEffect(() => { fetchTypes(); fetchUpcoming(); }, [fetchTypes, fetchUpcoming]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAwards(awardPage); }, [awardPage, filterType, filterYear]);

  const revokeAward = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/awards/${id}`, method: 'DELETE', thenFn: () => { fetchAwards(awardPage); fetchStats(); } });
  };

  const totalPages  = Math.ceil(awardTotal / limit);
  const currentYear = new Date().getFullYear();
  const yearOpts    = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const topEmp      = stats?.topEmployees?.[0];

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Award className="h-6 w-6" /> Awards & Certifications
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Recognise employee achievements and manage award records.</p>
        </div>
        <button onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 shadow-lg shadow-primary/20">
          <Users className="h-4 w-4" /> Bulk Award
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Awards Granted" value={stats?.total ?? awardTotal} icon={Trophy}    color="#6366f1" />
        <StatCard label="Award Types"           value={types.length}               icon={Award}     color="#f59e0b" />
        <StatCard label={`${currentYear} Awards`} value={stats?.total ?? 0}        icon={Star}      color="#10b981" />
        <StatCard label="Due / Upcoming"        value={upcoming.length}            icon={Clock}     color="#8b5cf6" />
      </div>

      {/* Upcoming alert strip */}
      {upcoming.length > 0 && (
        <UpcomingPanel items={upcoming} onAdvance={advanceSchedule} />
      )}

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'awards',   label: 'Award Records' },
          { key: 'types',    label: 'Award Types' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Top employee spotlight */}
          {topEmp && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Star className="h-7 w-7 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">Most Awarded Employee</p>
                <p className="text-xl font-black text-foreground">{topEmp.employeeName}</p>
                <p className="text-sm text-foreground/50">{[topEmp.staffNumber, topEmp.department].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-4xl font-black text-amber-500">{topEmp.count}</p>
                <p className="text-xs text-amber-600 font-medium">award{topEmp.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* By type */}
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-bold text-sm">Awards by Type</h3>
                </div>
                <select value={statsYear} onChange={e => setStatsYear(parseInt(e.target.value))}
                  className="h-7 border border-gray-200 rounded-lg px-2 text-xs bg-white focus:outline-none">
                  {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {stats?.byType?.length
                ? <MiniBarChart data={stats.byType} color="#6366f1" />
                : <p className="text-xs text-foreground/30 text-center py-6">No data for {statsYear}.</p>
              }
            </div>

            {/* By department */}
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Awards by Department</h3>
              </div>
              {stats?.byDepartment?.length
                ? <MiniBarChart data={stats.byDepartment} color="#10b981" />
                : <p className="text-xs text-foreground/30 text-center py-6">No data for {statsYear}.</p>
              }
            </div>
          </div>

          {/* Top 5 employees table */}
          {(stats?.topEmployees?.length ?? 0) > 1 && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm">Top Awarded Employees — {statsYear}</h3>
              </div>
              <div className="space-y-2">
                {stats!.topEmployees.map((e, i) => (
                  <div key={e.employeeName} className="flex items-center gap-3 p-3 rounded-xl border">
                    <span className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                      i === 0 ? 'bg-amber-100 text-amber-600'
                        : i === 1 ? 'bg-gray-100 text-gray-600'
                        : i === 2 ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-50 text-gray-400',
                    )}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{e.employeeName}</p>
                      <p className="text-xs text-foreground/40">{[e.staffNumber, e.department].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="text-sm font-black text-amber-500">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Types tab ── */}
      {tab === 'types' && (
        <AwardTypesManager types={types} onRefetch={fetchTypes} onAdvance={advanceSchedule} />
      )}

      {/* ── Records tab ── */}
      {tab === 'awards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setAwardPage(1); }}
                onKeyDown={e => e.key === 'Enter' && fetchAwards(1)}
                placeholder="Search employee name…"
                className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setAwardPage(1); }}
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All award types</option>
              {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setAwardPage(1); }}
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All years</option>
              {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Employee', 'Award', 'Year', 'Department', 'Awarded By', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {awards.length === 0
                  ? <tr><td colSpan={7} className="text-center py-12 text-sm text-foreground/30">No awards found.</td></tr>
                  : awards.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{a.employeeName}</p>
                          {a.staffNumber && <p className="text-xs text-foreground/40">{a.staffNumber}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                            <Trophy className="h-3 w-3" /> {a.awardTypeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/60 font-medium">{a.year}</td>
                        <td className="px-4 py-3 text-foreground/60 text-xs">{a.department || '—'}</td>
                        <td className="px-4 py-3 text-foreground/60 text-xs">{a.awardedBy}</td>
                        <td className="px-4 py-3 text-foreground/40 text-xs">
                          {new Date(a.awardedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => revokeAward(a._id)}
                            className="p-1.5 rounded-lg text-foreground/20 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button onClick={() => setAwardPage(p => Math.max(1, p - 1))} disabled={awardPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-sm text-foreground/50">Page {awardPage} of {totalPages}</span>
              <button onClick={() => setAwardPage(p => Math.min(totalPages, p + 1))} disabled={awardPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {showBulk && (
        <BulkAwardModal types={types} onClose={() => setShowBulk(false)} onSuccess={() => { fetchAwards(1); fetchStats(); }} />
      )}
    </div>
  );
}
