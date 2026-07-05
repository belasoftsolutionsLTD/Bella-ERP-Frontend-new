'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Mail, Phone, MapPin, ExternalLink, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Application, JobRequisition } from '../types';
import { APPLICATION_STATUS_STYLES, SOURCE_LABELS } from '../constants';
import { useScorecards } from '../Hooks/useScorecards';
import { useUserAccounts } from '../Hooks/useUserAccounts';
import { RECOMMENDATION_LABELS } from '../constants';

export function ApplicationDrawer({ application, requisition, locale, onClose, onMoveStage, onUpdateStatus, onExtendOffer, onAssignInterviewer, onUnassignInterviewer }: {
  application: Application;
  requisition: JobRequisition;
  locale: string;
  onClose: () => void;
  onMoveStage: (stageId: string) => void;
  onUpdateStatus: (status: string, rejectionReason?: string) => void;
  onExtendOffer: (payload: { salary: number; currency: string; startDate: string; expiresAt: string }) => void;
  onAssignInterviewer: (stageId: string, interviewerId: string) => void;
  onUnassignInterviewer: (stageId: string, interviewerId: string) => void;
}) {
  const { scorecards } = useScorecards(application._id);
  const { accounts } = useUserAccounts();
  const [tab, setTab] = useState<'overview' | 'history' | 'scorecards' | 'offer'>('overview');
  const [offerForm, setOfferForm] = useState({ salary: '', currency: 'KES', startDate: '', expiresAt: '' });
  const [pickedInterviewer, setPickedInterviewer] = useState('');
  const candidate = application.candidate;
  const currentStage = requisition.pipelineStages.find((s) => s.id === application.currentStageId);
  const assignedForCurrentStage = (application.interviewAssignments || []).filter((a) => a.stageId === application.currentStageId);
  const submittedInterviewerIdsForCurrentStage = new Set(
    scorecards.filter((sc) => sc.stageId === application.currentStageId).map((sc) => sc.interviewerId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-xl shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">{candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate'}</h2>
            <p className="text-xs text-slate-500">{requisition.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-100">
          {candidate?.email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {candidate.email}</p>}
          {candidate?.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {candidate.phone}</p>}
          {candidate?.location && <p className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {candidate.location}</p>}
          {candidate?.resumeUrl && (
            <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View resume
            </a>
          )}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${APPLICATION_STATUS_STYLES[application.status]}`}>{application.status}</span>
            {candidate && <span className="text-xs text-slate-400">{SOURCE_LABELS[candidate.source]}</span>}
          </div>
        </div>

        <div className="flex border-b border-slate-100 text-sm">
          {(['overview', 'history', 'scorecards', 'offer'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 capitalize ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {tab === 'overview' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Move to stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {requisition.pipelineStages.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onMoveStage(s.id)}
                      disabled={s.id === application.currentStageId || application.status !== 'active'}
                      className={`text-xs px-2.5 py-1 rounded-full border ${s.id === application.currentStageId ? 'bg-primary text-white border-primary' : 'border-slate-300 text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {currentStage?.requiresScorecard && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Assigned interviewer(s) for &quot;{currentStage.name}&quot;
                    {assignedForCurrentStage.length > 0 && (
                      <span className="ml-1 text-slate-400">
                        ({submittedInterviewerIdsForCurrentStage.size} of {assignedForCurrentStage.length} submitted)
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedForCurrentStage.map((a) => {
                      const hasSubmitted = submittedInterviewerIdsForCurrentStage.has(a.interviewerId);
                      return (
                        <span
                          key={a.interviewerId}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${hasSubmitted ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {hasSubmitted && <FileCheck className="h-3 w-3" />}
                          {a.interviewerName}
                          <button onClick={() => onUnassignInterviewer(a.stageId, a.interviewerId)} className="text-slate-400 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                    {assignedForCurrentStage.length === 0 && <span className="text-xs text-slate-400">Unassigned — anyone can submit a scorecard.</span>}
                  </div>
                  <div className="flex gap-2">
                    <select value={pickedInterviewer} onChange={(e) => setPickedInterviewer(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                      <option value="">Assign an interviewer...</option>
                      {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!pickedInterviewer}
                      onClick={() => { onAssignInterviewer(currentStage.id, pickedInterviewer); setPickedInterviewer(''); }}
                    >
                      Assign
                    </Button>
                  </div>
                  <Link
                    href={`/${locale}/recruitment/requisitions/${requisition._id}/scorecards/${application._id}/new`}
                    className="inline-block text-sm text-primary hover:underline"
                  >
                    Submit scorecard for this stage →
                  </Link>
                </div>
              )}

              {application.status === 'active' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => onUpdateStatus('rejected', 'Not proceeding')}>
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onUpdateStatus('withdrawn')}>
                    Mark Withdrawn
                  </Button>
                </div>
              )}

              {application.coverLetter && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Cover Letter</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{application.coverLetter}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <ol className="space-y-3">
              {application.stageHistory.map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-slate-800">{h.stageName}</p>
                  <p className="text-xs text-slate-500">
                    Entered {new Date(h.enteredAt).toLocaleDateString()}
                    {h.exitedAt ? ` · Exited ${new Date(h.exitedAt).toLocaleDateString()}` : ' · Current'}
                  </p>
                </li>
              ))}
            </ol>
          )}

          {tab === 'scorecards' && (
            <div className="space-y-3">
              {scorecards.length === 0 && <p className="text-sm text-slate-500">No scorecards submitted yet.</p>}
              {scorecards.map((sc) => (
                <div key={sc._id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{sc.interviewerName}</p>
                    <span className="text-xs font-medium text-slate-500">{RECOMMENDATION_LABELS[sc.overallRecommendation]}</span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {sc.competencyRatings.map((r) => (
                      <div key={r.competencyId} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{r.competencyName}</span>
                        <span>{r.rating}/5</span>
                      </div>
                    ))}
                  </div>
                  {sc.strengths && <p className="text-xs text-slate-500 mt-2"><span className="font-medium">Strengths:</span> {sc.strengths}</p>}
                  {sc.concerns && <p className="text-xs text-slate-500 mt-1"><span className="font-medium">Concerns:</span> {sc.concerns}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'offer' && (
            <div className="space-y-3">
              {application.offerDetails ? (
                <div className="text-sm space-y-1">
                  <p><span className="text-slate-500">Salary:</span> {application.offerDetails.currency} {application.offerDetails.salary.toLocaleString()}</p>
                  <p><span className="text-slate-500">Start date:</span> {new Date(application.offerDetails.startDate).toLocaleDateString()}</p>
                  <p><span className="text-slate-500">Expires:</span> {new Date(application.offerDetails.expiresAt).toLocaleDateString()}</p>
                  <p><span className="text-slate-500">Status:</span> {application.offerDetails.status}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input placeholder="Salary" type="number" value={offerForm.salary} onChange={(e) => setOfferForm((f) => ({ ...f, salary: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <input placeholder="Currency" value={offerForm.currency} onChange={(e) => setOfferForm((f) => ({ ...f, currency: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <label className="block text-xs text-slate-500">Start date</label>
                  <input type="date" value={offerForm.startDate} onChange={(e) => setOfferForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <label className="block text-xs text-slate-500">Expires</label>
                  <input type="date" value={offerForm.expiresAt} onChange={(e) => setOfferForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  <Button
                    size="sm"
                    className="bg-primary text-white w-full"
                    onClick={() => onExtendOffer({ salary: Number(offerForm.salary), currency: offerForm.currency, startDate: offerForm.startDate, expiresAt: offerForm.expiresAt })}
                  >
                    Extend Offer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
