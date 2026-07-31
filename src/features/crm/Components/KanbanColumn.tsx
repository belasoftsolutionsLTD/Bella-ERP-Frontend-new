'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { Deal, PipelineStage } from '../types';

// Won/Lost carry a fixed status meaning (green/red) that overrides whatever identity
// color the stage was assigned — status wins over identity here, same rule the dataviz
// skill uses for reserved status colors vs categorical ones.
const STAGE_STYLES = (stage: PipelineStage) => {
  if (stage.isWon) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (stage.isLost) return 'bg-red-50 text-red-600 border-red-200';
  return 'text-slate-700 border-slate-200';
};

export function KanbanColumn({ stage, deals, onCardClick, noDealsLabel }: {
  stage: PipelineStage; deals: Deal[]; onCardClick: (deal: Deal) => void; noDealsLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const showCustomColor = !stage.isWon && !stage.isLost && stage.color;

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div
        className={cn('rounded-t-lg border px-3 py-2', STAGE_STYLES(stage))}
        style={showCustomColor ? { backgroundColor: `${stage.color}1a`, borderColor: `${stage.color}40` } : undefined}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {showCustomColor && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />}
            {stage.name}
          </span>
          <span className="text-xs font-medium">{deals.length}</span>
        </div>
        <p className="text-[11px] opacity-70">{totalValue.toLocaleString()}</p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[220px] space-y-2 p-2 bg-slate-50/50 border border-t-0 border-slate-200 rounded-b-lg',
          isOver && 'bg-brand-primary/5 ring-2 ring-inset ring-brand-primary/30'
        )}
      >
        {deals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">{noDealsLabel}</p>
        ) : (
          deals.map((deal) => <DealCard key={deal._id} deal={deal} onClick={() => onCardClick(deal)} />)
        )}
      </div>
    </div>
  );
}
