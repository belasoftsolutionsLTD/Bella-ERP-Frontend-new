'use client';

import { useState } from 'react';
import { X, UserCheck, PartyPopper, ClipboardList } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { Applicant } from '../Hooks/useRecruitment';

interface Props {
  applicant: Applicant;
  onClose: () => void;
  onSuccess: () => void;
}

export function HireModal({ applicant, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [startDate, setStartDate] = useState('');
  const [hiredEmployeeId, setHiredEmployeeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  const handleConfirmHire = () => {
    setSubmitting(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/hr/applicants/${applicant._id}/stage`,
      method: 'PATCH',
      data: { stage: 'hired', hireDate: startDate || undefined },
      thenFn: res => {
        const empId = res.data?.employeeId ?? null;
        setHiredEmployeeId(empId);
        setStep(2);
        onSuccess();
      },
      finallyFn: () => setSubmitting(false),
    });
  };

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Congratulations!</h2>
          <p className="text-sm text-slate-500 mb-6">
            <strong>{applicant.fullName}</strong> has been marked as hired
            {applicant.positionTitle ? ` for ${applicant.positionTitle}` : ''}. Their employee profile has been created.
          </p>
          <div className="flex flex-col gap-3">
            {hiredEmployeeId && (
              <button
                onClick={() => { onClose(); router.push(`/${locale}/onboarding/${hiredEmployeeId}`); }}
                className="flex items-center justify-center gap-2 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                Start Onboarding Now
              </button>
            )}
            <button onClick={onClose}
              className="h-11 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
              Do it later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-slate-900">Mark as Hired</h2>
            <p className="text-xs text-slate-400">{applicant.fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800">
            You are about to mark <strong>{applicant.fullName}</strong> as hired
            {applicant.positionTitle ? ` for ${applicant.positionTitle}` : ''}.
            This will create their employee profile and start onboarding.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Start Date (optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-10 w-full border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose}
            className="h-10 px-5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmHire} disabled={submitting}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {submitting ? 'Processing…' : 'Confirm Hire'}
          </button>
        </div>
      </div>
    </div>
  );
}
