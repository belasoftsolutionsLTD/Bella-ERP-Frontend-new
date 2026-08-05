'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitScorecardSchema, type SubmitScorecardFormValues } from '../schemas';
import { RECOMMENDATION_LABELS } from '../constants';
import type { MyInterview } from '../types';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

// Self-contained scorecard form for the "My Interviews" self-service view — unlike
// ScorecardForm (used inside the HR-internal ApplicationDrawer), it never fetches the
// requisition or application, since GET /requisitions/:id and GET .../applications are
// MGMT-gated and a plain staff interviewer can't call them. Everything it needs
// (competencies, stageId) comes pre-denormalized on the MyInterview row itself.
export function SubmitScorecardModal({
  interview, onClose, onSubmit,
}: {
  interview: MyInterview;
  onClose: () => void;
  onSubmit: (applicationId: string, values: SubmitScorecardFormValues) => Promise<unknown>;
}) {
  const { control, register, handleSubmit, formState: { isSubmitting, errors } } = useForm<SubmitScorecardFormValues>({
    resolver: zodResolver(SubmitScorecardSchema),
    defaultValues: {
      stageId: interview.stageId,
      competencyRatings: interview.competencies.map((c) => ({ competencyId: c.id, competencyName: c.name, rating: 3, notes: '' })),
      strengths: '', concerns: '', overallRecommendation: 'neutral',
    },
  });
  const { fields } = useFieldArray({ control, name: 'competencyRatings' });

  const submit = async (values: SubmitScorecardFormValues) => {
    const result = await onSubmit(interview.applicationId, values);
    if (result) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Scorecard — {interview.candidateName}</h2>
            <p className="text-xs text-slate-500">{interview.jobTitle} · {interview.stageName}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          {fields.length === 0 && <p className="text-sm text-slate-400">This requisition has no competencies configured.</p>}

          {fields.map((field, i) => {
            const competency = interview.competencies[i];
            return (
              <div key={field.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{competency?.name}</p>
                    {competency?.description && <p className="text-xs text-slate-500">{competency.description}</p>}
                  </div>
                  <Controller
                    control={control}
                    name={`competencyRatings.${i}.rating`}
                    render={({ field: f }) => <StarRating value={f.value} onChange={f.onChange} />}
                  />
                </div>
                <textarea {...register(`competencyRatings.${i}.notes`)} placeholder="Notes" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            );
          })}

          <div>
            <label className="text-sm font-medium text-slate-700">Strengths</label>
            <textarea {...register('strengths')} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.strengths && <p className="text-xs text-danger mt-1">{errors.strengths.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Concerns</label>
            <textarea {...register('concerns')} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {errors.concerns && <p className="text-xs text-danger mt-1">{errors.concerns.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Overall Recommendation</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(RECOMMENDATION_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" value={value} {...register('overallRecommendation')} /> {label}
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="bg-primary text-white w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Scorecard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
