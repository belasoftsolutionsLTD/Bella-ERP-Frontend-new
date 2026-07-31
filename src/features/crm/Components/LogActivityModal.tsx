'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Trash2 } from 'lucide-react';
import { useLogActivity } from '../Hooks/useActivities';
import type { ActivityType, TaskPriority } from '../types';

const LOGGABLE: ActivityType[] = ['call', 'email', 'meeting', 'note'];
const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

export function LogActivityModal({ contactId, onClose, onLogged }: { contactId: string; onClose: () => void; onLogged: () => void }) {
  const t = useTranslations('CRM');
  const { logActivity, createTask } = useLogActivity();
  const [mode, setMode] = useState<'activity' | 'task'>('activity');
  const [type, setType] = useState<ActivityType>('call');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const addSubtaskDraft = () => {
    if (!subtaskDraft.trim()) return;
    setSubtaskTitles((prev) => [...prev, subtaskDraft.trim()]);
    setSubtaskDraft('');
  };

  const save = () => {
    if (!subject.trim()) return;
    setSaving(true);
    const action = mode === 'task'
      ? createTask({
          contactId, subject: subject.trim(), notes: notes.trim() || undefined, dueDate, priority,
          subtasks: subtaskTitles.length ? subtaskTitles.map((title) => ({ title })) : undefined,
        })
      : logActivity({ contactId, type, subject: subject.trim(), notes: notes.trim() || undefined });
    action?.then(() => { setSaving(false); onLogged(); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('activities.logActivity')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button onClick={() => setMode('activity')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === 'activity' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>{t('activities.activity')}</button>
          <button onClick={() => setMode('task')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === 'task' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>{t('activities.task')}</button>
        </div>

        {mode === 'activity' && (
          <select value={type} onChange={(e) => setType(e.target.value as ActivityType)} className="h-9 w-full border border-slate-200 rounded-lg px-2 text-sm">
            {LOGGABLE.map((ty) => <option key={ty} value={ty}>{t(`activities.type.${ty}`)}</option>)}
          </select>
        )}

        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('activities.subject')} className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('activities.notes')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
        {mode === 'task' && (
          <>
            <div className="flex items-center gap-2">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
                {PRIORITIES.map((p) => <option key={p} value={p}>{t(`tasks.priority.${p}`)}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">{t('tasks.subtasksLabel')}</p>
              {subtaskTitles.map((title, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs text-slate-600 pl-1">
                  <span>{title}</span>
                  <button onClick={() => setSubtaskTitles((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <input value={subtaskDraft} onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskDraft(); } }}
                  placeholder={t('tasks.subtaskTitle')} className="h-8 flex-1 border border-slate-200 rounded-lg px-2 text-xs" />
                <button onClick={addSubtaskDraft} className="text-xs font-semibold text-brand-primary">{t('common.add')}</button>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !subject.trim() || (mode === 'task' && !dueDate)} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
