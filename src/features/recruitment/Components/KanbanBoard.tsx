'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { KanbanColumn } from './KanbanColumn';
import { ApplicantDrawer } from './ApplicantDrawer';
import type { Applicant } from '../Hooks/useRecruitment';

const STAGES = ['applied','shortlisted','interview_scheduled','offer_sent','hired','rejected'];

interface Props {
  applicants: Applicant[];
  onStageChange: (id: string, stage: string, extra?: Record<string, unknown>) => void;
  onSendOfferLetter: (id: string, data: { offeredSalary?: number; startDate?: string }) => void;
}

export function KanbanBoard({ applicants, onStageChange, onSendOfferLetter }: Props) {
  const t = useTranslations('Recruitment');
  const [selected, setSelected] = useState<Applicant | null>(null);

  const LABELS: Record<string, string> = {
    applied: t('applied'), shortlisted: t('shortlisted'),
    interview_scheduled: t('interviewScheduled'), offer_sent: t('offerSent'),
    hired: t('hired'), rejected: t('rejected'),
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={LABELS[stage]}
            applicants={applicants.filter((a) => a.stage === stage)}
            onSelect={setSelected}
          />
        ))}
      </div>
      {selected && (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelected(null)}
          onStageChange={(stage, extra) => { onStageChange(selected._id, stage, extra); setSelected(null); }}
          onSendOfferLetter={(data) => { onSendOfferLetter(selected._id, data); setSelected(null); }}
        />
      )}
    </>
  );
}
