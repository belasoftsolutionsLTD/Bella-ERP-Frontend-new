'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationDrawer } from './ApplicationDrawer';
import { ConfirmDialog } from './ConfirmDialog';
import { useApplications } from '../Hooks/useApplications';
import { isBackwardMove } from '../constants';
import type { JobRequisition, Application } from '../types';

export function PipelineKanban({ requisition, locale }: { requisition: JobRequisition; locale: string }) {
  const { applications, byStage, moveStage, updateStatus, extendOffer, assignInterviewer, unassignInterviewer, sendInterviewReminder, bulkAction } = useApplications(requisition._id);
  const [selected, setSelected] = useState<Application | null>(null);
  const [initialTab, setInitialTab] = useState<'overview' | 'offer'>('overview');
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [pendingMove, setPendingMove] = useState<{ appId: string; targetStageId: string; targetName: string; backward: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());

  const [bulkShortlistStageId, setBulkShortlistStageId] = useState('');
  const [showBulkReject, setShowBulkReject] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [showBulkHire, setShowBulkHire] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const runBulk = (action: 'shortlist' | 'reject' | 'hire', extra?: { stageId?: string; rejectionReason?: string }) => {
    setBulkBusy(true);
    bulkAction(action, [...selectedIds], extra, (result) => {
      setBulkBusy(false);
      clearSelection();
      setShowBulkReject(false);
      setShowBulkHire(false);
      setBulkRejectReason('');
      setBulkShortlistStageId('');
      if (result.failed.length) {
        toast.error(`${result.succeeded.length} succeeded, ${result.failed.length} failed. First error: ${result.failed[0].reason}`);
      } else {
        toast.success(`${result.succeeded.length} candidate(s) updated.`);
      }
    });
  };

  const scrollByColumn = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  const confirmedMoveStage = (app: Application, targetStageId: string) => {
    const targetStage = requisition.pipelineStages.find((s) => s.id === targetStageId);
    // Moving into the Offer stage isn't a plain move — it requires offer details, so
    // route straight to that form instead of just relocating the card. The stage move
    // itself happens server-side as part of submitting the offer (see extendOffer).
    if (targetStage?.type === 'offer') {
      setInitialTab('offer');
      setSelected(app);
      return;
    }
    const targetName = targetStage?.name ?? targetStageId;
    const backward = isBackwardMove(requisition.pipelineStages, app.currentStageId, targetStageId);
    setPendingMove({ appId: app._id, targetStageId, targetName, backward });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a._id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;
    const app = applications.find((a) => a._id === active.id);
    const targetStageId = String(over.id);
    if (app && app.currentStageId !== targetStageId && app.status === 'active') {
      confirmedMoveStage(app, targetStageId);
    }
  };

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
          <button type="button" onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-0.5">
            <X className="h-3 w-3" /> Clear
          </button>
          <div className="flex-1" />
          <select
            value={bulkShortlistStageId}
            onChange={(e) => setBulkShortlistStageId(e.target.value)}
            className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="">Move to stage…</option>
            {requisition.pipelineStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button
            size="sm"
            disabled={!bulkShortlistStageId || bulkBusy}
            onClick={() => runBulk('shortlist', { stageId: bulkShortlistStageId })}
          >
            Shortlist
          </Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => setShowBulkReject(true)}>
            Reject
          </Button>
          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500" disabled={bulkBusy} onClick={() => setShowBulkHire(true)}>
            Hire
          </Button>
        </div>
      )}

      {showBulkReject && (
        <div className="mb-3 bg-white border border-red-200 rounded-lg p-3 space-y-2">
          <textarea
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            rows={2}
            placeholder="Rejection reason (applied to all selected candidates)…"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-red-400 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowBulkReject(false)} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">Cancel</button>
            <button
              onClick={() => runBulk('reject', { rejectionReason: bulkRejectReason })}
              disabled={bulkBusy}
              className="h-8 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              Confirm Reject ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {showBulkHire && (
        <ConfirmDialog
          title="Hire selected candidates?"
          message={`This will create an employee record for all ${selectedIds.size} selected candidate(s) and move them to the hired stage. This cannot be easily undone.`}
          confirmLabel="Hire All"
          onCancel={() => setShowBulkHire(false)}
          onConfirm={() => runBulk('hire')}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="relative">
          {requisition.pipelineStages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollByColumn(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-brand-bg-soft border border-brand-border-strong text-brand-text flex items-center justify-center shadow hover:bg-brand-bg-muted"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 px-1 scroll-smooth">
            {requisition.pipelineStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                applications={byStage[stage.id] ?? []}
                onCardClick={(app) => { setInitialTab('overview'); setSelected(app); }}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
          {requisition.pipelineStages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollByColumn(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-brand-bg-soft border border-brand-border-strong text-brand-text flex items-center justify-center shadow hover:bg-brand-bg-muted"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <DragOverlay>
          {activeApp && <ApplicationCard application={activeApp} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {pendingMove && (
        <ConfirmDialog
          title={pendingMove.backward ? 'Move candidate back?' : 'Move candidate?'}
          message={
            pendingMove.backward
              ? `Are you sure you want to move this candidate back to "${pendingMove.targetName}"?`
              : `Are you sure you want to move this candidate to "${pendingMove.targetName}"?`
          }
          confirmLabel="Move"
          onCancel={() => setPendingMove(null)}
          onConfirm={() => {
            moveStage(pendingMove.appId, pendingMove.targetStageId);
            setPendingMove(null);
          }}
        />
      )}

      {selected && (() => {
        const currentApplication = applications.find((a) => a._id === selected._id) ?? selected;
        return (
          <ApplicationDrawer
            application={currentApplication}
            requisition={requisition}
            locale={locale}
            initialTab={initialTab}
            onClose={() => { setSelected(null); setInitialTab('overview'); }}
            onMoveStage={(stageId) => confirmedMoveStage(currentApplication, stageId)}
            onUpdateStatus={(status, reason) => { updateStatus(selected._id, status, reason); setSelected(null); }}
            onExtendOffer={(payload) => extendOffer(selected._id, payload)}
            onAssignInterviewer={(stageId, interviewerId, scheduledAt, details) => assignInterviewer(selected._id, stageId, interviewerId, scheduledAt, details)}
            onUnassignInterviewer={(stageId, interviewerId) => unassignInterviewer(selected._id, stageId, interviewerId)}
            onSendInterviewReminder={(stageId) => sendInterviewReminder(selected._id, stageId)}
          />
        );
      })()}
    </div>
  );
}
