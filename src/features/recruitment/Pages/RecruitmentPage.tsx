'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, CheckSquare, Square, ChevronDown, Pencil, Trash2, Search, X, CalendarClock } from 'lucide-react';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { KanbanBoard } from '../Components/KanbanBoard';
import { JobPositionsBoard } from '../Components/JobPositionsBoard';
import { JobPositionForm } from '../Components/JobPositionForm';
import { useRecruitment, type Applicant } from '../Hooks/useRecruitment';
import { useJobPositions, type JobPosition } from '../Hooks/useJobPositions';
import { AddApplicantModal } from '../Components/AddApplicantModal';
import { EditApplicantModal } from '../Components/EditApplicantModal';
import { cn } from '@/lib/utils';

type Tab = 'applications' | 'kanban' | 'positions';

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied', shortlisted: 'Shortlisted', interview_scheduled: 'Interview',
  offer_sent: 'Offer Sent', hired: 'Hired', rejected: 'Rejected',
};
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700', shortlisted: 'bg-yellow-100 text-yellow-700',
  interview_scheduled: 'bg-purple-100 text-purple-700', offer_sent: 'bg-orange-100 text-orange-700',
  hired: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};

export default function RecruitmentPage() {
  const t = useTranslations('Recruitment');
  const [tab, setTab] = useState<Tab>('applications');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  // Filters
  const [search, setSearch]         = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const { applicants, loading: aLoading, error: aError, refetch, moveStage, bulkMoveStage, sendOfferLetter, updateApplicant: _ua, deleteApplicant } = useRecruitment();
  const { positions, loading: pLoading, error: pError, refetch: refetchPos, createPosition, updatePosition, deletePosition } = useJobPositions();

  const handleDeleteApplicant = (id: string) => {
    if (!confirm('Delete this applicant? This cannot be undone.')) return;
    deleteApplicant(id, refetch);
  };

  const handleDeletePosition = (position: JobPosition) => {
    if (!confirm(`Delete "${position.jobTitle}"? This cannot be undone.`)) return;
    deletePosition(position._id, refetchPos);
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      if (filterStage    && a.stage !== filterStage) return false;
      if (filterPosition && a.positionTitle !== filterPosition) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.fullName.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [applicants, search, filterStage, filterPosition]);

  const interviewApplicants = useMemo(
    () => filtered.filter(a => a.stage === 'interview_scheduled' && a.interviewSchedule),
    [filtered]
  );

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(a => a._id)));

  const doBulk = (stage: string) => {
    bulkMoveStage([...selected], stage, () => { setSelected(new Set()); setBulkOpen(false); });
  };

  const uniquePositions = [...new Set(applicants.map(a => a.positionTitle).filter(Boolean))] as string[];
  const hasFilters = search || filterStage || filterPosition;
  const clearFilters = () => { setSearch(''); setFilterStage(''); setFilterPosition(''); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {tab === 'applications' && (
            <button
              onClick={() => setShowAddApplicant(true)}
              className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Applicant
            </button>
          )}
          {tab === 'positions' && (
            <button
              onClick={() => setShowJobForm(true)}
              className="flex items-center gap-2 bg-accent text-primary text-sm font-medium px-4 py-2 rounded-xl hover:bg-accent/90 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Job Title
            </button>
          )}
          <div className="flex border rounded-lg overflow-hidden text-sm">
            {(['applications', 'kanban', 'positions'] as Tab[]).map((t2) => (
              <button key={t2} onClick={() => setTab(t2)}
                className={cn('px-4 py-2 font-medium capitalize', tab === t2 ? 'bg-primary text-white' : 'hover:bg-gray-50')}>
                {t2 === 'applications' ? 'All Applications' : t2 === 'kanban' ? 'Kanban' : t('positions')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'applications' && (
        <Wrapper loading={aLoading} error={aError} onRetry={refetch}>

          {/* Interview highlights panel */}
          {interviewApplicants.length > 0 && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-800">Interviews Scheduled ({interviewApplicants.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {interviewApplicants.map(a => (
                  <div key={a._id} className="bg-white rounded-xl border border-purple-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 font-bold text-purple-700 text-sm">
                      {a.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground">{a.fullName}</p>
                      <p className="text-xs text-purple-600 font-medium">
                        {a.interviewSchedule!.scheduledDate} · {a.interviewSchedule!.scheduledTime}
                        {a.interviewSchedule!.location && ` · ${a.interviewSchedule!.location}`}
                      </p>
                      <p className="text-xs text-foreground/40 truncate">{a.positionTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Stages</option>
              {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
              className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Positions</option>
              {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-xs text-foreground/40 ml-auto">
              {filtered.length} of {applicants.length}
            </span>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-medium text-primary">{selected.size} selected</span>
              <div className="relative">
                <button
                  onClick={() => setBulkOpen(o => !o)}
                  className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary/90"
                >
                  Bulk Action <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {bulkOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                    {['shortlisted', 'interview_scheduled', 'rejected', 'hired'].map(s => (
                      <button key={s} onClick={() => doBulk(s)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize">
                        Mark as {STAGE_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(new Set())} className="text-xs text-foreground/50 hover:text-foreground ml-auto">
                Clear
              </button>
            </div>
          )}

          {/* Applications table */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-foreground/60 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <button onClick={toggleAll} className="text-foreground/40 hover:text-primary">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Applicant</th>
                  <th className="px-4 py-3 text-left font-medium">Position</th>
                  <th className="px-4 py-3 text-left font-medium">Stage</th>
                  <th className="px-4 py-3 text-left font-medium">Interview</th>
                  <th className="px-4 py-3 text-left font-medium">CV</th>
                  <th className="px-4 py-3 text-left font-medium">Applied</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-foreground/40">No applications found.</td></tr>
                ) : filtered.map((a) => (
                  <ApplicantRow
                    key={a._id}
                    applicant={a}
                    selected={selected.has(a._id)}
                    onToggle={() => toggleSelect(a._id)}
                    onStageChange={(stage) => moveStage(a._id, stage)}
                    onEdit={() => setEditingApplicant(a)}
                    onDelete={() => handleDeleteApplicant(a._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Wrapper>
      )}

      {tab === 'kanban' && (
        <Wrapper loading={aLoading} error={aError} onRetry={refetch}>
          <KanbanBoard
            applicants={applicants}
            onStageChange={(id, stage, extra) => moveStage(id, stage, extra)}
            onSendOfferLetter={(id, data) => sendOfferLetter(id, data)}
          />
        </Wrapper>
      )}

      {tab === 'positions' && (
        <Wrapper loading={pLoading} error={pError} onRetry={refetchPos}>
          <JobPositionsBoard
            positions={positions}
            onEdit={(p) => setEditingPosition(p)}
            onDelete={handleDeletePosition}
          />
        </Wrapper>
      )}

      {showJobForm && (
        <JobPositionForm
          onClose={() => setShowJobForm(false)}
          onSubmit={(data) => createPosition(data, () => setShowJobForm(false))}
        />
      )}

      {editingPosition && (
        <JobPositionForm
          mode="edit"
          initialValues={editingPosition as unknown as Record<string, unknown>}
          onClose={() => setEditingPosition(null)}
          onSubmit={(data) => updatePosition(editingPosition._id, data, () => { setEditingPosition(null); refetchPos(); })}
        />
      )}

      {showAddApplicant && (
        <AddApplicantModal
          onClose={() => setShowAddApplicant(false)}
          onSuccess={refetch}
        />
      )}

      {editingApplicant && (
        <EditApplicantModal
          applicant={editingApplicant}
          onClose={() => setEditingApplicant(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

function ApplicantRow({ applicant: a, selected, onToggle, onStageChange, onEdit, onDelete }: {
  applicant: Applicant;
  selected: boolean;
  onToggle: () => void;
  onStageChange: (stage: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showCover, setShowCover] = useState(false);
  const sched = a.interviewSchedule;

  return (
    <>
      <tr className={cn('hover:bg-gray-50/50', selected && 'bg-primary/5', a.stage === 'interview_scheduled' && 'bg-purple-50/30')}>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-foreground/40 hover:text-primary">
            {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{a.fullName}</div>
          <div className="text-xs text-foreground/50">{a.email}</div>
          {a.phone && <div className="text-xs text-foreground/50">{a.phone}</div>}
        </td>
        <td className="px-4 py-3 text-foreground/70">{a.positionTitle || '—'}</td>
        <td className="px-4 py-3">
          <select
            value={a.stage}
            onChange={(e) => onStageChange(e.target.value)}
            className={cn('text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer', STAGE_COLORS[a.stage] || 'bg-gray-100 text-gray-700')}
          >
            {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </td>
        <td className="px-4 py-3">
          {sched ? (
            <div className="flex items-start gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-purple-700">{sched.scheduledDate}</p>
                <p className="text-xs text-purple-500">{sched.scheduledTime}{sched.location ? ` · ${sched.location}` : ''}</p>
              </div>
            </div>
          ) : (
            <span className="text-xs text-foreground/30">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {(a.cvPath || a.cvFilePath) ? (
            <a
              href={`/uploads/${a.cvFilename || 'cv.pdf'}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View CV
            </a>
          ) : <span className="text-xs text-foreground/30">—</span>}
        </td>
        <td className="px-4 py-3 text-xs text-foreground/50">
          {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-foreground/40 capitalize">{a.source?.replace(/_/g, ' ') || 'internal'}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {a.coverLetter && (
              <button onClick={() => setShowCover(s => !s)} title="Cover Letter"
                className="p-1.5 rounded-lg text-foreground/30 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs font-medium">
                CL
              </button>
            )}
            <button onClick={onEdit} title="Edit"
              className="p-1.5 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} title="Delete"
              className="p-1.5 rounded-lg text-foreground/30 hover:text-danger hover:bg-danger/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {showCover && a.coverLetter && (
        <tr className="bg-blue-50/50">
          <td colSpan={9} className="px-8 py-3 text-sm text-foreground/70 whitespace-pre-wrap">{a.coverLetter}</td>
        </tr>
      )}
    </>
  );
}
