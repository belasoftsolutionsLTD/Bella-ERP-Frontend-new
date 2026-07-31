'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Plus, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { useDeals } from '../Hooks/useDeals';
import { usePipelines } from '../Hooks/useCrmConfig';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from './DealCard';
import { DealFormModal } from './DealFormModal';
import { DealDetailDrawer } from './DealDetailDrawer';
import type { Deal, CrmAccessLevel } from '../types';

export function PipelineBoard({ level }: { level: CrmAccessLevel }) {
  const t = useTranslations('CRM');
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [pipelineId, setPipelineId] = useState('');
  const activePipeline = pipelines.find((p) => p._id === pipelineId) ?? pipelines.find((p) => p.isDefault) ?? pipelines[0];
  const { deals, isLoading, moveDealStage } = useDeals({ pipelineId: activePipeline?._id, status: 'open' });

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ dealId: string; targetStageId: string; targetName: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const deal of deals) (map[deal.stageId] ??= []).push(deal);
    return map;
  }, [deals]);

  const handleDragStart = (event: DragStartEvent) => setActiveDeal(deals.find((d) => d._id === event.active.id) ?? null);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;
    const deal = deals.find((d) => d._id === active.id);
    const targetStageId = String(over.id);
    if (!deal || deal.stageId === targetStageId) return;
    const targetStage = activePipeline?.stages.find((s) => s.id === targetStageId);
    // Every move needs an explicit confirm — a drag started by an accidental click
    // must not silently relocate a deal, so the API call only ever fires from
    // ConfirmDialog's onConfirm below, never directly from onDragEnd.
    setPendingMove({ dealId: deal._id, targetStageId, targetName: targetStage?.name ?? targetStageId });
  };

  if (pipelinesLoading) return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!activePipeline) return <p className="py-16 text-center text-sm text-slate-400">{t('pipelines.noPipelines')}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select value={activePipeline._id} onChange={(e) => setPipelineId(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
          {pipelines.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
          <Plus className="h-4 w-4" /> {t('deals.addDeal')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 px-1 scroll-smooth">
            {activePipeline.stages.map((stage) => (
              <KanbanColumn key={stage.id} stage={stage} deals={byStage[stage.id] ?? []} onCardClick={setSelectedDeal} noDealsLabel={t('deals.noDeals')} />
            ))}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} onClick={() => {}} />}</DragOverlay>
        </DndContext>
      )}

      {showForm && <DealFormModal pipeline={activePipeline} onClose={() => setShowForm(false)} />}
      {selectedDeal && <DealDetailDrawer deal={selectedDeal} level={level} onClose={() => setSelectedDeal(null)} />}
      {pendingMove && (
        <ConfirmDialog
          title={t('deals.moveStage')}
          message={t('deals.moveStageConfirm', { stage: pendingMove.targetName })}
          confirmLabel={t('deals.move')}
          onCancel={() => setPendingMove(null)}
          onConfirm={() => { moveDealStage(pendingMove.dealId, pendingMove.targetStageId); setPendingMove(null); }}
        />
      )}
    </div>
  );
}
