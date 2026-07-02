'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, X, ChevronDown, CheckSquare, Square,
  MoreHorizontal, Eye, Pencil, CalendarClock, UserCheck,
  UserX, Trash2, Download, Filter, Users,
} from 'lucide-react';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { KanbanBoard } from '../Components/KanbanBoard';
import { JobPositionsBoard } from '../Components/JobPositionsBoard';
import { JobPositionForm } from '../Components/JobPositionForm';
import { useRecruitment, type Applicant } from '../Hooks/useRecruitment';
import { useJobPositions, type JobPosition } from '../Hooks/useJobPositions';
import { AddApplicantDrawer } from '../Components/AddApplicantDrawer';
import { EditApplicantModal } from '../Components/EditApplicantModal';
import { ApplicantDrawer } from '../Components/ApplicantDrawer';
import { RejectionModal } from '../Components/RejectionModal';
import { HireModal } from '../Components/HireModal';
import { STAGE_CONFIG, STAGES, SOURCE_CONFIG, stageCfg } from '../constants';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';

const BACKEND_URL = API_BASE_URL.replace('/api', '');

type Tab = 'applications' | 'kanban' | 'positions';

// ── Shared sub-components ─────────────────────────────────────────────────────

function StagePill({ stage, onChange }: { stage: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = stageCfg(stage);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors', cfg.bgCls, cfg.textCls, cfg.borderCls)}
      >
        {cfg.label}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[160px] py-1 overflow-hidden">
          {STAGES.map(s => {
            const c = STAGE_CONFIG[s];
            return (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn('w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700/50 transition-colors', s === stage && 'bg-slate-700/50 font-semibold')}>
                <span className={cn('h-2 w-2 rounded-full shrink-0', c.dotCls)} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return <span className="text-xs text-slate-300">—</span>;
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.other;
  return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', cfg.cls)}>{cfg.label}</span>;
}

function ActionsMenu({ applicant, onView, onEdit, onSchedule, onReject, onHire, onDelete }: {
  applicant: Applicant;
  onView: () => void; onEdit: () => void; onSchedule: () => void;
  onReject: () => void; onHire: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const item = (Icon: React.ElementType, label: string, onClick: () => void, cls?: string) => (
    <button key={label}
      onClick={e => { e.stopPropagation(); onClick(); setOpen(false); }}
      className={cn('w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors text-slate-200', cls)}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[180px] py-1 overflow-hidden">
          {item(Eye,           'View Profile',       onView)}
          {item(Pencil,        'Edit Applicant',     onEdit)}
          {item(CalendarClock, 'Schedule Interview', onSchedule)}
          <div className="my-1 border-t border-slate-700" />
          {applicant.stage !== 'rejected' && item(UserX,    'Reject',        onReject, 'text-red-400 hover:bg-red-500/10')}
          {applicant.stage === 'offer_sent' && item(UserCheck, 'Mark as Hired', onHire, 'text-emerald-400 hover:bg-emerald-500/10')}
          <div className="my-1 border-t border-slate-700" />
          {item(Trash2, 'Delete', onDelete, 'text-red-400 hover:bg-red-500/10')}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const [tab, setTab] = useState<Tab>('applications');
  const [showDrawer, setShowDrawer]       = useState(false);
  const [showJobForm, setShowJobForm]     = useState(false);
  const [editingApplicant, setEditingApplicant]   = useState<Applicant | null>(null);
  const [viewingApplicant, setViewingApplicant]   = useState<Applicant | null>(null);
  const [rejectingApplicant, setRejectingApplicant] = useState<Applicant | null>(null);
  const [hiringApplicant, setHiringApplicant]     = useState<Applicant | null>(null);
  const [editingPosition, setEditingPosition]     = useState<JobPosition | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);

  const [search, setSearch]               = useState('');
  const [filterStage, setFilterStage]     = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterSource, setFilterSource]   = useState('');

  const { applicants, loading: aLoading, error: aError, refetch, moveStage, bulkMoveStage, sendOfferLetter, deleteApplicant } = useRecruitment();
  const { positions, loading: pLoading, error: pError, refetch: refetchPos, createPosition, updatePosition, deletePosition } = useJobPositions();

  useEffect(() => {
    if (!bulkStageOpen) return;
    const h = (e: MouseEvent) => { if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkStageOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [bulkStageOpen]);

  const filtered = useMemo(() => applicants.filter(a => {
    if (filterStage    && a.stage !== filterStage) return false;
    if (filterPosition && a.positionTitle !== filterPosition) return false;
    if (filterSource   && (a.source ?? 'hr_manual') !== filterSource) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.fullName.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [applicants, search, filterStage, filterPosition, filterSource]);

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map(a => a._id)));

  const doBulkStage = (stage: string) =>
    bulkMoveStage([...selected], stage, () => { setSelected(new Set()); setBulkStageOpen(false); });

  const handleDeleteApplicant = (id: string) => {
    if (!confirm('Delete this applicant? This cannot be undone.')) return;
    deleteApplicant(id, refetch);
  };

  const handleDeletePosition = (position: JobPosition) => {
    if (!confirm(`Delete "${position.jobTitle}"? This cannot be undone.`)) return;
    deletePosition(position._id, refetchPos);
  };

  const uniquePositions = [...new Set(applicants.map(a => a.positionTitle).filter(Boolean))] as string[];
  const activeFilters = [filterStage, filterPosition, filterSource, search].filter(Boolean).length;
  const clearFilters = () => { setSearch(''); setFilterStage(''); setFilterPosition(''); setFilterSource(''); };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Stage', 'Source', 'Applied At'];
    const rows = filtered.map(a => [
      a.fullName, a.email, a.phone ?? '', a.positionTitle ?? '', a.stage, a.source ?? '',
      a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-KE') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'recruitment-export.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'applications', label: 'All Applications' },
    { key: 'kanban',       label: 'Kanban'           },
    { key: 'positions',    label: 'Positions'         },
  ];

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 leading-tight">Recruitment</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {tab === 'applications' && (
            <button onClick={() => setShowDrawer(true)}
              className="flex items-center gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 rounded-lg shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> Add Applicant
            </button>
          )}
          {tab === 'positions' && (
            <button onClick={() => setShowJobForm(true)}
              className="flex items-center gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 rounded-lg shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> Create Position
            </button>
          )}
          {/* View toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 gap-0.5">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('h-8 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                  tab === t.key ? 'bg-slate-700 text-slate-100 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Applications tab ────────────────────────────────────────────────── */}
      {tab === 'applications' && (
        <Wrapper loading={aLoading} error={aError} onRetry={refetch}>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full h-10 pl-9 pr-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="h-10 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[140px]">
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
            </select>

            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
              className="h-10 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[140px]">
              <option value="">All Positions</option>
              {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="h-10 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[130px]">
              <option value="">All Sources</option>
              {Object.entries(SOURCE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>

            {activeFilters > 0 && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                Filters ({activeFilters}) <X className="h-3 w-3 ml-0.5" />
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-slate-400 font-semibold">{filtered.length} of {applicants.length}</span>
              <button onClick={exportCSV} className="flex items-center gap-1.5 h-10 px-3 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-700/60">
                  <th className="px-4 py-3 w-12 text-left">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {selected.size > 0 && selected.size === filtered.length
                        ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  {['Applicant', 'Position', 'Stage', 'Interview', 'CV', 'Applied', 'Source', 'Actions'].map(h => (
                    <th key={h} className={cn('px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500', h === 'Actions' ? 'text-right' : 'text-left')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Users className="h-7 w-7 text-slate-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700">No applicants found</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {activeFilters > 0 ? 'Try adjusting your filters' : 'Add applicants or post a job to get started'}
                          </p>
                        </div>
                        {activeFilters === 0 && (
                          <button onClick={() => setShowDrawer(true)}
                            className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                            <Plus className="h-3.5 w-3.5" /> Add Applicant
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <ApplicantRow
                    key={a._id}
                    applicant={a}
                    selected={selected.has(a._id)}
                    onToggle={() => toggleSelect(a._id)}
                    onStageChange={stage => moveStage(a._id, stage)}
                    onView={() => setViewingApplicant(a)}
                    onEdit={() => setEditingApplicant(a)}
                    onSchedule={() => { setViewingApplicant(a); }}
                    onReject={() => setRejectingApplicant(a)}
                    onHire={() => setHiringApplicant(a)}
                    onDelete={() => handleDeleteApplicant(a._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Floating bulk action bar */}
          {selected.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-3 bg-slate-900 border border-indigo-500/60 rounded-xl px-5 py-3 shadow-2xl min-w-[480px]">
                <span className="text-sm font-semibold text-slate-200 shrink-0">
                  {selected.size} selected
                </span>
                <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />
                <div ref={bulkRef} className="relative">
                  <button onClick={() => setBulkStageOpen(o => !o)}
                    className="flex items-center gap-1.5 h-8 px-3 border border-indigo-400/60 text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-900/40 transition-colors">
                    Move Stage <ChevronDown className="h-3 w-3" />
                  </button>
                  {bulkStageOpen && (
                    <div className="absolute bottom-full mb-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[160px] py-1 overflow-hidden">
                      {STAGES.filter(s => s !== 'hired').map(s => {
                        const c = STAGE_CONFIG[s];
                        return (
                          <button key={s} onClick={() => doBulkStage(s)}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors text-slate-200">
                            <span className={cn('h-2 w-2 rounded-full', c.dotCls)} />
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { if (confirm(`Reject ${selected.size} applicant(s)?`)) doBulkStage('rejected'); }}
                  className="h-8 px-3 border border-red-800/60 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/20 transition-colors">
                  Reject All
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            </div>
          )}
        </Wrapper>
      )}

      {/* ── Kanban tab ──────────────────────────────────────────────────────── */}
      {tab === 'kanban' && (
        <Wrapper loading={aLoading} error={aError} onRetry={refetch}>
          <KanbanBoard
            applicants={applicants}
            onStageChange={(id, stage, extra) => moveStage(id, stage, extra)}
            onSendOfferLetter={(id, data) => sendOfferLetter(id, data)}
            onRefetch={refetch}
          />
        </Wrapper>
      )}

      {/* ── Positions tab ───────────────────────────────────────────────────── */}
      {tab === 'positions' && (
        <Wrapper loading={pLoading} error={pError} onRetry={refetchPos}>
          <JobPositionsBoard
            positions={positions}
            onEdit={p => setEditingPosition(p)}
            onDelete={handleDeletePosition}
          />
        </Wrapper>
      )}

      {/* ── Modals & Drawers ────────────────────────────────────────────────── */}
      {showJobForm && (
        <JobPositionForm
          onClose={() => setShowJobForm(false)}
          onSubmit={data => createPosition(data, () => setShowJobForm(false))}
        />
      )}
      {editingPosition && (
        <JobPositionForm
          mode="edit"
          initialValues={editingPosition as unknown as Record<string, unknown>}
          onClose={() => setEditingPosition(null)}
          onSubmit={data => updatePosition(editingPosition._id, data, () => { setEditingPosition(null); refetchPos(); })}
        />
      )}
      {showDrawer && (
        <AddApplicantDrawer onClose={() => setShowDrawer(false)} onSuccess={refetch} />
      )}
      {editingApplicant && (
        <EditApplicantModal applicant={editingApplicant} onClose={() => setEditingApplicant(null)} onSuccess={refetch} />
      )}
      {viewingApplicant && (
        <ApplicantDrawer
          applicant={viewingApplicant}
          onClose={() => setViewingApplicant(null)}
          onStageChange={(stage, extra) => moveStage(viewingApplicant._id, stage, extra)}
          onSendOfferLetter={data => sendOfferLetter(viewingApplicant._id, data)}
          onReject={() => { setViewingApplicant(null); setRejectingApplicant(viewingApplicant); }}
          onHire={() => { setViewingApplicant(null); setHiringApplicant(viewingApplicant); }}
          onRefetch={refetch}
        />
      )}
      {rejectingApplicant && (
        <RejectionModal
          applicant={rejectingApplicant}
          onClose={() => setRejectingApplicant(null)}
          onSuccess={() => { setRejectingApplicant(null); refetch(); }}
        />
      )}
      {hiringApplicant && (
        <HireModal
          applicant={hiringApplicant}
          onClose={() => setHiringApplicant(null)}
          onSuccess={() => { setHiringApplicant(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ── ApplicantRow ──────────────────────────────────────────────────────────────

function ApplicantRow({ applicant: a, selected, onToggle, onStageChange, onView, onEdit, onSchedule, onReject, onHire, onDelete }: {
  applicant: Applicant;
  selected: boolean;
  onToggle: () => void;
  onStageChange: (stage: string) => void;
  onView: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onReject: () => void;
  onHire: () => void;
  onDelete: () => void;
}) {
  const sched = a.interviewSchedule;
  const appliedDate = a.appliedAt ? new Date(a.appliedAt) : new Date(a.createdAt);

  return (
    <tr
      onClick={onView}
      className={cn('cursor-pointer transition-colors', selected ? 'bg-indigo-900/20' : 'hover:bg-slate-700/30')}
      style={{ height: 64 }}
    >
      <td className="px-4 py-3">
        <button onClick={e => { e.stopPropagation(); onToggle(); }} className="text-slate-400 hover:text-indigo-600 transition-colors">
          {selected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
        </button>
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        <div className="font-semibold text-slate-100 text-sm leading-tight">{a.fullName}</div>
        <a href={`mailto:${a.email}`} onClick={e => e.stopPropagation()}
          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">{a.email}</a>
        {a.phone && <div className="text-xs text-slate-400">{a.phone}</div>}
      </td>
      <td className="px-4 py-3 min-w-[150px]">
        {a.positionTitle
          ? <span className="inline-block px-2.5 py-0.5 bg-slate-700/60 text-slate-300 rounded-full text-xs font-medium">{a.positionTitle}</span>
          : <span className="text-slate-300">—</span>
        }
      </td>
      <td className="px-4 py-3 min-w-[150px]">
        <StagePill stage={a.stage} onChange={onStageChange} />
      </td>
      <td className="px-4 py-3 min-w-[130px]">
        {sched ? (
          <div className="flex items-start gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-purple-300">{sched.scheduledDate}</p>
              <p className="text-xs text-purple-400">{sched.scheduledTime}</p>
            </div>
          </div>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        {(a.cvPath || a.cvFilename) ? (
          <a href={`${BACKEND_URL}/uploads/${a.cvFilename ?? a.cvPath ?? 'cv.pdf'}`} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs text-indigo-600 hover:underline font-medium">View CV</a>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 min-w-[110px]">
        <span className="text-xs text-slate-500">
          {appliedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      <td className="px-4 py-3 min-w-[100px]">
        <SourceBadge source={a.source} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          {/* Quick action button per stage */}
          {a.stage === 'offer_sent' && (
            <button onClick={e => { e.stopPropagation(); onHire(); }}
              className="h-7 px-2.5 border border-green-500/30 text-green-400 text-xs rounded-lg hover:bg-green-500/10 transition-colors font-medium">
              Hire
            </button>
          )}
          {a.stage === 'interview_scheduled' && (
            <button onClick={e => { e.stopPropagation(); onSchedule(); }}
              className="h-7 px-2.5 border border-purple-500/30 text-purple-400 text-xs rounded-lg hover:bg-purple-500/10 transition-colors font-medium">
              View
            </button>
          )}
          <ActionsMenu
            applicant={a}
            onView={onView}
            onEdit={onEdit}
            onSchedule={onSchedule}
            onReject={onReject}
            onHire={onHire}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}
