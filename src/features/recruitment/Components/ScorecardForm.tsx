'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequisition } from '../Hooks/useRequisitions';
import { useApplications } from '../Hooks/useApplications';
import { useScorecards } from '../Hooks/useScorecards';
import { SubmitScorecardSchema, type SubmitScorecardFormValues } from '../schemas';
import { RECOMMENDATION_LABELS } from '../constants';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-brand-text-secondary'}`} />
        </button>
      ))}
    </div>
  );
}

export function ScorecardForm({ requisitionId, applicationId, locale }: { requisitionId: string; applicationId: string; locale: string }) {
  const router = useRouter();
  const { requisition, isLoading: reqLoading } = useRequisition(requisitionId);
  const { applications } = useApplications(requisitionId);
  const { submitScorecard } = useScorecards(applicationId);
  const application = applications.find((a) => a._id === applicationId);

  const { control, register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<SubmitScorecardFormValues>({
    resolver: zodResolver(SubmitScorecardSchema),
    defaultValues: { stageId: '', competencyRatings: [], strengths: '', concerns: '', overallRecommendation: 'neutral' },
  });
  const { fields } = useFieldArray({ control, name: 'competencyRatings' });

  useEffect(() => {
    if (requisition && application) {
      reset({
        stageId: application.currentStageId,
        competencyRatings: requisition.competencies.map((c) => ({ competencyId: c.id, competencyName: c.name, rating: 3, notes: '' })),
        strengths: '', concerns: '', overallRecommendation: 'neutral',
      });
    }
  }, [requisition?._id, application?._id]);

  if (reqLoading || !requisition) return <p className="text-sm text-slate-400 p-6">Loading...</p>;

  const onSubmit = async (values: SubmitScorecardFormValues) => {
    const result = await submitScorecard(values);
    if (result) router.push(`/${locale}/recruitment/requisitions/${requisitionId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-brand-text">Interview Scorecard — {requisition.title}</h1>

      {fields.length === 0 && <p className="text-sm text-slate-400">This requisition has no competencies configured.</p>}

      {fields.map((field, i) => {
        const competency = requisition.competencies[i];
        return (
          <div key={field.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{competency?.name}</p>
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

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Strengths</label>
          <textarea {...register('strengths')} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {errors.strengths && <p className="text-xs text-danger mt-1">{errors.strengths.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Concerns</label>
          <textarea {...register('concerns')} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
      </div>

      <Button type="submit" disabled={isSubmitting} className="bg-primary text-white w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Scorecard'}
      </Button>
    </form>
  );
}
