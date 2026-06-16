'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Mail, UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { parseCurrencyInput } from '@/lib/utils';
import type { Applicant } from '../Hooks/useRecruitment';

const STAGES = ['applied','shortlisted','interview_scheduled','offer_sent','hired','rejected'];

interface Props {
  applicant: Applicant;
  onClose: () => void;
  onStageChange: (s: string, extra?: Record<string, unknown>) => void;
  onSendOfferLetter: (data: { offeredSalary?: number; startDate?: string }) => void;
}

export function ApplicantDrawer({ applicant, onClose, onStageChange, onSendOfferLetter }: Props) {
  const t = useTranslations('Recruitment');
  const [offeredSalary, setOfferedSalary] = useState(parseCurrencyInput(applicant.offeredSalary?.toString() ?? ''));
  const [startDate, setStartDate] = useState('');
  const [confirmHire, setConfirmHire] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-lg">{applicant.fullName}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-foreground/50">Email</p><p>{applicant.email}</p></div>
            <div><p className="text-xs text-foreground/50">Phone</p><p>{applicant.phone ?? '—'}</p></div>
            <div>
              <p className="text-xs text-foreground/50">Stage</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                {applicant.stage.replace(/_/g, ' ')}
              </span>
            </div>
            {applicant.offerLetterSentAt && (
              <div><p className="text-xs text-foreground/50">Offer Sent</p>
                <p className="text-xs">{new Date(applicant.offerLetterSentAt).toLocaleDateString('en-KE')}</p>
              </div>
            )}
          </div>

          {/* Offer letter section */}
          <div className="rounded-lg border p-4 bg-amber-50 space-y-3">
            <p className="text-sm font-medium text-amber-900">Offer Details</p>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Offered Salary (KES)</label>
              <CurrencyInput
                value={offeredSalary}
                onChange={setOfferedSalary}
                placeholder="e.g. 85,000"
                className="bg-white focus:ring-amber-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-foreground/60">Expected Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white"
              />
            </div>
            <Button
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onSendOfferLetter({ offeredSalary: offeredSalary ? Number(offeredSalary) : undefined, startDate: startDate || undefined })}
            >
              <Mail className="h-4 w-4" /> Send Offer Letter (PDF)
            </Button>
          </div>

          {/* Hired button */}
          {applicant.stage === 'offer_sent' && (
            confirmHire ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Confirm Hire</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      This will mark <strong>{applicant.fullName}</strong> as hired, create their employee profile, and start onboarding.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmHire(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      onStageChange('hired', { offeredSalary: offeredSalary ? Number(offeredSalary) : undefined });
                      toast.success(`${applicant.fullName} has been marked as hired!`);
                      onClose();
                    }}
                  >
                    <UserCheck className="h-4 w-4" /> Yes, Hire
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setConfirmHire(true)}
              >
                <UserCheck className="h-4 w-4" /> Mark as Hired
              </Button>
            )
          )}

          {/* Stage movement */}
          <div>
            <p className="text-sm font-medium mb-2">{t('moveToStage')}</p>
            <div className="flex flex-wrap gap-2">
              {STAGES.filter((s) => s !== applicant.stage && s !== 'hired').map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => onStageChange(s)}>
                  {s.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
