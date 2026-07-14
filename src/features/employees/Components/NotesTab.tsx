'use client';
import { useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { Trash2, Plus, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'general_note',        label: 'General Note' },
  { value: 'commendation',        label: 'Commendation' },
  { value: 'verbal_warning',      label: 'Verbal Warning' },
  { value: 'written_warning',     label: 'Written Warning' },
  { value: 'disciplinary_action', label: 'Disciplinary Action' },
];

const CATEGORY_COLORS: Record<string, string> = {
  commendation:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  verbal_warning:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  written_warning:     'bg-orange-100 text-orange-700 border-orange-200',
  disciplinary_action: 'bg-red-100 text-red-700 border-red-200',
  general_note:        'bg-slate-100 text-slate-600 border-slate-200',
};

export function NotesTab({ employeeId }: { employeeId: string }) {
  const [notes,    setNotes]    = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('general_note');
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const fetchNotes = () => apiCallFunction<any>({
    url: `${API_BASE_URL}/staff-notes/${employeeId}`,
    showToast: false,
    thenFn: (r) => setNotes(r.data ?? []),
  });

  useEffect(() => { fetchNotes(); }, [employeeId]);

  const save = () => {
    if (!note.trim()) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/staff-notes`,
      method: 'POST',
      data: { employeeId, category, note: note.trim() },
      thenFn: () => { setNote(''); setShowForm(false); fetchNotes(); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (id: string) => {
    if (!confirm('Delete this note?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/staff-notes/${id}`,
      method: 'DELETE',
      thenFn: () => fetchNotes(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Staff Notes ({notes.length})</h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 h-8 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </button>
      </div>

      {/* Add note form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Write the note here…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !note.trim()}
              className="flex items-center gap-1.5 h-8 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : 'Save Note'}
            </button>
            <button onClick={() => { setShowForm(false); setNote(''); }} className="text-xs text-slate-500 hover:text-slate-700 px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="rounded-xl border bg-white divide-y divide-gray-100 overflow-hidden">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No notes recorded for this employee.</p>
        ) : notes.map((n) => (
          <div key={n._id} className="flex gap-3 p-4 hover:bg-slate-50 transition-colors">
            {/* Category badge */}
            <span className={cn(
              'shrink-0 self-start mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap',
              CATEGORY_COLORS[n.category] ?? 'bg-slate-100 text-slate-600 border-slate-200',
            )}>
              {n.category.replace(/_/g, ' ')}
            </span>

            {/* Note content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 leading-snug">{n.note}</p>

              {/* Author + timestamp — always visible, clearly attributed */}
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-2.5 w-2.5 text-slate-500" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {n.createdByName ?? n.createdByRole ?? 'HR'}
                </span>
                <span className="text-slate-300 text-xs">·</span>
                <span className="text-xs text-slate-400">
                  {n.createdAt
                    ? new Date(n.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) +
                      ' at ' +
                      new Date(n.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => del(n._id)}
              className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
