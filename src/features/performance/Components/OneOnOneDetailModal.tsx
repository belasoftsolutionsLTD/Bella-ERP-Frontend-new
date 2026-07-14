'use client';

import { useState } from 'react';
import { X, Plus, Check, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOneOnOnes } from '../Hooks/useOneOnOnes';
import type { OneOnOne } from '../constants';

interface Props {
  oneOnOne: OneOnOne;
  onClose: () => void;
}

export function OneOnOneDetailModal({ oneOnOne, onClose }: Props) {
  const { userData, isHR } = useAuth();
  const { addAgendaItem, toggleAgendaItem, update, complete, refetch } = useOneOnOnes();
  const [newItem, setNewItem] = useState('');
  const [sharedNotes, setSharedNotes] = useState(oneOnOne.sharedNotes || '');
  const [privateNotes, setPrivateNotes] = useState(oneOnOne.privateManagerNotes || '');

  const isManager = userData?.employeeId && String(userData.employeeId) === String(oneOnOne.managerId);
  const canSeePrivateNotes = isManager || isHR;

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    addAgendaItem(oneOnOne._id, newItem.trim(), () => setNewItem(''));
  };

  const saveNotes = () => {
    update(oneOnOne._id, { sharedNotes, ...(canSeePrivateNotes ? { privateManagerNotes: privateNotes } : {}) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">
              {oneOnOne.manager?.fullName ?? 'Manager'} &amp; {oneOnOne.employee?.fullName ?? 'Employee'}
            </h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">{new Date(oneOnOne.scheduledAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-brand-text mb-2">Agenda</h3>
            <div className="space-y-1.5">
              {oneOnOne.agendaItems.map((item) => (
                <button key={item.id} onClick={() => toggleAgendaItem(oneOnOne._id, item.id)}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg bg-brand-bg-soft border border-brand-border hover:border-brand-border-strong transition-colors">
                  <div className={cn('h-4 w-4 rounded border shrink-0 flex items-center justify-center', item.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-brand-border-strong')}>
                    {item.isDone && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={cn('text-sm', item.isDone ? 'text-brand-text-muted line-through' : 'text-brand-text')}>{item.text}</span>
                </button>
              ))}
              {oneOnOne.agendaItems.length === 0 && <p className="text-xs text-brand-text-muted">No agenda items yet.</p>}
            </div>
            {oneOnOne.status === 'scheduled' && (
              <div className="flex items-center gap-2 mt-2">
                <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add a topic to discuss…"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                  className="flex-1 h-9 bg-brand-bg-soft border border-brand-border rounded-lg px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                <button onClick={handleAddItem} className="p-2 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary"><Plus className="h-4 w-4" /></button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Shared Notes</label>
            <textarea value={sharedNotes} onChange={(e) => setSharedNotes(e.target.value)} onBlur={saveNotes} rows={3}
              placeholder="Visible to both of you…"
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          </div>

          {canSeePrivateNotes && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Private Manager Notes</label>
              <textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} onBlur={saveNotes} rows={3}
                placeholder="Only visible to you…"
                className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', oneOnOne.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand-bg-muted text-brand-text-secondary')}>
            {oneOnOne.status === 'completed' ? 'Completed' : 'Scheduled'}
          </span>
          {oneOnOne.status === 'scheduled' && (
            <button onClick={() => complete(oneOnOne._id, () => { refetch(); onClose(); })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
