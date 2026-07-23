'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FileCheck, FileX } from 'lucide-react';
import type { Application } from '../types';
import { SOURCE_LABELS } from '../constants';

export function ApplicationCard({ application, requiresScorecard, onClick, selected, onToggleSelect }: {
  application: Application;
  requiresScorecard?: boolean;
  onClick: () => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application._id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const daysInStage = Math.floor((Date.now() - new Date(application.stageHistory[application.stageHistory.length - 1]?.enteredAt || application.createdAt).getTime()) / 86400000);
  const progress = application.currentStageScorecards;
  const isPanel = progress?.required != null;
  const panelComplete = isPanel && progress!.submitted >= (progress!.required ?? 0);
  const hasAnyScorecard = (progress?.submitted ?? 0) > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`relative bg-white rounded-lg border p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition ${isDragging ? 'opacity-40' : ''} ${selected ? 'border-primary ring-1 ring-primary/40' : 'border-slate-200'}`}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={!!selected}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect(application._id)}
          className="absolute top-2 right-2 h-3.5 w-3.5 accent-brand-primary cursor-pointer"
          aria-label="Select candidate"
        />
      )}
      <p className="text-sm font-medium text-slate-900 truncate pr-5">
        {application.candidate ? `${application.candidate.firstName} ${application.candidate.lastName}` : 'Candidate'}
      </p>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{application.candidate ? SOURCE_LABELS[application.candidate.source] : ''}</span>
        <span>{daysInStage}d</span>
      </div>
      {requiresScorecard && (
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          {isPanel ? (
            <span className={`flex items-center gap-1 ${panelComplete ? 'text-green-600' : 'text-amber-600'}`}>
              {panelComplete ? <FileCheck className="h-3 w-3" /> : <FileX className="h-3 w-3" />}
              {progress!.submitted} of {progress!.required} panelists submitted
            </span>
          ) : hasAnyScorecard ? (
            <span className="flex items-center gap-1 text-green-600"><FileCheck className="h-3 w-3" /> Scorecard submitted</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600"><FileX className="h-3 w-3" /> Scorecard missing</span>
          )}
        </div>
      )}
      {application.overallScore != null && (
        <div className="mt-1 text-xs text-slate-500">Score: {application.overallScore.toFixed(1)}/5</div>
      )}
    </div>
  );
}
