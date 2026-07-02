'use client';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import {
  X, ChevronDown, CheckCircle2, Circle, Clock, Ban, AlertTriangle,
  FileText, Wrench, CalendarCheck, ClipboardCheck, Shield,
  MessageSquare, Link2, List, Plus, ChevronRight,
  User, Pencil, RotateCcw, Send, Activity,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, TaskType, TaskComment, ActivityEntry, Subtask } from '../types';

// ── Style constants ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: 'Not Started', color: 'bg-slate-700 text-slate-300',  icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-indigo-900 text-indigo-300', icon: Clock },
  completed:   { label: 'Completed',   color: 'bg-emerald-900 text-emerald-400',icon: CheckCircle2 },
  overdue:     { label: 'Overdue',     color: 'bg-red-900/60 text-red-400',    icon: AlertTriangle },
  blocked:     { label: 'Blocked',     color: 'bg-slate-800 text-slate-400',   icon: Ban },
};
const PRIORITY_CFG: Record<TaskPriority, { label: string; dot: string }> = {
  high:   { label: 'High',   dot: 'bg-red-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  low:    { label: 'Low',    dot: 'bg-slate-500' },
};
const TYPE_CFG: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  action:    { label: 'Action',    icon: ClipboardCheck, color: 'text-blue-400' },
  document:  { label: 'Document',  icon: FileText,       color: 'text-purple-400' },
  form:      { label: 'Form',      icon: FileText,       color: 'text-pink-400' },
  meeting:   { label: 'Meeting',   icon: CalendarCheck,  color: 'text-green-400' },
  equipment: { label: 'Equipment', icon: Wrench,         color: 'text-orange-400' },
  approval:  { label: 'Approval',  icon: Shield,         color: 'text-amber-400' },
};
const MODULE_LABELS: Record<string, string> = {
  onboarding: 'Onboarding', offboarding: 'Offboarding', hr: 'HR',
  it: 'IT', performance: 'Performance', general: 'General',
  new_hire: 'New Hire', probation_end: 'Probation', role_change: 'Role Change',
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';
const fmtTs   = (d: string) => new Date(d).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });

