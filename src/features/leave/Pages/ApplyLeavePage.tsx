'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useMyLeaveTypeOptions, useMyLeaveBalances, useMyLeaveRequests, useMyLeaveCalendar } from '../Hooks/useMyLeave';
import { CreateLeaveRequestSchema, type CreateLeaveRequestFormValues } from '../schemas';

const STEPS = ['Leave Type', 'Dates', 'Reason & Attachment', 'Review'];

function calcWorkingDays(start: string, end: string, holidayDates: Set<string>, countPublicHolidays: boolean, hasHalfDay: boolean) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e < s) return 0;
  let days = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    const iso = cur.toISOString().slice(0, 10);
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = !countPublicHolidays && holidayDates.has(iso);
    if (!isWeekend && !isHoliday) days += 1;
    cur.setDate(cur.getDate() + 1);
  }
  if (hasHalfDay) days -= 0.5;
  return Math.max(days, 0);
}

export default function ApplyLeavePage({ locale }: { locale: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [halfDayEnabled, setHalfDayEnabled] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [uploading, setUploading] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  const { leaveTypes, loading: typesLoading } = useMyLeaveTypeOptions();
  const { balances } = useMyLeaveBalances();
  const { mine, holidays } = useMyLeaveCalendar();
  const { apply } = useMyLeaveRequests();

  const { control, register, handleSubmit, watch, trigger, setValue, formState: { errors, isSubmitting } } =
    useForm<CreateLeaveRequestFormValues>({
      resolver: zodResolver(CreateLeaveRequestSchema),
      defaultValues: { leaveTypeId: '', startDate: '', endDate: '', reason: '', attachmentUrl: undefined },
    });

  const values = watch();
  const selectedType = leaveTypes.find(t => t._id === values.leaveTypeId);
  const selectedBalance = balances.find(b => b.leaveTypeId === values.leaveTypeId);
  const holidayDates = useMemo(() => new Set(holidays.map((h: any) => h.date)), [holidays]);

  const totalDays = calcWorkingDays(values.startDate, values.endDate, holidayDates, !!selectedType?.countPublicHolidays, halfDayEnabled);
  const balanceAfter = selectedBalance ? selectedBalance.closingBalance - totalDays : null;

  const overlap = mine.find(r =>
    ['pending', 'approved'].includes(r.status) && values.startDate && values.endDate &&
    new Date(values.startDate) <= new Date(r.endDate) && new Date(values.endDate) >= new Date(r.startDate)
  );

  const stepFields: (keyof CreateLeaveRequestFormValues)[][] = [
    ['leaveTypeId'], ['startDate', 'endDate'], ['reason'], [],
  ];

  const next = async () => {
    if (step === 1) {
      if (!values.startDate || !values.endDate) { toast.error('Select a start and end date.'); return; }
      if (new Date(values.endDate) < new Date(values.startDate)) { toast.error('End date must be after start date.'); return; }
      if (totalDays <= 0) { toast.error('Selected dates contain no working days.'); return; }
    }
    const valid = await trigger(stepFields[step] as any);
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    await apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/my/requests/new/attachment`, method: 'POST', data: formData, showToast: false,
      thenFn: (r) => { setValue('attachmentUrl', r.data?.attachmentUrl); setAttachmentName(file.name); toast.success('Attachment uploaded.'); },
      catchFn: () => toast.error('Failed to upload attachment.'),
    });
    setUploading(false);
  };

  const onSubmit = (formValues: CreateLeaveRequestFormValues) => {
    if (selectedType?.requiresAttachment && !formValues.attachmentUrl) {
      toast.error(`${selectedType.name} requires a supporting attachment.`);
      setStep(2);
      return;
    }
    apply(
      {
        ...formValues,
        halfDay: halfDayEnabled ? { date: formValues.startDate, period: halfDayPeriod } : undefined,
      },
      () => { toast.success('Leave request submitted.'); router.push(`/${locale}/my/leave/requests`); },
      (message) => toast.error(message),
    );
  };

  if (typesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">Apply for Leave</h1>
        <p className="text-sm text-brand-text-secondary">Follow the steps below to submit a leave request.</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold',
              i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20 text-primary' : 'bg-brand-bg-soft text-brand-text-muted')}>
              {i + 1}
            </div>
            <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-brand-text' : 'text-brand-text-muted')}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-brand-bg-muted" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Select Leave Type</h2>
            {leaveTypes.length === 0 && <p className="text-sm text-brand-text-secondary">No active leave types available. Contact HR.</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {leaveTypes.map(t => {
                const bal = balances.find(b => b.leaveTypeId === t._id);
                const selected = values.leaveTypeId === t._id;
                return (
                  <button key={t._id} type="button" onClick={() => setValue('leaveTypeId', t._id, { shouldValidate: true })}
                    className={cn('text-left p-4 rounded-xl border-2 transition-colors', selected ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300')}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-0.5">{t.isPaid ? 'Paid' : 'Unpaid'}{t.requiresAttachment ? ' · Attachment required' : ''}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{bal ? bal.closingBalance : '—'}<span className="text-xs font-normal text-brand-text-secondary"> days left</span></p>
                  </button>
                );
              })}
            </div>
            {errors.leaveTypeId && <p className="text-xs text-danger">{errors.leaveTypeId.message}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Select Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput component="date" name="startDate" control={control} label="Start Date" />
              <CustomInput component="date" name="endDate" control={control} label="End Date" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={halfDayEnabled} onChange={(e) => setHalfDayEnabled(e.target.checked)} className="h-4 w-4" />
              Half day <Sun className="h-3.5 w-3.5 text-amber-500" />
            </label>
            {halfDayEnabled && (
              <div className="flex gap-3">
                {(['morning', 'afternoon'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setHalfDayPeriod(p)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize', halfDayPeriod === p ? 'bg-primary text-white' : 'bg-slate-100 text-brand-text-muted')}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-brand-text-muted">Working days requested</span><span className="font-semibold text-slate-800">{totalDays}</span></div>
              {selectedBalance && (
                <div className="flex justify-between text-sm"><span className="text-brand-text-muted">Balance after this request</span>
                  <span className={cn('font-semibold', balanceAfter !== null && balanceAfter < 0 ? 'text-red-600' : 'text-slate-800')}>{balanceAfter}</span>
                </div>
              )}
            </div>

            {balanceAfter !== null && balanceAfter < 0 && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> This request exceeds your available balance.
              </div>
            )}
            {overlap && (
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> This overlaps with an existing {overlap.status} request ({new Date(overlap.startDate).toLocaleDateString()} – {new Date(overlap.endDate).toLocaleDateString()}).
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Reason &amp; Attachment</h2>
            <CustomInput component="textarea" name="reason" control={control} label="Reason (optional)" placeholder="Add any context for your approver…" />
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Attachment {selectedType?.requiresAttachment && <span className="text-red-500">*</span>}
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary cursor-pointer hover:underline">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading…' : attachmentName ? `Replace file (${attachmentName})` : 'Upload file'}
                <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
              {attachmentName && !uploading && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {attachmentName}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Review &amp; Submit</h2>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-brand-text-muted">Leave Type</span><span className="font-medium text-slate-800">{selectedType?.name}</span></div>
              <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-brand-text-muted">Dates</span><span className="font-medium text-slate-800">{values.startDate} – {values.endDate}{halfDayEnabled ? ` (${halfDayPeriod} half day)` : ''}</span></div>
              <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-brand-text-muted">Working Days</span><span className="font-medium text-slate-800">{totalDays}</span></div>
              <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-brand-text-muted">Balance After</span><span className="font-medium text-slate-800">{balanceAfter}</span></div>
              {values.reason && <div className="px-4 py-2.5 text-sm"><span className="text-brand-text-muted block mb-0.5">Reason</span><span className="text-slate-800">{values.reason}</span></div>}
              {attachmentName && <div className="flex justify-between px-4 py-2.5 text-sm"><span className="text-brand-text-muted">Attachment</span><span className="font-medium text-slate-800">{attachmentName}</span></div>}
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-brand-text-muted">
              {selectedType?.requiresApproval === false ? (
                <p>This leave type does not require approval — it will be approved automatically on submission.</p>
              ) : (
                <p>Your request will route to your reporting manager for approval, then your department head if applicable, and to HR for requests longer than {5} days.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={back} disabled={step === 0}
            className="flex items-center gap-1 text-sm font-semibold text-brand-text-muted hover:text-slate-800 disabled:opacity-0 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-1 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Request
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
