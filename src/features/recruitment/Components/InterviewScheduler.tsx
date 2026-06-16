'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const schema = z.object({
  applicantId: z.string().min(1),
  interviewerId: z.string().min(1),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  location: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function InterviewScheduler({ applicantId, onSuccess }: { applicantId: string; onSuccess?: () => void }) {
  const t = useTranslations('Recruitment');
  const tc = useTranslations('Common');
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { applicantId },
  });

  const submit = (data: FormValues) => apiCallFunction({
    url: `${API_BASE_URL}/hr/interviews`,
    method: 'POST',
    data,
    thenFn: () => onSuccess?.(),
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <CustomInput component="text" name="interviewerId" control={control} label={t('interviewer')} />
      <CustomInput component="date" name="scheduledDate" control={control} label={t('scheduledDate')} />
      <CustomInput component="text" name="scheduledTime" control={control} label={t('scheduledTime')} placeholder="e.g. 10:00 AM" />
      <CustomInput component="text" name="location" control={control} label={t('location')} />
      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white">
        {isSubmitting ? tc('loading') : t('scheduleInterview')}
      </Button>
    </form>
  );
}
