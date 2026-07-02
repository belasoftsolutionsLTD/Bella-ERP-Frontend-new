'use client';

import { useState } from 'react';
import { X, UserX } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { Applicant } from '../Hooks/useRecruitment';

const REJECTION_REASONS = [
  'Not enough experience',
  'Position filled',
  'Salary expectations not met',
  'Failed assessment',
  'Culture fit',
  'Overqualified',
  'Other',
];

interface Props {
  applicant: Applicant;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectionModal({ applicant, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReject = () => {
    if (!reason) return;
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/hr/applicants/${applicant._id}/stage`,
      method: 'PATCH',
      data: { stage: 'rejected', rejectionReason: reason, rejectionNote: note },
      thenFn: () => { onSuccess(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
            <UserX className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-slate-900">Reject Applicant</h2>
            <p className="text-xs text-slate-400">{applicant.fullName} · {applicant.positionTitle ?? 'Unknown Position'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="h-10 w-full border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 bg-white appearance-none"
            >
              <option value="">Select a reason…</option>
              {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Internal Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Additional notes for HR records…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose}
            className="h-10 px-5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleReject} disabled={!reason || submitting}
            className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {submitting ? 'Rejecting…' : 'Reject Applicant'}
          </button>
        </div>
      </div>
    </div>
  );
}
