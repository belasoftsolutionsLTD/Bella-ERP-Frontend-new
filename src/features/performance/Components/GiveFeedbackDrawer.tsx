'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface Employee { _id: string; fullName: string; designation?: string; staffNumber?: string }

interface Props {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  saving?: boolean;
}

const TYPES = [
  { value: 'positive',     label: '👍 Positive',    cls: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
  { value: 'constructive', label: '💡 Constructive', cls: 'border-amber-500 bg-amber-500/10 text-amber-300'      },
  { value: 'recognition',  label: '🏅 Recognition',  cls: 'border-violet-500 bg-violet-500/10 text-violet-300'   },
];

const CATEGORIES = ['Communication', 'Leadership', 'Delivery', 'Teamwork', 'Technical Skills', 'Attitude', 'Other'];

export function GiveFeedbackDrawer({ onClose, onSave, saving }: Props) {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [search, setSearch]         = useState('');
  const [focused, setFocused]       = useState(false);
  const [recipient, setRecipient]   = useState<Employee | null>(null);
  const [type, setType]             = useState('positive');
  const [category, setCategory]     = useState('');
  const [message, setMessage]       = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      params: { limit: 500 },
      showToast: false,
      thenFn: r => setEmployees(r.data?.data ?? []),
    });
  }, []);

  const filtered = (focused || search.trim())
    ? employees.filter(e => {
        const q = search.toLowerCase().trim();
        return !q
          || e.fullName.toLowerCase().includes(q)
          || (e.staffNumber ?? '').toLowerCase().includes(q);
      })
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !message.trim()) return;
    onSave({ recipientId: recipient._id, type, category: category || 'general', message: message.trim(), visibility });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">Give Feedback</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Share recognition or constructive feedback</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="feedback-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Recipient <span className="text-red-400">*</span>
            </label>
            {recipient ? (
              <div className="flex items-center justify-between bg-brand-bg-soft border border-brand-primary rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-brand-primary flex items-center justify-center text-xs text-white font-bold">
                    {recipient.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{recipient.fullName}</p>
                    {recipient.designation && <p className="text-[11px] text-brand-text-secondary">{recipient.designation}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => setRecipient(null)} className="text-xs text-brand-text-muted hover:text-brand-text-secondary">Change</button>
              </div>
            ) : (
              <div className="relative">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder="Search by name or staff ID…"
                  className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                {filtered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                    {filtered.slice(0, 8).map(emp => (
                      <button key={emp._id} type="button"
                        onClick={() => { setRecipient(emp); setSearch(''); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-soft transition-colors">
                        <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center text-xs text-white font-bold shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-brand-text">{emp.fullName}</p>
                          <p className="text-[11px] text-brand-text-muted">
                            {emp.staffNumber && <span className="mr-1">{emp.staffNumber}</span>}
                            {emp.designation && <span>{emp.designation}</span>}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">
              Feedback Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all',
                    type === t.value ? t.cls : 'border-brand-border bg-brand-bg-soft text-brand-text-muted hover:border-brand-border-strong',
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Share your feedback in detail (min 50 characters)…"
              rows={5}
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
            <p className="text-[11px] text-brand-text-muted mt-1">{message.length} chars</p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">Visibility</label>
            <div className="flex gap-3">
              {(['private', 'public'] as const).map(v => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all',
                    visibility === v
                      ? 'border-brand-primary bg-brand-primary/10 text-indigo-300'
                      : 'border-brand-border bg-brand-bg-soft text-brand-text-muted hover:border-brand-border-strong',
                  )}>
                  {v}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-brand-text-muted mt-1">
              {visibility === 'private' ? 'Only visible to recipient and their manager.' : 'Visible to the whole team.'}
            </p>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button type="submit" form="feedback-form" disabled={saving || !recipient || message.trim().length < 50}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>

      </div>
    </div>
  );
}
