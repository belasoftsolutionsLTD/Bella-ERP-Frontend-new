'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCw, Trash2, Briefcase, DollarSign, CalendarDays, FileText, Download, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { TaskList } from './TaskList';
import type { OnboardingEntry, OnboardingTask } from '../Hooks/useOnboarding';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

interface OfferDetails {
  jobTitle?: string;
  grossPay?: number;
  startDate?: string;
  jobGroupId?: string;
  jobGroupName?: string;
  designationId?: string;
  designationName?: string;
  jdType?: 'custom' | 'template' | null;
  jdPdfPath?: string;
  jdPdfOriginalName?: string;
  jdTemplateId?: string;
  probationMonths?: number;
  probationEndDate?: string;
}

interface Props { entry: OnboardingEntry; onComplete: (id: string) => void; onRemove?: (id: string) => void; autoExpand?: boolean }

export function OnboardingEmployeeRow({ entry, onComplete, onRemove, autoExpand }: Props) {
  const [expanded, setExpanded]       = useState(autoExpand ?? false);
  const [tasks, setTasks]             = useState<OnboardingTask[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask]         = useState({ taskTitle: '', assignedDepartment: 'HR', dueDate: '', description: '' });
  const [saving, setSaving]           = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [offerDetails, setOfferDetails]   = useState<OfferDetails | null>(null);

  const loadTasks = () => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/onboarding/${entry.employee._id}`,
      showToast: false,
      thenFn: (r) => setTasks(r.data ?? []),
    });
  };

  useEffect(() => {
    if (!expanded) return;
    loadTasks();
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/onboarding/${entry.employee._id}/details`,
      showToast: false,
      thenFn: (r) => setOfferDetails(r.data ?? null),
    });
  }, [expanded, entry.employee._id]);

  const handleComplete = (id: string) => {
    onComplete(id);
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: 'completed' as const } : t));
  };

  const handleUpdated = () => loadTasks();

  const handleDeleted = (id: string) => {
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.taskTitle.trim() || !newTask.dueDate) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/${entry.employee._id}/tasks`,
      method: 'POST',
      data: newTask,
      thenFn: () => {
        toast.success('Task added.');
        setNewTask({ taskTitle: '', assignedDepartment: 'HR', dueDate: '', description: '' });
        setShowAddForm(false);
        loadTasks();
      },
    });
    setSaving(false);
  };

  const handleAssignDefaults = () => {
    apiCallFunction({
      url: `${API_BASE_URL}/hr/onboarding/${entry.employee._id}/assign-defaults`,
      method: 'POST',
      thenFn: () => {
        toast.success('Default tasks assigned.');
        loadTasks();
      },
    });
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 pr-3">
        <button
          className="flex-1 flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown className="h-5 w-5 text-foreground/40 shrink-0" />
            : <ChevronRight className="h-5 w-5 text-foreground/40 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold text-sm">{entry.employee.fullName}</p>
            <p className="text-xs text-foreground/50">{entry.employee.staffNumber} · {entry.employee.department}</p>
          </div>
          <div className="w-48 shrink-0">
            <OnboardingProgressBar percentage={entry.percentage} />
            <p className="text-xs text-foreground/50 mt-1 text-right">{entry.completed}/{entry.total} tasks done</p>
          </div>
        </button>

        {/* Remove employee from onboarding */}
        {confirmRemove ? (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-xs text-red-600 font-medium">Remove?</span>
            <button onClick={() => { onRemove?.(String(entry.employee._id)); setConfirmRemove(false); }}
              className="text-xs font-bold text-red-600 hover:underline">Yes</button>
            <button onClick={() => setConfirmRemove(false)} className="text-xs text-foreground/40 hover:text-foreground">No</button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
            className="p-2 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            title="Remove from onboarding">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">

          {/* Offer / JD details card */}
          {offerDetails && (offerDetails.jobTitle || offerDetails.grossPay || offerDetails.startDate || offerDetails.jobGroupName || offerDetails.designationName) && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Offer Details</p>
                {/* Probation badge */}
                {offerDetails.probationMonths && offerDetails.probationMonths > 0 && (
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full border',
                    offerDetails.probationEndDate && new Date(offerDetails.probationEndDate) > new Date()
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-foreground/50 border-gray-200'
                  )}>
                    {offerDetails.probationMonths}mo probation
                    {offerDetails.probationEndDate && (
                      <span className="ml-1 font-normal opacity-70">
                        · ends {new Date(offerDetails.probationEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {(offerDetails.designationName || offerDetails.jobTitle) && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    <div>
                      <p className="text-xs text-foreground/40">Designation</p>
                      <p className="font-medium">{offerDetails.designationName || offerDetails.jobTitle}</p>
                    </div>
                  </div>
                )}
                {offerDetails.jobGroupName && (
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    <div><p className="text-xs text-foreground/40">Job Group</p><p className="font-medium">{offerDetails.jobGroupName}</p></div>
                  </div>
                )}
                {offerDetails.grossPay ? (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    <div><p className="text-xs text-foreground/40">Gross Pay</p><p className="font-medium">KES {Number(offerDetails.grossPay).toLocaleString()}</p></div>
                  </div>
                ) : null}
                {offerDetails.startDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    <div><p className="text-xs text-foreground/40">Start Date</p><p className="font-medium">{new Date(offerDetails.startDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p></div>
                  </div>
                )}
              </div>

              {/* JD PDF link — custom upload or template */}
              {(offerDetails.jdPdfPath || offerDetails.jdTemplateId) && (
                <div className="pt-2 border-t border-primary/10">
                  <button
                    onClick={async () => {
                      const token = sessionStorage.getItem('token');
                      const res = await fetch(`${API_BASE_URL}/hr/onboarding/${entry.employee._id}/jd-pdf`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (!res.ok) return;
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-white border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Job Description PDF
                    <Download className="h-3 w-3 opacity-60" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Task
            </button>
            <button
              onClick={handleAssignDefaults}
              className="flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-foreground/60"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-assign Defaults
            </button>
          </div>

          {/* Inline add task form */}
          {showAddForm && (
            <form onSubmit={handleAddTask} className="rounded-xl border bg-gray-50 p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={newTask.taskTitle}
                  onChange={(e) => setNewTask((f) => ({ ...f, taskTitle: e.target.value }))}
                  placeholder="Task title *"
                  required
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={newTask.assignedDepartment}
                  onChange={(e) => setNewTask((f) => ({ ...f, assignedDepartment: e.target.value }))}
                  placeholder="Assigned to (e.g. HR)"
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((f) => ({ ...f, dueDate: e.target.value }))}
                  required
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={newTask.description}
                  onChange={(e) => setNewTask((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notes (optional)"
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-white transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {saving ? 'Saving…' : 'Save Task'}
                </button>
              </div>
            </form>
          )}

          <TaskList tasks={tasks} onComplete={handleComplete} onUpdated={handleUpdated} onDeleted={handleDeleted} />

          {tasks.length === 0 && (
            <p className="text-xs text-foreground/40 text-center py-4">No tasks yet. Add one or assign defaults.</p>
          )}
        </div>
      )}
    </div>
  );
}
