'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  LogOut, Plus, Search, X, Loader2, Trash2, ArrowRight,
  CheckCircle2, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useOffboarding, OffboardingEntry } from '../Hooks/useOffboarding';

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface EmpOption { _id: string; fullName: string; staffNumber: string; department: string }

// ── Start Offboarding Modal ────────────────────────────────────────────────────
function StartOffboardingModal({ onClose, onStarted, activeIds }: {
  onClose: () => void;
  onStarted: () => void;
  activeIds: Set<string>;
}) {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<EmpOption | null>(null);
  const [lastDay, setLastDay]     = useState('');
  const [starting, setStarting]   = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      thenFn: r => setEmployees(r.data?.data ?? r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (e.staffNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/offboarding`,
      method: 'POST',
      data: { employeeId: selected._id, ...(lastDay ? { lastDay } : {}) },
      thenFn: () => {
        toast.success(`Offboarding started for ${selected.fullName}.`);
        onStarted();
        onClose();
      },
    });
    setStarting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-sm">Start Offboarding</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-foreground/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee by name or staff no…"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="px-5 pb-3 max-h-56 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary/40" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-foreground/40 text-center py-8">No employees found.</p>
          ) : filtered.map(e => {
            const isActive = activeIds.has(String(e._id));
            return (
              <button key={e._id}
                onClick={() => !isActive && setSelected(e)}
                disabled={isActive}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-sm',
                  isActive ? 'border-amber-200 bg-amber-50 cursor-not-allowed opacity-70'
                    : selected?._id === e._id ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-transparent hover:bg-gray-50'
                )}>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                  isActive ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary')}>
                  {e.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{e.fullName}</p>
                  <p className="text-xs text-foreground/40">{e.staffNumber} · {e.department}</p>
                </div>
                {isActive && <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">In offboarding</span>}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="px-5 py-3 border-t bg-gray-50 space-y-3">
            <div className="flex items-center gap-3 bg-white border border-primary/20 rounded-xl px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{selected.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{selected.fullName}</p>
                <p className="text-xs text-foreground/40">{selected.staffNumber} · {selected.department}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-foreground/30 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                <Calendar className="h-3.5 w-3.5" /> Last Working Day
              </label>
              <input
                type="date"
                value={lastDay}
                onChange={e => setLastDay(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-slate-400">Leave blank to use today as the last day.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleStart}
            disabled={!selected || starting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {starting ? 'Starting…' : 'Start Offboarding'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offboarding Card ───────────────────────────────────────────────────────────
function OffboardingCard({ entry, locale, onRemove }: {
  entry: OffboardingEntry;
  locale: string;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const color    = avatarColor(entry.employee.fullName);
  const initials = entry.employee.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const pct      = entry.percentage;
  const done     = pct === 100;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="p-5 flex-1 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold', color)}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{entry.employee.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {entry.employee.designation || entry.employee.department}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                {entry.employee.department}
              </span>
              {entry.employee.contractEndDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">
                  <Calendar className="h-2.5 w-2.5" />
                  Last day: {new Date(entry.employee.contractEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </span>
              )}
              {done && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{entry.completed} of {entry.total} tasks completed</span>
            <span className={cn('font-bold', done ? 'text-emerald-600' : 'text-orange-600')}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', done ? 'bg-emerald-500' : 'bg-orange-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">{entry.employee.staffNumber}</p>
      </div>

      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <Link
          href={`/${locale}/offboarding/${entry.employee._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
        >
          View checklist <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {confirmRemove ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-600 font-medium">Remove?</span>
            <button onClick={onRemove} className="text-xs font-bold text-red-600 hover:underline">Yes</button>
            <button onClick={() => setConfirmRemove(false)} className="text-xs text-slate-400 hover:text-slate-600">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRemove(true)}
            title="Remove from offboarding"
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OffboardingPage() {
  const locale = useLocale();
  const [showStart, setShowStart] = useState(false);
  const [search, setSearch]       = useState('');
  const { entries, loading, refetch, removeOffboarding } = useOffboarding();

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.employee.fullName.toLowerCase().includes(q) ||
      e.employee.staffNumber.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const stats = useMemo(() => ({
    total:     entries.length,
    completed: entries.filter(e => e.percentage === 100).length,
    pending:   entries.filter(e => e.percentage < 100).length,
  }), [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Offboarding</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage employee departures and exit checklists</p>
        </div>
        <button
          onClick={() => setShowStart(true)}
          className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="h-4 w-4" />
          Start Offboarding
        </button>
      </div>

      {/* Summary tiles */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total departures', value: stats.total,     color: 'text-slate-700' },
            { label: 'In progress',      value: stats.pending,   color: 'text-orange-600' },
            { label: 'Completed',        value: stats.completed, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-48 flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or staff ID…"
            className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-4 border border-dashed rounded-2xl bg-white">
          <LogOut className="h-12 w-12" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-500">No active offboarding in progress</p>
            <p className="text-xs text-slate-400 mt-1">Click "Start Offboarding" to begin an employee exit process.</p>
          </div>
          <button
            onClick={() => setShowStart(true)}
            className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> Start Offboarding
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2 border rounded-2xl bg-white">
          <Search className="h-8 w-8" />
          <p className="text-sm text-slate-400">No results match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <OffboardingCard
              key={String(e.employee._id)}
              entry={e}
              locale={locale}
              onRemove={() => removeOffboarding(String(e.employee._id))}
            />
          ))}
        </div>
      )}

      {showStart && (
        <StartOffboardingModal
          activeIds={new Set(entries.map(e => String(e.employee._id)))}
          onClose={() => setShowStart(false)}
          onStarted={refetch}
        />
      )}
    </div>
  );
}
