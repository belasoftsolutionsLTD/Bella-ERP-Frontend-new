'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationDrawer } from './ApplicationDrawer';
import { ConfirmDialog } from './ConfirmDialog';
import { useApplications } from '../Hooks/useApplications';
import { isBackwardMove } from '../constants';
import type { JobRequisition, Application } from '../types';

export function PipelineKanban({ requisition, locale }: { requisition: JobRequisition; locale: string }) {
  const { applications, byStage, moveStage, updateStatus, extendOffer, assignInterviewer, unassignInterviewer } = useApplications(requisition._id);
  const [selected, setSelected] = useState<Application | null>(null);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [pendingMove, setPendingMove] = useState<{ appId: string; targetStageId: string; targetName: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const scrollByColumn = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  const confirmedMoveStage = (app: Application, targetStageId: string) => {
    if (isBackwardMove(requisition.pipelineStages, app.currentStageId, targetStageId)) {
      const targetName = requisition.pipelineStages.find((s) => s.id === targetStageId)?.name ?? targetStageId;
      setPendingMove({ appId: app._id, targetStageId, targetName });
      return;
    }
    moveStage(app._id, targetStageId);
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
                onCardClick={(app) => setSelected(app)}
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
          title="Move candidate back?"
          message={`Move this candidate back to "${pendingMove.targetName}"?`}
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
            onClose={() => setSelected(null)}
            onMoveStage={(stageId) => confirmedMoveStage(currentApplication, stageId)}
            onUpdateStatus={(status, reason) => { updateStatus(selected._id, status, reason); setSelected(null); }}
            onExtendOffer={(payload) => extendOffer(selected._id, payload)}
            onAssignInterviewer={(stageId, interviewerId) => assignInterviewer(selected._id, stageId, interviewerId)}
            onUnassignInterviewer={(stageId, interviewerId) => unassignInterviewer(selected._id, stageId, interviewerId)}
          />
        );
      })()}
    </div>
  );
}
