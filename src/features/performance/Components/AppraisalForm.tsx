'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { appraisalSchema, type AppraisalFormValues } from './AppraisalSchema';

const QUARTER_OPTS = [
  { value: '',        label: '— Select period —',          disabled: true },
  { value: 'Q1',     label: 'Q1 — January to March' },
  { value: 'Q2',     label: 'Q2 — April to June' },
  { value: 'Q3',     label: 'Q3 — July to September' },
  { value: 'Q4',     label: 'Q4 — October to December' },
  { value: 'H1',     label: 'H1 — First Half (Jan – Jun)' },
  { value: 'H2',     label: 'H2 — Second Half (Jul – Dec)' },
  { value: '3M-Jan', label: '3-Month — Starting January' },
  { value: '3M-Apr', label: '3-Month — Starting April' },
  { value: '3M-Jul', label: '3-Month — Starting July' },
  { value: '3M-Oct', label: '3-Month — Starting October' },
  { value: 'Annual',    label: 'Annual Review' },
  { value: 'Probation', label: 'Probation Review' },
  { value: 'Custom',    label: 'Custom / Ad-hoc' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTS = [currentYear, currentYear - 1, currentYear - 2].map(y => ({ value: String(y), label: String(y) }));

export function AppraisalForm({ employeeId, onSuccess }: { employeeId: string; onSuccess?: () => void }) {
  const t = useTranslations('Performance');
  const tc = useTranslations('Common');
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<AppraisalFormValues>({
    resolver: zodResolver(appraisalSchema),
    defaultValues: { employeeId, rating: 3, reviewYear: String(currentYear) },
  });

  const submit = (data: AppraisalFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/performance`,
    method: 'POST',
    data: {
      ...data,
      reviewPeriod: `${data.reviewPeriod} ${data.reviewYear}`,
      goalsSet: data.goalsSet?.split('\n').filter(Boolean) ?? [],
      goalsAchieved: data.goalsAchieved?.split('\n').filter(Boolean) ?? [],
    },
    thenFn: () => onSuccess?.(),
  });

  const ratingOpts = [1,2,3,4,5].map((v) => ({ value: String(v), label: `${v} Star${v !== 1 ? 's' : ''}` }));

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <CustomInput component="select" name="reviewPeriod" control={control} label="Review Period" options={QUARTER_OPTS} />
        <CustomInput component="select" name="reviewYear"   control={control} label="Year"    options={YEAR_OPTS} />
      </div>
      <CustomInput component="select"   name="rating"        control={control} label={t('rating')} options={ratingOpts} />
      <CustomInput component="textarea" name="goalsSet"      control={control} label={t('goalsSet')} placeholder="One goal per line" />
      <CustomInput component="textarea" name="goalsAchieved" control={control} label={t('goalsAchieved')} placeholder="One goal per line" />
      <CustomInput component="textarea" name="comments"      control={control} label={t('comments')} />
      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white">
        {isSubmitting ? tc('loading') : t('newAppraisal')}
      </Button>
    </form>
  );
}
