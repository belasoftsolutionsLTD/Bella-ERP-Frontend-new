'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Users, MessageSquare, FileText, ListChecks,
  Plus, X, Check, Send, Trash2, Upload, Paperclip, Smile, Download,
  CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp,
  Search,
} from 'lucide-react';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';

// ── Backend URL for file serving ──────────────────────────────────────────────

const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');
function projectFileUrl(filename: string) {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  return `${BACKEND_URL}/uploads/projects/${filename}?token=${encodeURIComponent(token)}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectMember {
  _id: string;
  employeeId: string;
  role: 'team_leader' | 'member';
  name: string;
  department: string;
  employee?: { fullName: string; department: string; jobTitle: string } | null;
}

interface Project {
  _id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  departments: string[];
  supervisorName: string;
  teamLeaderId?: string | null;
  teamLeaderName?: string | null;
  createdBy: string;
  completedAt?: string | null;
  members: ProjectMember[];
  subtaskCount: number;
  completedSubtasks: number;
  deptProgress: Record<string, { total: number; completed: number }>;
  myRole: 'supervisor' | 'team_leader' | 'member' | null;
  myDepartment: string | null;
  supervisor?: { fullName: string; department: string; jobTitle: string } | null;
}

interface Subtask {
  _id: string;
  title: string;
  description?: string | null;
  department: string;
  status: 'not_started' | 'in_progress' | 'completed';
  attachmentFilename?: string | null;
  attachmentOriginalName?: string | null;
  assignedEmployees: { employeeId: string; name: string; status: string }[];
  deptHeadReport?: {
    text: string;
    attachmentFilename?: string | null;
    attachmentOriginalName?: string | null;
    submittedAt: string;
    submittedByName: string;
  } | null;
}

interface ProjectNote {
  _id: string;
  text: string;
  createdByName: string;
  createdAt: string;
  createdBy: string;
}

interface ChatMessage {
  _id: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachmentFilename?: string | null;
  attachmentOriginalName?: string | null;
  attachmentMimeType?: string | null;
  createdAt: string;
}

interface ChatGroup {
  _id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
  createdByName: string;
}

const CHAT_EMOJIS = [
  '😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😤','😡','🥺','😩','😴','🤧','🤯','😷',
  '👍','👎','🙌','👏','🙏','💪','✌️','🤞','👋','🤝','👊','🫡',
  '❤️','💕','💔','🧡','💛','💚','💙','💜','🖤',
  '🎉','🔥','✨','⭐','💯','✅','❌','🎊','🏆','🎯','🚀','💡','💰','🍕','☕','🎵',
];

function ChatEmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-brand-border p-3 z-50 w-72">
      <div className="grid grid-cols-9 gap-0.5 max-h-52 overflow-y-auto">
        {CHAT_EMOJIS.map((e, i) => (
          <button key={i} type="button" onClick={() => { onSelect(e); onClose(); }}
            className="h-8 w-8 text-lg hover:bg-brand-bg-soft rounded-lg flex items-center justify-center transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Employee { _id: string; fullName: string; department?: string; staffNumber?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate  = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';
const fmtTime  = (d: string)         => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
const fmtFull  = (d: string)         => new Date(d).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });

const SUBTASK_STATUS_MAP: Record<string, Status> = {
  not_started: 'draft', in_progress: 'inProgress', completed: 'completed',
};

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ project, onComplete, onRefresh }: {
  project: Project;
  onComplete: () => void;
  onRefresh: () => void;
}) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = () => {
    if (!confirm('Mark this project as complete? Only you can do this.')) return;
    setCompleting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/complete`,
      method: 'PUT',
      thenFn: () => { onRefresh(); onComplete(); },
      finallyFn: () => setCompleting(false),
    });
  };

  const pct = project.subtaskCount > 0
    ? Math.round((project.completedSubtasks / project.subtaskCount) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Subtasks', value: `${project.completedSubtasks}/${project.subtaskCount}` },
          { label: 'Members',  value: String(project.members.length + 1) },
          { label: 'Status',   value: project.status === 'completed' ? 'Done' : 'In Progress' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
            <p className="text-[11px] text-brand-text-secondary mb-1">{label}</p>
            <p className="text-[18px] font-bold text-brand-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {project.subtaskCount > 0 && (
        <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
          <div className="flex justify-between text-[12px] mb-2">
            <span className="text-brand-text-secondary font-semibold">Overall Progress</span>
            <span className="font-bold" style={{ color: pct === 100 ? '#22c55e' : '#6366f1' }}>{pct}%</span>
          </div>
          <div className="h-2.5 bg-brand-bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#6366f1' }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="bg-brand-bg-soft rounded-xl p-5 border border-brand-border space-y-3">
        <Row label="Supervisor"    value={project.supervisorName} />
        <Row label="Team Leader"   value={project.teamLeaderName || '—'} />
        <Row label="Start Date"    value={fmtDate(project.startDate)} />
        <Row label="End Date"      value={fmtDate(project.endDate)} />
        {project.completedAt && <Row label="Completed" value={fmtDate(project.completedAt)} />}
        {project.departments.length > 0 && (
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-text-secondary">Departments</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-xs">
              {project.departments.map(d => (
                <span key={d} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-department progress */}
      {Object.keys(project.deptProgress).length > 0 && (
        <div className="bg-brand-bg-soft rounded-xl p-5 border border-brand-border">
          <p className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Progress by Department</p>
          <div className="space-y-2.5">
            {Object.entries(project.deptProgress).map(([dept, dp]) => {
              const dp_pct = dp.total > 0 ? Math.round((dp.completed / dp.total) * 100) : 0;
              return (
                <div key={dept}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-brand-text-secondary font-medium">{dept}</span>
                    <span className="text-brand-text-secondary">{dp.completed}/{dp.total} subtasks</span>
                  </div>
                  <div className="h-1.5 bg-brand-bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${dp_pct}%`, background: dp_pct === 100 ? '#22c55e' : '#6366f1' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {project.description && (
        <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-border">
          <p className="text-[11px] font-semibold text-brand-text-secondary uppercase mb-2">Description</p>
          <p className="text-[13px] text-brand-text-secondary leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Complete button — supervisor only, project not done yet */}
      {project.myRole === 'supervisor' && project.status !== 'completed' && (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          {completing ? 'Completing…' : 'Mark Project as Complete'}
        </button>
      )}
      {project.status === 'completed' && (
        <div className="flex items-center justify-center gap-2 text-status-success-text py-3 text-[13px] font-semibold">
          <CheckCircle2 className="h-4 w-4" /> Project completed {project.completedAt ? `on ${fmtDate(project.completedAt)}` : ''}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-brand-text-secondary">{label}</span>
      <span className="text-brand-text font-medium">{value}</span>
    </div>
  );
}

// ── Subtasks Tab ──────────────────────────────────────────────────────────────

function SubtasksTab({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [subtasks, setSubtasks]       = useState<Subtask[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [employees, setEmployees]     = useState<Employee[]>([]);

  // Create form
  const [newTitle, setNewTitle]   = useState('');
  const [newDesc, setNewDesc]     = useState('');
  const [newDept, setNewDept]     = useState('');
  const [newFile, setNewFile]     = useState<File | null>(null);
  const [creating, setCreating]   = useState(false);

  // Assign form
  const [assignSearch, setAssignSearch]   = useState('');
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning]           = useState(false);

  // Report form
  const [reportText, setReportText]   = useState('');
  const [reportFile, setReportFile]   = useState<File | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const isSupervisor = project.myRole === 'supervisor';

  const fetchSubtasks = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${project._id}/subtasks`,
      showToast: false,
      thenFn: r => setSubtasks(r?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [project._id]);

  useEffect(() => { fetchSubtasks(); }, [fetchSubtasks]);

  useEffect(() => {
    if (!assigningId) return;
    if (employees.length > 0) return;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      thenFn: r => setEmployees(r?.data?.data ?? []),
    });
  }, [assigningId, employees.length]);

  const createSubtask = () => {
    if (!newTitle.trim() || !newDept) return;
    setCreating(true);
    const fd = new FormData();
    fd.append('title', newTitle.trim());
    if (newDesc) fd.append('description', newDesc);
    fd.append('department', newDept);
    if (newFile) fd.append('file', newFile);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/subtasks`,
      method: 'POST',
      data: fd,
      thenFn: () => { setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewDept(''); setNewFile(null); fetchSubtasks(); },
      finallyFn: () => setCreating(false),
    });
  };

  const deleteSubtask = (subId: string) => {
    if (!confirm('Delete this subtask?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/subtasks/${subId}`,
      method: 'DELETE',
      thenFn: fetchSubtasks,
    });
  };

  const assignEmployees = (subId: string) => {
    if (assignSelected.size === 0) return;
    setAssigning(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/subtasks/${subId}/assign`,
      method: 'POST',
      data: { employeeIds: [...assignSelected] },
      thenFn: () => { setAssigningId(null); setAssignSelected(new Set()); fetchSubtasks(); },
      finallyFn: () => setAssigning(false),
    });
  };

  const submitReport = (subId: string) => {
    if (!reportText.trim() && !reportFile) return;
    setSubmittingReport(true);
    const fd = new FormData();
    fd.append('reportText', reportText);
    if (reportFile) fd.append('file', reportFile);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/subtasks/${subId}/report`,
      method: 'POST',
      data: fd,
      thenFn: () => { setReportingId(null); setReportText(''); setReportFile(null); fetchSubtasks(); onRefresh(); },
      finallyFn: () => setSubmittingReport(false),
    });
  };

  // Group subtasks by department for supervisor view
  const byDept: Record<string, Subtask[]> = {};
  for (const s of subtasks) {
    if (!byDept[s.department]) byDept[s.department] = [];
    byDept[s.department].push(s);
  }

  const filteredEmps = employees.filter(e => {
    if (project.myDepartment && !isSupervisor) return e.department === project.myDepartment;
    return true;
  }).filter(e => !assignSearch.trim() || e.fullName.toLowerCase().includes(assignSearch.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Create subtask — supervisor only */}
      {isSupervisor && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Subtask
          </button>
        </div>
      )}

      {showCreate && isSupervisor && (
        <div className="bg-brand-bg-soft border border-brand-border-strong rounded-xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-brand-text-secondary uppercase tracking-wide">New Subtask</p>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Subtask title *"
            className="w-full h-9 px-3 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Assign to Department *</label>
              <select
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
              >
                <option value="">— Select dept —</option>
                {project.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Attachment (optional)</label>
              <input
                type="file"
                onChange={e => setNewFile(e.target.files?.[0] ?? null)}
                className="w-full text-[11px] text-brand-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-brand-primary file:text-white file:text-[11px] file:cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 h-8 text-[13px] text-brand-text-secondary border border-brand-border-strong rounded-lg hover:bg-brand-bg-muted">Cancel</button>
            <button
              onClick={createSubtask}
              disabled={creating || !newTitle.trim() || !newDept}
              className="px-4 h-8 text-[13px] bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : subtasks.length === 0 ? (
        <div className="text-center py-10 text-brand-text-muted">
          <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-[13px]">No subtasks yet.</p>
        </div>
      ) : isSupervisor ? (
        /* ── Supervisor view: grouped by dept ── */
        <div className="space-y-5">
          {Object.entries(byDept).map(([dept, subs]) => (
            <div key={dept}>
              <p className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-primary" /> {dept}
                <span className="font-normal text-brand-text-muted">({subs.filter(s => s.status === 'completed').length}/{subs.length} done)</span>
              </p>
              <div className="space-y-2">
                {subs.map(sub => (
                  <div key={sub._id} className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <StatusBadge status={SUBTASK_STATUS_MAP[sub.status] ?? 'draft'} label={sub.status.replace('_', ' ')} className="text-[10px] font-bold shrink-0" />
                      <p className="text-[13px] font-semibold text-brand-text flex-1 truncate">{sub.title}</p>
                      {sub.deptHeadReport && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-status-success-text shrink-0">Report in</span>
                      )}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); deleteSubtask(sub._id); }}
                        className="text-brand-text-muted hover:text-status-danger-text shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {expandedId === sub._id ? <ChevronUp className="h-3.5 w-3.5 text-brand-text-muted shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />}
                    </button>

                    {expandedId === sub._id && (
                      <div className="px-4 pb-4 space-y-3 border-t border-brand-border">
                        {sub.description && (
                          <p className="text-[12px] text-brand-text-secondary mt-3">{sub.description}</p>
                        )}
                        {sub.attachmentFilename && (
                          <a
                            href={projectFileUrl(sub.attachmentFilename)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[12px] text-brand-primary hover:text-brand-primary"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {sub.attachmentOriginalName || sub.attachmentFilename}
                          </a>
                        )}
                        {sub.assignedEmployees.length > 0 && (
                          <div>
                            <p className="text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">Assigned to</p>
                            <div className="flex flex-wrap gap-1">
                              {sub.assignedEmployees.map(ae => (
                                <span key={ae.employeeId} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">{ae.name}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {sub.deptHeadReport ? (
                          <div className="bg-status-success-bg border border-status-success-text/20 rounded-lg p-3">
                            <p className="text-[11px] text-status-success-text font-bold mb-1">
                              Report from {sub.deptHeadReport.submittedByName} · {fmtFull(sub.deptHeadReport.submittedAt)}
                            </p>
                            <p className="text-[12px] text-brand-text-secondary">{sub.deptHeadReport.text}</p>
                            {sub.deptHeadReport.attachmentFilename && (
                              <a
                                href={projectFileUrl(sub.deptHeadReport.attachmentFilename)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-brand-primary hover:text-brand-primary"
                              >
                                <Paperclip className="h-3 w-3" />
                                {sub.deptHeadReport.attachmentOriginalName || sub.deptHeadReport.attachmentFilename}
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-brand-text-muted italic">Waiting for department report…</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Dept Head / Member view ── */
        <div className="space-y-3">
          {subtasks.map(sub => (
            <div key={sub._id} className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <StatusBadge status={SUBTASK_STATUS_MAP[sub.status] ?? 'draft'} label={sub.status.replace('_', ' ')} className="text-[10px] font-bold shrink-0" />
                <p className="text-[13px] font-semibold text-brand-text flex-1 truncate">{sub.title}</p>
                <span className="text-[11px] text-brand-text-muted shrink-0">{sub.department}</span>
                {expandedId === sub._id ? <ChevronUp className="h-3.5 w-3.5 text-brand-text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-brand-text-muted" />}
              </button>

              {expandedId === sub._id && (
                <div className="px-4 pb-4 space-y-3 border-t border-brand-border">
                  {sub.description && <p className="text-[12px] text-brand-text-secondary mt-3">{sub.description}</p>}

                  {sub.attachmentFilename && (
                    <a
                      href={projectFileUrl(sub.attachmentFilename)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[12px] text-brand-primary hover:text-brand-primary"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {sub.attachmentOriginalName || sub.attachmentFilename}
                    </a>
                  )}

                  {/* Dept head: assign employees */}
                  {project.myDepartment && (
                    <>
                      {sub.assignedEmployees.length > 0 && (
                        <div>
                          <p className="text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">Assigned to</p>
                          <div className="flex flex-wrap gap-1">
                            {sub.assignedEmployees.map(ae => (
                              <span key={ae.employeeId} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-bg-muted text-brand-text-secondary">{ae.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assign panel */}
                      {assigningId === sub._id ? (
                        <div className="space-y-2 bg-white/50 rounded-lg p-3">
                          <p className="text-[11px] font-semibold text-brand-text-secondary uppercase">Assign Employees</p>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                            <input
                              value={assignSearch}
                              onChange={e => setAssignSearch(e.target.value)}
                              placeholder="Search…"
                              className="w-full h-8 pl-8 pr-3 text-[12px] bg-brand-bg-soft border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none"
                            />
                          </div>
                          <div className="max-h-36 overflow-y-auto border border-brand-border rounded-lg">
                            {filteredEmps.map(e => {
                              const sel = assignSelected.has(e._id);
                              return (
                                <button
                                  key={e._id}
                                  type="button"
                                  onClick={() => setAssignSelected(prev => { const s = new Set(prev); s.has(e._id) ? s.delete(e._id) : s.add(e._id); return s; })}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-brand-border/50 last:border-0 hover:bg-brand-bg-muted/40 ${sel ? 'bg-brand-primary/10' : ''}`}
                                >
                                  <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-brand-primary border-brand-primary' : 'border-slate-500'}`}>
                                    {sel && <Check className="h-2 w-2 text-white" />}
                                  </div>
                                  <span className="text-[12px] text-brand-text truncate">{e.fullName}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setAssigningId(null); setAssignSelected(new Set()); }} className="px-3 h-7 text-[12px] text-brand-text-secondary border border-brand-border-strong rounded-lg hover:bg-brand-bg-muted">Cancel</button>
                            <button
                              onClick={() => assignEmployees(sub._id)}
                              disabled={assigning || assignSelected.size === 0}
                              className="px-3 h-7 text-[12px] bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover disabled:opacity-50"
                            >
                              {assigning ? 'Assigning…' : `Assign (${assignSelected.size})`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        !sub.deptHeadReport && (
                          <button
                            onClick={() => { setAssigningId(sub._id); setAssignSelected(new Set(sub.assignedEmployees.map(ae => ae.employeeId))); }}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-[12px] text-brand-text-secondary"
                          >
                            <Users className="h-3 w-3" /> {sub.assignedEmployees.length > 0 ? 'Re-assign' : 'Assign Employees'}
                          </button>
                        )
                      )}

                      {/* Submit report */}
                      {!sub.deptHeadReport ? (
                        reportingId === sub._id ? (
                          <div className="space-y-2 bg-white/50 rounded-lg p-3">
                            <p className="text-[11px] font-semibold text-brand-text-secondary uppercase">Submit Department Report</p>
                            <textarea
                              value={reportText}
                              onChange={e => setReportText(e.target.value)}
                              rows={3}
                              placeholder="Describe what your team accomplished…"
                              className="w-full px-3 py-2 text-[12px] bg-brand-bg-soft border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted resize-none focus:outline-none"
                            />
                            <div>
                              <label className="text-[11px] text-brand-text-secondary block mb-1">Attach file (optional)</label>
                              <input
                                type="file"
                                onChange={e => setReportFile(e.target.files?.[0] ?? null)}
                                className="text-[11px] text-brand-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-brand-primary file:text-white file:cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setReportingId(null); setReportText(''); setReportFile(null); }} className="px-3 h-7 text-[12px] text-brand-text-secondary border border-brand-border-strong rounded-lg hover:bg-brand-bg-muted">Cancel</button>
                              <button
                                onClick={() => submitReport(sub._id)}
                                disabled={submittingReport || (!reportText.trim() && !reportFile)}
                                className="px-3 h-7 text-[12px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {submittingReport ? 'Submitting…' : 'Submit Report'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReportingId(sub._id)}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-[12px] text-status-success-text font-semibold"
                          >
                            <Upload className="h-3 w-3" /> Submit Report to Supervisor
                          </button>
                        )
                      ) : (
                        <div className="bg-status-success-bg border border-status-success-text/20 rounded-lg p-3">
                          <p className="text-[11px] text-status-success-text font-bold mb-1">Report submitted · {fmtFull(sub.deptHeadReport.submittedAt)}</p>
                          <p className="text-[12px] text-brand-text-secondary">{sub.deptHeadReport.text}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Chat Group Modal ─────────────────────────────────────────────────────

function NewChatGroupModal({ project, onClose, onCreated }: { project: Project; onClose: () => void; onCreated: () => void }) {
  const { userData } = useAuth() as any;
  const myId = String(userData?._id ?? '');
  const [name, setName]         = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving]     = useState(false);

  const people = [
    { id: String(project.createdBy), name: project.supervisorName, role: 'Supervisor' },
    ...project.members.map(m => ({ id: String(m.employeeId), name: m.employee?.fullName ?? m.name, role: m.role.replace('_', ' ') })),
  ].filter(p => p.id !== myId);

  const toggle = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const create = () => {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/chat-groups`,
      method: 'POST',
      data: { name: name.trim(), memberIds: [...selected] },
      showToast: false,
      thenFn: () => { onCreated(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">New Group Chat</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name, e.g. Comms Sub-team"
            className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          <div>
            <p className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Members</p>
            {people.length === 0 ? (
              <p className="text-[12px] text-brand-text-muted px-1">No other project members to add.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/50">
                {people.map(p => {
                  const sel = selected.has(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggle(p.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-muted/40 transition-colors ${sel ? 'bg-brand-primary/10' : ''}`}>
                      <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-brand-primary border-brand-primary' : 'border-slate-500'}`}>
                        {sel && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <span className="text-[12px] text-brand-text truncate">{p.name}</span>
                      <span className="text-[10px] text-brand-text-muted ml-auto capitalize">{p.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-3 h-8 text-[13px] text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={create} disabled={!name.trim() || selected.size === 0 || saving}
            className="px-4 h-8 text-[13px] bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Tab ──────────────────────────────────────────────────────────────────

function ChatTab({ project }: { project: Project }) {
  const projectId = project._id;
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [groups, setGroups]       = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup]   = useState(false);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const lastIdRef                 = useRef<string>('');
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const fetchGroups = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/chat-groups`,
      showToast: false,
      thenFn: r => setGroups(r?.data ?? []),
    });
  }, [projectId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchMessages = useCallback((quiet = false) => {
    const groupParam = activeGroupId ? `&groupId=${activeGroupId}` : '';
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/messages?limit=60${groupParam}`,
      showToast: false,
      thenFn: r => {
        const msgs: ChatMessage[] = r?.data ?? [];
        const newest = msgs.length > 0 ? msgs[msgs.length - 1]._id : '';
        if (newest !== lastIdRef.current) {
          lastIdRef.current = newest;
          setMessages(msgs);
          if (!quiet) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      },
    });
  }, [projectId, activeGroupId]);

  useEffect(() => {
    lastIdRef.current = '';
    setMessages([]);
    fetchMessages(false);
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const sendMsg = () => {
    if (!input.trim() && !file) return;
    setSending(true);
    const fd = new FormData();
    if (input.trim()) fd.append('message', input.trim());
    if (file) fd.append('file', file);
    if (activeGroupId) fd.append('groupId', activeGroupId);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${projectId}/messages`,
      method: 'POST',
      data: fd,
      showToast: false,
      thenFn: () => { setInput(''); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; fetchMessages(false); },
      finallyFn: () => setSending(false),
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) { setInput(v => v + emoji); return; }
    const start = el.selectionStart ?? input.length;
    const end   = el.selectionEnd ?? input.length;
    setInput(v => v.slice(0, start) + emoji + v.slice(end));
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + emoji.length; }, 0);
  };

  const ROLE_COLORS: Record<string, string> = {
    supervisor:   'text-brand-primary',
    team_leader:  'text-status-warning-text',
    member:       'text-brand-text-secondary',
  };

  const isImageAttachment = (mime?: string | null) => !!mime && mime.startsWith('image/');

  return (
    <div className="flex flex-col h-[560px] bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Channels */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-brand-border shrink-0">
        <button onClick={() => setActiveGroupId(null)}
          className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors',
            activeGroupId === null ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-soft')}>
          General
        </button>
        {groups.map(g => (
          <button key={g._id} onClick={() => setActiveGroupId(g._id)}
            className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors',
              activeGroupId === g._id ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-soft')}>
            # {g.name}
          </button>
        ))}
        <button onClick={() => setShowNewGroup(true)} title="Create a new group chat"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap shrink-0 text-brand-primary border border-dashed border-brand-primary/40 hover:bg-brand-primary/10 transition-colors ml-1">
          <Plus className="h-3.5 w-3.5" /> New Group
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-brand-text-muted gap-2">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m._id} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-brand-bg-muted flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-text-secondary mt-0.5">
              {m.senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-[12px] font-bold ${ROLE_COLORS[m.senderRole] ?? 'text-brand-text-secondary'}`}>
                  {m.senderName}
                </span>
                <span className="text-[10px] text-brand-text-muted capitalize">{m.senderRole.replace('_', ' ')}</span>
                <span className="text-[10px] text-brand-text-muted ml-auto">{fmtTime(m.createdAt)}</span>
              </div>
              {m.message && <p className="text-[13px] text-brand-text-secondary leading-relaxed break-words">{m.message}</p>}
              {m.attachmentFilename && (
                isImageAttachment(m.attachmentMimeType) ? (
                  <a href={projectFileUrl(m.attachmentFilename)} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5">
                    <img src={projectFileUrl(m.attachmentFilename)} alt={m.attachmentOriginalName ?? 'attachment'}
                      className="max-h-48 max-w-[220px] rounded-lg border border-brand-border object-cover" />
                  </a>
                ) : (
                  <a href={projectFileUrl(m.attachmentFilename)} target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg-soft border border-brand-border hover:bg-brand-bg-muted transition-colors max-w-full">
                    <FileText className="h-4 w-4 text-brand-text-muted shrink-0" />
                    <span className="text-[12px] text-brand-text truncate">{m.attachmentOriginalName || m.attachmentFilename}</span>
                    <Download className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
                  </a>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Attach preview */}
      {file && (
        <div className="px-3 pt-2 border-t border-brand-border">
          <div className="inline-flex items-center gap-2 bg-brand-bg-soft border border-brand-border rounded-lg px-2.5 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
            <span className="text-[12px] text-brand-text truncate max-w-[200px]">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="h-4 w-4 rounded-full bg-brand-bg-muted hover:bg-brand-border-strong flex items-center justify-center shrink-0">
              <X className="h-2.5 w-2.5 text-brand-text-secondary" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-brand-border p-3 flex gap-2 items-center relative">
        {showEmoji && <ChatEmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach a file"
          className="h-9 w-9 shrink-0 rounded-xl text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft flex items-center justify-center transition-colors"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowEmoji(v => !v)}
          title="Emoji"
          className={cn(
            'h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-colors',
            showEmoji ? 'bg-amber-100 text-amber-600' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft',
          )}
        >
          <Smile className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
        />
        <button
          onClick={sendMsg}
          disabled={sending || (!input.trim() && !file)}
          className="h-9 w-9 shrink-0 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {showNewGroup && (
        <NewChatGroupModal project={project} onClose={() => setShowNewGroup(false)}
          onCreated={() => { fetchGroups(); }} />
      )}
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab({ project }: { project: Project }) {
  const { userData } = useAuth() as any;
  const [notes, setNotes]   = useState<ProjectNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving]   = useState(false);

  const fetchNotes = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${project._id}/notes`,
      showToast: false,
      thenFn: r => setNotes(r?.data ?? []),
    });
  }, [project._id]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const add = () => {
    if (!newNote.trim()) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/notes`,
      method: 'POST',
      data: { text: newNote.trim() },
      thenFn: () => { setNewNote(''); fetchNotes(); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (noteId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/notes/${noteId}`,
      method: 'DELETE',
      thenFn: fetchNotes,
    });
  };

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-3">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          rows={2}
          placeholder="Add a project note…"
          className="w-full px-3 py-2 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted resize-none focus:outline-none focus:border-brand-primary"
        />
        <div className="flex justify-end">
          <button
            onClick={add}
            disabled={saving || !newNote.trim()}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.length === 0 && (
          <div className="text-center py-8 text-brand-text-muted">
            <FileText className="h-7 w-7 mx-auto mb-2 opacity-30" />
            <p className="text-[13px]">No notes yet.</p>
          </div>
        )}
        {notes.map(n => (
          <div key={n._id} className="flex gap-3 bg-brand-bg-soft border border-brand-border rounded-xl p-4">
            <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 text-[12px] font-bold text-brand-primary">
              {n.createdByName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-brand-text leading-relaxed">{n.text}</p>
              <p className="text-[11px] text-brand-text-muted mt-1">
                {n.createdByName} · {fmtFull(n.createdAt)}
              </p>
            </div>
            {(String(n.createdBy) === String(userData?._id) || ['super_admin', 'hr_manager'].includes(userData?.role ?? '')) && (
              <button
                onClick={() => del(n._id)}
                className="shrink-0 text-brand-text-muted hover:text-status-danger-text transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

function TeamTab({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [showAdd, setShowAdd]         = useState(false);
  const [allEmps, setAllEmps]         = useState<Employee[]>([]);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [memberRole, setMemberRole]   = useState('member');
  const [saving, setSaving]           = useState(false);

  const existingIds = new Set(project.members.map(m => String(m.employeeId)));

  useEffect(() => {
    if (!showAdd) return;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?limit=500`,
      showToast: false,
      thenFn: r => setAllEmps(r?.data?.data ?? []),
    });
  }, [showAdd]);

  const available = allEmps.filter(e => !existingIds.has(e._id) && (
    !search.trim() || e.fullName.toLowerCase().includes(search.toLowerCase())
  ));

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const add = () => {
    if (selected.size === 0) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/members`,
      method: 'POST',
      data: { memberIds: [...selected], role: memberRole },
      thenFn: () => { setShowAdd(false); setSelected(new Set()); onRefresh(); },
      finallyFn: () => setSaving(false),
    });
  };

  const remove = (employeeId: string) => {
    if (!confirm('Remove this member from the project?')) return;
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/members/${employeeId}`,
      method: 'DELETE',
      thenFn: onRefresh,
    });
  };

  const ROLE_BADGE: Record<string, string> = {
    supervisor:  'text-brand-primary bg-brand-primary/20',
    team_leader: 'text-status-warning-text bg-amber-500/20',
    member:      'text-brand-text-secondary bg-slate-600/40',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-brand-text-secondary">{project.members.length + 1} team members</p>
        {project.myRole === 'supervisor' && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Members
          </button>
        )}
      </div>

      {showAdd && project.myRole === 'supervisor' && (
        <div className="bg-brand-bg-soft border border-brand-border-strong rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employees…"
                className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none"
              />
            </div>
            <select
              value={memberRole}
              onChange={e => setMemberRole(e.target.value)}
              className="h-9 px-3 text-[13px] bg-white border border-brand-border-strong rounded-lg text-brand-text focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </div>
          <div className="border border-brand-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            {available.length === 0 && (
              <p className="text-[12px] text-brand-text-muted text-center py-4">No available employees</p>
            )}
            {available.map(e => {
              const sel = selected.has(e._id);
              return (
                <button
                  key={e._id}
                  type="button"
                  onClick={() => toggle(e._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-brand-border/50 last:border-0 hover:bg-brand-bg-muted/40 ${sel ? 'bg-brand-primary/10' : ''}`}
                >
                  <div className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center ${sel ? 'bg-brand-primary border-brand-primary' : 'border-slate-500'}`}>
                    {sel && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <div>
                    <p className={`text-[13px] font-medium ${sel ? 'text-brand-primary' : 'text-brand-text'}`}>{e.fullName}</p>
                    <p className="text-[11px] text-brand-text-muted">{e.department}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 h-8 text-[13px] text-brand-text-secondary border border-brand-border-strong rounded-lg hover:bg-brand-bg-muted">Cancel</button>
            <button
              onClick={add}
              disabled={saving || selected.size === 0}
              className="px-4 h-8 text-[13px] bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? 'Adding…' : `Add ${selected.size || ''} Member${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Supervisor row */}
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-primary/30 flex items-center justify-center text-[13px] font-bold text-brand-primary shrink-0">
            {project.supervisorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-brand-text">{project.supervisorName}</p>
            <p className="text-[11px] text-brand-text-muted">Project Supervisor</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-brand-primary bg-brand-primary/20">Supervisor</span>
        </div>

        {/* Other members */}
        {project.members.map(m => (
          <div key={String(m.employeeId)} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-bg-muted flex items-center justify-center text-[13px] font-bold text-brand-text-secondary shrink-0">
              {(m.employee?.fullName ?? m.name).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-brand-text">{m.employee?.fullName ?? m.name}</p>
              <p className="text-[11px] text-brand-text-muted">{m.employee?.department ?? m.department}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
              {m.role.replace('_', ' ')}
            </span>
            {project.myRole === 'supervisor' && (
              <button
                onClick={() => remove(String(m.employeeId))}
                className="h-7 w-7 flex items-center justify-center text-brand-text-muted hover:text-status-danger-text hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',  label: 'Overview',  icon: Info },
  { key: 'subtasks',  label: 'Subtasks',  icon: ListChecks },
  { key: 'chat',      label: 'Chat',      icon: MessageSquare },
  { key: 'notes',     label: 'Notes',     icon: FileText },
  { key: 'team',      label: 'Team',      icon: Users },
] as const;
type TabKey = typeof TABS[number]['key'];

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>('overview');

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}`,
      showToast: false,
      thenFn: r => setProject(r?.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-brand-text-secondary">
      <AlertCircle className="h-10 w-10" />
      <p>Project not found.</p>
      <button onClick={() => router.back()} className="text-brand-primary hover:text-brand-primary">← Go back</button>
    </div>
  );

  const statusColors: Record<string, string> = {
    in_progress: 'text-brand-primary',
    completed:   'text-status-success-text',
    on_hold:     'text-status-warning-text',
    cancelled:   'text-brand-text-muted',
  };

  return (
    <div className="min-h-screen bg-white text-brand-text p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1 h-8 w-8 flex items-center justify-center rounded-lg bg-brand-bg-soft border border-brand-border text-brand-text-secondary hover:text-brand-text transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[12px] font-semibold capitalize ${statusColors[project.status] ?? 'text-brand-text-secondary'}`}>
              {project.status.replace('_', ' ')}
            </span>
            {project.myRole && (
              <span className="text-[11px] text-brand-text-muted">· You: {project.myRole.replace('_', ' ')}</span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-brand-text leading-tight">{project.name}</h1>
          <p className="text-[13px] text-brand-text-secondary mt-0.5">
            {project.departments.length > 0 ? project.departments.join(', ') : 'No departments assigned'}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab project={project} onComplete={() => setTab('overview')} onRefresh={load} />}
      {tab === 'subtasks'  && <SubtasksTab project={project} onRefresh={load} />}
      {tab === 'chat'      && <ChatTab project={project} />}
      {tab === 'notes'     && <NotesTab project={project} />}
      {tab === 'team'      && <TeamTab project={project} onRefresh={load} />}
    </div>
  );
}
