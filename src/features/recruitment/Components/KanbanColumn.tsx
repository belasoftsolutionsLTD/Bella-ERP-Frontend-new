'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Application, PipelineStage } from '../types';
import { ApplicationCard } from './ApplicationCard';
import { STAGE_TYPE_STYLES } from '../constants';

export function KanbanColumn({ stage, applications, onCardClick, selectedIds, onToggleSelect }: {
  stage: PipelineStage;
  applications: Application[];
  onCardClick: (application: Application) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className={`rounded-t-lg border px-3 py-2 ${STAGE_TYPE_STYLES[stage.type]}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{stage.name}</span>
          <span className="text-xs font-medium">{applications.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] space-y-2 p-2 bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg ${isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : ''}`}
      >
        {applications.map((app) => (
          <ApplicationCard
            key={app._id}
            application={app}
            requiresScorecard={stage.requiresScorecard}
            onClick={() => onCardClick(app)}
            selected={selectedIds?.has(app._id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
        {applications.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No candidates</p>}
      </div>
    </div>
  );
}
