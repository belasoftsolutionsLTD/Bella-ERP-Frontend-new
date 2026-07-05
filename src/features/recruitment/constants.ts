import type { RequisitionStatus, StageType, ApplicationStatus, CandidateSource, PipelineStage } from './types';

export const REQUISITION_STATUS_STYLES: Record<RequisitionStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pendingApproval: 'bg-amber-50 text-amber-700 border-amber-200',
  open: 'bg-green-50 text-green-700 border-green-200',
  onHold: 'bg-orange-50 text-orange-700 border-orange-200',
  filled: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  draft: 'Draft',
  pendingApproval: 'Pending Approval',
  open: 'Open',
  onHold: 'On Hold',
  filled: 'Filled',
  closed: 'Closed',
};

export const STAGE_TYPE_STYLES: Record<StageType, string> = {
  sourcing: 'bg-slate-50 text-slate-600 border-slate-200',
  screening: 'bg-blue-50 text-blue-700 border-blue-200',
  interview: 'bg-purple-50 text-purple-700 border-purple-200',
  assessment: 'bg-pink-50 text-pink-700 border-pink-200',
  offer: 'bg-amber-50 text-amber-700 border-amber-200',
  hired: 'bg-green-50 text-green-700 border-green-200',
};

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
  hired: 'bg-green-50 text-green-700 border-green-200',
};

export const SOURCE_LABELS: Record<CandidateSource, string> = {
  careerSite: 'Career Site',
  referral: 'Referral',
  agency: 'Agency',
  sourced: 'Sourced',
  inbound: 'Inbound',
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  fullTime: 'Full-Time',
  partTime: 'Part-Time',
  contract: 'Contract',
  internship: 'Internship',
};

export const STAGE_TYPE_OPTIONS: { value: StageType; label: string }[] = [
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
];

export const RECOMMENDATION_LABELS: Record<string, string> = {
  strongYes: 'Strong Yes',
  yes: 'Yes',
  neutral: 'Neutral',
  no: 'No',
  strongNo: 'Strong No',
};

export const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

// Whether moving from one pipeline stage to another goes backward in the configured order —
// used to prompt for confirmation before an accidental/careless backward drag.
export const isBackwardMove = (stages: PipelineStage[], fromStageId: string, toStageId: string) => {
  const fromIndex = stages.findIndex((s) => s.id === fromStageId);
  const toIndex = stages.findIndex((s) => s.id === toStageId);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex < fromIndex;
};
