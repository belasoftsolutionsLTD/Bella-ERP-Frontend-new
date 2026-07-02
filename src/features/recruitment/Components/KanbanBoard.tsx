'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { ApplicantDrawer } from './ApplicantDrawer';
import { STAGE_CONFIG, STAGES } from '../constants';
import type { Applicant } from '../Hooks/useRecruitment';

const FUNNEL_STAGES: Array<keyof typeof STAGE_CONFIG> = ['applied', 'shortlisted', 'interview_scheduled', 'offer_sent', 'hired'];

interface Props {
  applicants: Applicant[];
  onStageChange: (id: string, stage: string, extra?: Record<string, unknown>) => void;
  onSendOfferLetter: (id: string, data: { offeredSalary?: number; startDate?: string }) => void;
  onRefetch?: () => void;
}

export function KanbanBoard({ applicants, onStageChange, onSendOfferLetter, onRefetch }: Props) {
  const t = useTranslations('Recruitment');
  const [selected, setSelected] = useState<Applicant | null>(null);

  const LABELS: Record<string, string> = {
    applied:             t('applied'),
    shortlisted:         t('shortlisted'),
    interview_scheduled: t('interviewScheduled'),
    offer_sent:          t('offerSent'),
    hired:               t('hired'),
    rejected:            t('rejected'),
  };

  const counts = FUNNEL_STAGES.map(s => ({
    stage: s,
    label: STAGE_CONFIG[s].label,
    count: applicants.filter(a => a.stage === s).length,
    bgCls: STAGE_CONFIG[s].bgCls,
    textCls: STAGE_CONFIG[s].textCls,
    dotCls: STAGE_CONFIG[s].dotCls,
  }));

  return (
    <>
      {/* Funnel overview bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Pipeline Overview</p>
        <div className="flex items-center overflow-x-auto gap-0">
          {counts.map((c, i) => (
            <div key={c.stage} className="flex items-center shrink-0">
              <div className={cn('flex flex-col items-center px-5 py-2.5 rounded-xl min-w-[90px]', c.bgCls)}>
                <span className={cn('text-2xl font-bold leading-tight', c.textCls)}>{c.count}</span>
                <span className={cn('text-[10px] font-semibold mt-0.5', c.textCls)}>{c.label}</span>
              </div>
              {i < counts.length - 1 && (
                <div className="flex flex-col items-center justify-center w-10 text-center">
                  <span className="text-slate-300 text-lg leading-none">→</span>
                  {c.count > 0 && (
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {Math.round((counts[i + 1].count / c.count) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={LABELS[stage] ?? stage}
            applicants={applicants.filter(a => a.stage === stage)}
            onSelect={setSelected}
          />
        ))}
      </div>

      {selected && (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelected(null)}
          onStageChange={(stage, extra) => { onStageChange(selected._id, stage, extra); setSelected(null); }}
          onSendOfferLetter={data => { onSendOfferLetter(selected._id, data); setSelected(null); }}
          onRefetch={onRefetch}
        />
      )}
    </>
  );
}
