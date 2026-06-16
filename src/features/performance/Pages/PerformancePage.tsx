'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Search, Star, TrendingDown, TrendingUp, Plus, X,
  ChevronRight, Loader2, BarChart3, AlertTriangle, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Employee { _id: string; fullName: string; staffNumber: string; designation: string; department: string; status: string }
interface AppraisalRecord { _id: string; reviewPeriod: string; rating: number; comments?: string; goalsSet: string[]; goalsAchieved: string[]; createdAt: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600', 'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-500', 'from-fuchsia-500 to-violet-600',
];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function Avatar({ name }: { name: string }) {
  return (
    <div className={cn('h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 text-white text-sm font-bold', avatarColor(name))}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn('h-4 w-4', s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200')} />
      ))}
    </div>
  );
}

function ratingLabel(r: number) {
  return r >= 5 ? 'Outstanding' : r === 4 ? 'Exceeds Expectations' : r === 3 ? 'Meets Expectations' : r === 2 ? 'Needs Improvement' : 'Unsatisfactory';
}
function ratingColor(r: number) {
  return r >= 4 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : r === 3 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-red-600 bg-red-50 border-red-200';
}

// ── Add Appraisal Modal ───────────────────────────────────────────────────────
function AddAppraisalModal({ employee, onClose, onSuccess }: { employee: Employee; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ reviewPeriod: '', rating: 3, goalsSet: '', goalsAchieved: '', comments: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (field: keyof typeof form, val: string | number) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/performance`,
      method: 'POST',
      data: {
        employeeId: employee._id,
        reviewPeriod: form.reviewPeriod,
        rating: form.rating,
        goalsSet: form.goalsSet.split('\n').map((s) => s.trim()).filter(Boolean),
        goalsAchieved: form.goalsAchieved.split('\n').map((s) => s.trim()).filter(Boolean),
        comments: form.comments || undefined,
      },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-primary">New Appraisal</h2>
            <p className="text-xs text-foreground/50">{employee.fullName} · {employee.designation}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="appraisal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Review Period <span className="text-danger">*</span></label>
            <input required value={form.reviewPeriod} onChange={(e) => set('reviewPeriod', e.target.value)}
              placeholder="e.g. Q2 2026 or Term 1 2026"
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Rating <span className="text-danger">*</span></label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => set('rating', r)}
                  className={cn('flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                    form.rating === r ? 'bg-amber-400 text-white border-amber-400 shadow-sm' : 'border-gray-200 text-foreground/50 hover:border-amber-300')}>
                  <span className="text-lg font-bold leading-none">{r}</span>
                  <span>{r === 5 ? 'Outstanding' : r === 4 ? 'Exceeds' : r === 3 ? 'Meets' : r === 2 ? 'Needs Work' : 'Unsatisfactory'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Goals Set</label>
            <textarea value={form.goalsSet} onChange={(e) => set('goalsSet', e.target.value)}
              placeholder="One goal per line…" rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Goals Achieved</label>
            <textarea value={form.goalsAchieved} onChange={(e) => set('goalsAchieved', e.target.value)}
              placeholder="One goal per line…" rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Comments</label>
            <textarea value={form.comments} onChange={(e) => set('comments', e.target.value)}
              placeholder="Reviewer's overall comments…" rows={3}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="appraisal-form" variant="accent" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Appraisal'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const DEPARTMENTS = ['Lower Primary','Upper Primary','Junior Secondary','Senior Secondary','Administration','Finance','ICT','Library','Games and Sports','Guidance and Counselling'];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [records, setRecords] = useState<AppraisalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees`, params: { limit: 300 }, showToast: false,
      thenFn: (r) => setEmployees(r.data?.data ?? []),
      finallyFn: () => setListLoading(false),
    });
    apiCallFunction<any>({ url: `${API_BASE_URL}/performance/alerts`, showToast: false,
      thenFn: (r) => setAlerts(r.data ?? []),
    });
  }, []);

  const loadRecords = useCallback((emp: Employee) => {
    setSelected(emp);
    setRecordsLoading(true);
    setRecords([]);
    apiCallFunction<any>({ url: `${API_BASE_URL}/performance/${emp._id}`, showToast: false,
      thenFn: (r) => setRecords(r.data ?? []),
      finallyFn: () => setRecordsLoading(false),
    });
  }, []);

  const refetchRecords = useCallback(() => {
    if (!selected) return;
    loadRecords(selected);
  }, [selected, loadRecords]);

  const filtered = employees.filter((e) => {
    if (filterDept && e.department !== filterDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.fullName.toLowerCase().includes(q) && !e.staffNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredRecords = periodFilter
    ? records.filter(r => r.reviewPeriod.toLowerCase().includes(periodFilter.toLowerCase()))
    : records;

  const avgRating = records.length ? (records.reduce((s, r) => s + r.rating, 0) / records.length) : null;
  const trend = records.length >= 2 ? records[0].rating - records[1].rating : null;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)]">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-primary to-[#1a3461] p-5 text-white shadow-lg flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Performance & Appraisals</h1>
            <p className="text-white/60 text-sm mt-0.5">Select an employee to view or add appraisal records</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2.5 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-300" />
            <div>
              <p className="text-sm font-bold text-white">{alerts.length} Low Performer{alerts.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-white/60">Flagged for consecutive low ratings</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left — employee list */}
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-3 border-b bg-gray-50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or Staff ID…"
                className="w-full pl-9 pr-3 h-9 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="w-full h-9 border rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-foreground/40 gap-2">
                <Users className="h-8 w-8" />
                <p className="text-xs">No employees found.</p>
              </div>
            ) : filtered.map((emp) => {
              const isAlert = alerts.some((a) => a.employee?._id === emp._id || String(a.employee?._id) === emp._id);
              const isSelected = selected?._id === emp._id;
              return (
                <button key={emp._id} onClick={() => loadRecords(emp)}
                  className={cn('w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all border-b border-gray-50 hover:bg-gray-50',
                    isSelected && 'bg-primary/5 border-l-2 border-l-primary')}>
                  <Avatar name={emp.fullName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                        {emp.fullName}
                      </p>
                      {isAlert && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-foreground/50 truncate">{emp.designation}</p>
                  </div>
                  <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-primary' : 'text-foreground/20')} />
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-foreground/40 font-medium">
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Right — appraisal detail */}
        <div className="flex-1 min-w-0 rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary/30" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground/50">No employee selected</p>
                <p className="text-sm text-foreground/30 mt-1">Pick a name from the list to view appraisal history</p>
              </div>
            </div>
          ) : (
            <>
              {/* Employee header */}
              <div className="bg-gradient-to-r from-primary to-[#1a3461] px-6 py-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.fullName} />
                  <div>
                    <h2 className="font-bold text-white">{selected.fullName}</h2>
                    <p className="text-white/60 text-xs mt-0.5">{selected.designation} · {selected.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {avgRating !== null && (
                    <div className="text-right">
                      <p className="text-xs text-white/50">Avg Rating</p>
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={Math.round(avgRating)} />
                        <span className="text-white font-bold text-sm">{avgRating.toFixed(1)}</span>
                        {trend !== null && trend !== 0 && (
                          trend > 0
                            ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                            : <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  )}
                  <Button size="sm" className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 shrink-0"
                    onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4" /> Add Appraisal
                  </Button>
                </div>
              </div>

              {/* Period filter */}
              <div className="px-5 pt-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                  <input value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
                    placeholder="Filter by review period (e.g. Q1 2026)…"
                    className="w-full pl-9 pr-3 h-9 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* Records */}
              <div className="flex-1 overflow-y-auto p-5">
                {recordsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-3">
                    <Star className="h-10 w-10" />
                    <p className="text-sm font-medium">No appraisals yet</p>
                    <button onClick={() => setShowModal(true)}
                      className="text-xs font-semibold text-primary hover:underline">
                      Add the first appraisal →
                    </button>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-3">
                    <Search className="h-10 w-10" />
                    <p className="text-sm font-medium">No records match &ldquo;{periodFilter}&rdquo;</p>
                    <button onClick={() => setPeriodFilter('')} className="text-xs font-semibold text-primary hover:underline">Clear filter</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecords.map((record) => (
                      <div key={record._id} className="rounded-xl border bg-white shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-900">{record.reviewPeriod}</p>
                            <p className="text-xs text-foreground/40 mt-0.5">
                              {new Date(record.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <StarRating rating={record.rating} />
                            <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', ratingColor(record.rating))}>
                              {ratingLabel(record.rating)}
                            </span>
                          </div>
                        </div>

                        {record.comments && (
                          <p className="text-sm text-foreground/70 italic border-l-2 border-gray-200 pl-3 mb-3">
                            "{record.comments}"
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          {record.goalsSet?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide mb-1.5">Goals Set</p>
                              <ul className="space-y-1">
                                {record.goalsSet.map((g, i) => (
                                  <li key={i} className="text-xs text-foreground/70 flex gap-1.5">
                                    <span className="text-primary/50 shrink-0">·</span>{g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {record.goalsAchieved?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide mb-1.5">Goals Achieved</p>
                              <ul className="space-y-1">
                                {record.goalsAchieved.map((g, i) => (
                                  <li key={i} className="text-xs text-foreground/70 flex gap-1.5">
                                    <span className="text-emerald-500 shrink-0">✓</span>{g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && selected && (
        <AddAppraisalModal
          employee={selected}
          onClose={() => setShowModal(false)}
          onSuccess={refetchRecords}
        />
      )}
    </div>
  );
}
