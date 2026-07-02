'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveRequestSchema, type LeaveRequestFormValues } from './LeaveSchema';
import type { LeaveBalance } from './useLeave';

export function LeaveRequestForm({
  employeeId,
  onSuccess,
  balance,
}: {
  employeeId: string;
  onSuccess?: () => void;
  balance?: LeaveBalance | null;
}) {
  const t = useTranslations('Leave');
  const tc = useTranslations('Common');
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { employeeId },
  });

  const submit = (data: LeaveRequestFormValues) => apiCallFunction({
    url: `${API_BASE_URL}/leave/requests`,
    method: 'POST',
    data,
    thenFn: () => onSuccess?.(),
  });

  const fallbackLeaveTypes = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'emergency'];
  const leaveOptions = Object.entries(balance?.balances ?? {})
    .map(([value]) => ({
      value,
      label: (t as any)(value) || value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }))
    .filter((opt) => opt.value)
    .concat(
      balance ? [] : fallbackLeaveTypes.map((value) => ({
        value,
        label: (t as any)(value) || value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      }))
    );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <CustomInput component="select" name="leaveType" control={control} label={t('leaveType')} options={leaveOptions} />
      <CustomInput component="date" name="startDate" control={control} label={t('startDate')} />
      <CustomInput component="date" name="endDate" control={control} label={t('endDate')} />
      <CustomInput component="textarea" name="reason" control={control} label={t('reason')} />
      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white">
        {isSubmitting ? tc('loading') : t('requestLeave')}
      </Button>
    </form>
  );
}
