'use client';

import { useState } from 'react';
import { useRequisition } from '../Hooks/useRequisitions';
import { useApplications } from '../Hooks/useApplications';
import { useRequisitionFunnel } from '../Hooks/useAnalytics';
import { PipelineKanban } from '../Components/PipelineKanban';
import { REQUISITION_STATUS_STYLES, REQUISITION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS } from '../constants';
import { Button } from '@/components/ui/button';
import type { JobRequisition } from '../types';

function ScorecardsTab({ requisition }: { requisition: JobRequisition }) {
  const { applications } = useApplications(requisition._id);
  const stageName = (stageId: string) => requisition.pipelineStages.find((s) => s.id === stageId)?.name ?? stageId;
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2">Candidate</th>
            <th className="text-left px-4 py-2">Stage</th>
            <th className="text-left px-4 py-2">Scorecards</th>
            <th className="text-left px-4 py-2">Overall Score</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a._id} className="border-t border-slate-100">
              <td className="px-4 py-2">{a.candidate ? `${a.candidate.firstName} ${a.candidate.lastName}` : '—'}</td>
              <td className="px-4 py-2 text-slate-500">{stageName(a.currentStageId)}</td>
              <td className="px-4 py-2">{a.scorecards?.length ?? 0}</td>
              <td className="px-4 py-2">{a.overallScore != null ? `${a.overallScore.toFixed(1)}/5` : '—'}</td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No applications yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsTab({ requisitionId }: { requisitionId: string }) {
  const { totalApplicants, funnel, isLoading } = useRequisitionFunnel(requisitionId);
  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <p className="text-sm text-slate-500">{totalApplicants} total applicant{totalApplicants !== 1 ? 's' : ''}</p>
      {funnel.map((f) => (
        <div key={f.stageId}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{f.stageName}</span>
            <span className="text-slate-500">{f.count} ({f.conversionRate}%)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${f.conversionRate}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ requisitionId }: { requisitionId: string }) {
  const { requisition, submitForApproval, approve, closeRequisition } = useRequisition(requisitionId);
  if (!requisition) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div>
        <p className="text-xs text-slate-500 mb-2">Approval Chain</p>
        <div className="space-y-2">
          {requisition.approvalChain.map((a) => (
            <div key={a.approverId} className="flex items-center justify-between text-sm">
              <span>{a.approverName}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === 'approved' ? 'bg-green-50 text-green-700' : a.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                {a.status}
              </span>
            </div>
          ))}
          {requisition.approvalChain.length === 0 && <p className="text-sm text-slate-400">No approvers configured.</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        {requisition.status === 'draft' && (
          <Button size="sm" className="bg-primary text-white" onClick={() => submitForApproval()}>Submit for Approval</Button>
        )}
        {requisition.status === 'pendingApproval' && (
          <>
            <Button size="sm" className="bg-green-600 text-white" onClick={() => approve('approved')}>Approve</Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => approve('rejected')}>Reject</Button>
          </>
        )}
        {requisition.status !== 'closed' && (
          <Button size="sm" variant="outline" onClick={() => closeRequisition()}>Close Requisition</Button>
        )}
      </div>
    </div>
  );
}

export function RequisitionDetailPage({ id, locale }: { id: string; locale: string }) {
  const { requisition, isLoading } = useRequisition(id);
  const [tab, setTab] = useState<'pipeline' | 'scorecards' | 'analytics' | 'settings'>('pipeline');

  if (isLoading) return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  if (!requisition) return <div className="p-6 text-sm text-slate-400">Requisition not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{requisition.title}</h1>
          <p className="text-sm text-slate-400">{requisition.department} · {requisition.location} · {EMPLOYMENT_TYPE_LABELS[requisition.employmentType]}</p>
        </div>
        <button
          onClick={() => setTab('settings')}
          title="Manage requisition status"
          className={`text-xs font-medium px-2.5 py-1 rounded-full border hover:opacity-80 transition ${REQUISITION_STATUS_STYLES[requisition.status]}`}
        >
          {REQUISITION_STATUS_LABELS[requisition.status]}
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {(['pipeline', 'scorecards', 'analytics', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize ${tab === t ? 'text-primary border-b-2 border-primary font-medium' : 'text-slate-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && <PipelineKanban requisition={requisition} locale={locale} />}
      {tab === 'scorecards' && <ScorecardsTab requisition={requisition} />}
      {tab === 'analytics' && <AnalyticsTab requisitionId={requisition._id} />}
      {tab === 'settings' && <SettingsTab requisitionId={requisition._id} />}
    </div>
  );
}