// ─────────────────────────────────────────────────────────────────────────────
export default function TaskDetailDrawer({
  task: initialTask,
  onClose,
  onUpdate,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (t: Task) => void;
}) {
  const [task, setTask]           = useState<Task>(initialTask);
  const [activeSection, setActive] = useState<'details' | 'comments' | 'activity'>('details');
  const [editingTitle, setEditTitle] = useState(false);
  const [titleDraft, setTitleDraft]  = useState(task.title);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [newSubtask, setNewSubtask]  = useState('');
  const [showStatusDrop, setStatusDrop] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTask(initialTask); setTitleDraft(initialTask.title); }, [initialTask]);
  useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const patch = async (data: Partial<Task>) => {
    await apiCallFunction({
      url: `${API_BASE_URL}/tasks/${task._id}`,
      method: 'PUT',
      data,
      showToast: false,
      thenFn: () => {
        const updated = { ...task, ...data };
        setTask(updated as Task);
        onUpdate(updated as Task);
      },
    });
  };

  const changeStatus = async (status: TaskStatus) => {
    setStatusDrop(false);
    if (status === 'completed') {
      await apiCallFunction({
        url: `${API_BASE_URL}/tasks/${task._id}/complete`,
        method: 'PUT',
        showToast: true,
        thenFn: () => { const u = { ...task, status, completedAt: new Date().toISOString() }; setTask(u as Task); onUpdate(u as Task); },
      });
    } else {
      await patch({ status });
    }
  };

  const saveTitle = async () => {
    setEditTitle(false);
    if (titleDraft.trim() && titleDraft !== task.title) await patch({ title: titleDraft.trim() });
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    setSavingComment(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/tasks/${task._id}/comment`,
      method: 'POST',
      data: { text: commentText },
      showToast: false,
      thenFn: (r: any) => {
        const c = r.data as TaskComment;
        setTask(prev => ({ ...prev, comments: [...(prev.comments || []), c] }));
        setCommentText('');
      },
      finallyFn: () => setSavingComment(false),
    });
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    await apiCallFunction({
      url: `${API_BASE_URL}/tasks/${task._id}/subtask`,
      method: 'POST',
      data: { title: newSubtask.trim() },
      showToast: false,
      thenFn: (r: any) => {
        const st = r.data as Subtask;
        setTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), st] }));
        setNewSubtask('');
      },
    });
  };

  const toggleSubtask = async (subId: string, current: boolean) => {
    await apiCallFunction({
      url: `${API_BASE_URL}/tasks/${task._id}/subtask/${subId}`,
      method: 'PUT',
      data: { isCompleted: !current },
      showToast: false,
      thenFn: () => {
        setTask(prev => ({
          ...prev,
          subtasks: prev.subtasks.map(s => s._id === subId ? { ...s, isCompleted: !current } : s),
        }));
      },
    });
  };

  const reopenTask = () => apiCallFunction({
    url: `${API_BASE_URL}/tasks/${task._id}/reopen`,
    method: 'PUT',
    thenFn: () => { const u = { ...task, status: 'not_started' as TaskStatus, completedAt: undefined }; setTask(u); onUpdate(u); },
  });

  const scfg = STATUS_CFG[task.status] ?? STATUS_CFG.not_started;
  const SIcon = scfg.icon;
  const tcfg  = TYPE_CFG[task.type];
  const TIcon = tcfg?.icon ?? ClipboardCheck;
  const pcfg  = PRIORITY_CFG[task.priority];
  const subtasksDone  = (task.subtasks || []).filter(s => s.isCompleted).length;
  const subtasksTotal = (task.subtasks || []).length;
  const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[640px] bg-[#0f172a] border-l border-slate-800 flex flex-col shadow-2xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitleDraft(task.title); } }}
                className="w-full text-lg font-bold text-slate-100 bg-transparent border-b border-indigo-500 outline-none pb-0.5"
              />
            ) : (
              <h2
                className="text-lg font-bold text-slate-100 cursor-pointer hover:text-indigo-300 transition-colors leading-snug"
                onClick={() => setEditTitle(true)}
              >
                {task.title}
                <Pencil className="inline ml-2 h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100" />
              </h2>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Status badge – clickable */}
              <div className="relative">
                <button
                  onClick={() => setStatusDrop(p => !p)}
                  className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', scfg.color)}
                >
                  <SIcon className="h-3 w-3" /> {scfg.label} <ChevronDown className="h-3 w-3 ml-0.5" />
                </button>
                {showStatusDrop && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
                    {(Object.keys(STATUS_CFG) as TaskStatus[]).map(s => {
                      const c = STATUS_CFG[s]; const I = c.icon;
                      return (
                        <button key={s} onClick={() => changeStatus(s)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-700 text-slate-300">
                          <I className="h-3.5 w-3.5" /> {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400')}>
                <span className={cn('h-2 w-2 rounded-full', pcfg?.dot)} /> {pcfg?.label}
              </span>
              {tcfg && (
                <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  <TIcon className={cn('h-3 w-3', tcfg.color)} /> {tcfg.label}
                </span>
              )}
              {task.module && (
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {MODULE_LABELS[task.module] ?? task.module}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 shrink-0 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Section tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-slate-800 shrink-0">
          {([
            { key: 'details',  label: 'Details',  icon: List },
            { key: 'comments', label: `Comments${(task.comments?.length ?? 0) > 0 ? ` (${task.comments.length})` : ''}`, icon: MessageSquare },
            { key: 'activity', label: 'Activity', icon: Activity },
          ] as { key: typeof activeSection; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActive(key)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-3 py-2 border-b-2 transition-colors',
                activeSection === key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300',
              )}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── DETAILS ── */}
          {activeSection === 'details' && (
            <div className="px-6 py-5 space-y-5">

              {/* Quick fields */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={task.status} onChange={e => changeStatus(e.target.value as TaskStatus)}
                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {(Object.keys(STATUS_CFG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={task.priority} onChange={e => patch({ priority: e.target.value as TaskPriority })}
                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
                <Field label="Type">
                  <select value={task.type} onChange={e => patch({ type: e.target.value as TaskType })}
                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Due Date">
                  <input type="date" value={task.dueDate || ''} onChange={e => patch({ dueDate: e.target.value })}
                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </Field>
                <Field label="Module">
                  <select value={task.module || ''} onChange={e => patch({ module: e.target.value as Task['module'] })}
                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Assigned To">
                  <p className="text-xs text-slate-300 h-8 flex items-center">{task.assignedToName || '—'}</p>
                </Field>
              </div>

              {/* Linked employee */}
              {task.linkedEmployee && (
                <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700">
                  <div className="h-8 w-8 rounded-lg bg-indigo-900/60 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{task.linkedEmployee.fullName}</p>
                    <p className="text-xs text-slate-500">{task.linkedEmployee.department} · {task.linkedEmployee.designation}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                    {MODULE_LABELS[task.module] ?? task.module}
                  </span>
                </div>
              )}

              {/* Due date alert */}
              {isOverdue && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  This task was due {fmtDate(task.dueDate)} and is overdue.
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <textarea
                  value={task.description || ''}
                  onChange={e => setTask(prev => ({ ...prev, description: e.target.value }))}
                  onBlur={e => patch({ description: e.target.value })}
                  rows={4}
                  placeholder="Add a description or more context..."
                  className="w-full text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                />
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Subtasks {subtasksTotal > 0 && <span className="text-slate-400 normal-case font-normal ml-1">{subtasksDone}/{subtasksTotal}</span>}
                  </p>
                </div>
                <div className="space-y-1.5 mb-2">
                  {(task.subtasks || []).map(st => (
                    <div key={st._id} className="flex items-center gap-2.5">
                      <button onClick={() => toggleSubtask(st._id, st.isCompleted)}
                        className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          st.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-indigo-500')}>
                        {st.isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </button>
                      <span className={cn('text-sm flex-1', st.isCompleted && 'line-through text-slate-600')}>{st.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubtask()}
                    placeholder="Add a subtask…"
                    className="flex-1 h-8 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                  />
                  <button onClick={addSubtask} className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                    Add
                  </button>
                </div>
              </div>

              {/* Dependencies */}
              {(task.blockedByTaskIds || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Blocked By</p>
                  <div className="space-y-1">
                    {task.blockedByTaskIds.map(id => (
                      <div key={id} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                        <Link2 className="h-3.5 w-3.5 text-slate-600" /> <span className="font-mono text-[10px] opacity-50">{id.slice(-8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-800">
                <p>Created by {task.createdByName || task.assignedBy || 'Unknown'}</p>
                {task.completedAt && <p>Completed {fmtDate(task.completedAt)}</p>}
              </div>
            </div>
          )}

          {/* ── COMMENTS ── */}
          {activeSection === 'comments' && (
            <div className="px-6 py-5 space-y-4">
              {(task.comments || []).length === 0 && (
                <p className="text-sm text-slate-600 py-8 text-center">No comments yet. Be the first to comment.</p>
              )}
              {(task.comments || []).map(c => (
                <div key={c._id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-900/60 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">
                    {(c.authorName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-slate-300">{c.authorName}</span>
                      <span className="text-[10px] text-slate-600">{fmtTs(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <textarea
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1 text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                />
                <button onClick={postComment} disabled={savingComment || !commentText.trim()}
                  className="self-end h-9 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {activeSection === 'activity' && (
            <div className="px-6 py-5 space-y-3">
              {(task.activity || []).length === 0 && (
                <p className="text-sm text-slate-600 py-8 text-center">No activity recorded.</p>
              )}
              {[...(task.activity || [])].reverse().map((a, i) => (
                <ActivityRow key={i} entry={a} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-600">Created {fmtDate(task.createdAt)}</p>
          {task.status === 'completed' ? (
            <button onClick={reopenTask}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 border border-slate-700 px-4 py-2 rounded-xl hover:text-slate-200 hover:border-slate-500 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Reopen
            </button>
          ) : (
            <button onClick={() => changeStatus('completed')}
              className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl transition-colors">
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  created:          { icon: Plus,        color: 'text-indigo-400' },
  completed:        { icon: CheckCircle2,color: 'text-emerald-400' },
  status_changed:   { icon: ChevronRight,color: 'text-blue-400' },
  reassigned:       { icon: User,        color: 'text-purple-400' },
  due_date_changed: { icon: CalendarCheck,color:'text-amber-400' },
};

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const cfg  = ACTIVITY_ICONS[entry.action] ?? { icon: Activity, color: 'text-slate-400' };
  const Icon = cfg.icon;
  const label = entry.action === 'status_changed'
    ? `Status changed: ${entry.from} → ${entry.to}`
    : entry.action === 'reassigned'
    ? `Reassigned to ${entry.to}`
    : entry.action === 'due_date_changed'
    ? `Due date changed to ${entry.to}`
    : entry.action;

  return (
    <div className="flex items-start gap-3">
      <div className={cn('h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5', cfg.color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 capitalize">{label}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {entry.performedByName} · {fmtTs(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}
