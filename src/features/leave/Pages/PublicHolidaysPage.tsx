'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { usePublicHolidays } from '../Hooks/usePublicHolidays';

function AddHolidayModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isRecurringAnnually, setIsRecurringAnnually] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">Add Public Holiday</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Labour Day"
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Date <span className="text-red-400">*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <input type="checkbox" checked={isRecurringAnnually} onChange={e => setIsRecurringAnnually(e.target.checked)} className="accent-brand-primary" />
            Recurs annually
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={() => onSave({ name, date, isRecurringAnnually })} disabled={!name.trim() || !date}
            className="h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            Add Holiday
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicHolidaysPage() {
  const locale = useLocale();
  const [year, setYear] = useState(new Date().getFullYear());
  const { holidays, loading, create, remove } = usePublicHolidays(year);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Leave
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Public Holidays</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Holidays excluded from leave day calculations</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Add Holiday
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No public holidays added for {year} yet.</p>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          {holidays.map(h => (
            <div key={h._id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
              <div>
                <p className="text-sm font-medium text-brand-text">{h.name}</p>
                <p className="text-xs text-brand-text-muted">{new Date(h.date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{h.isRecurringAnnually ? ' · Recurs annually' : ''}</p>
              </div>
              <button onClick={() => remove(h._id, () => toast.success('Removed.'))} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddHolidayModal onClose={() => setShowAdd(false)} onSave={(data) => create(data, () => { toast.success('Holiday added.'); setShowAdd(false); })} />
      )}
    </div>
  );
}
