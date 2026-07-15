// Shared TypeScript interfaces for the recruitment module (mirrors backend collection shapes).
// All ObjectId refs and Dates are serialized as strings over the wire.

export type EmploymentType = 'fullTime' | 'partTime' | 'contract' | 'internship';
export type RequisitionStatus = 'draft' | 'pendingApproval' | 'open' | 'onHold' | 'filled' | 'closed';
export type StageType = 'sourcing' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired';
export type AutoActionTrigger = 'onEnter' | 'onExit';
export type AutoAction = 'notifyHiringManager' | 'emailCandidate' | 'autoReject';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CandidateSource = 'careerSite' | 'referral' | 'agency' | 'sourced' | 'inbound';
export type ApplicationStatus = 'active' | 'rejected' | 'withdrawn' | 'hired';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type Recommendation = 'strongYes' | 'yes' | 'neutral' | 'no' | 'strongNo';
export type TouchpointChannel = 'email' | 'linkedIn' | 'phone' | 'event';
export type CampaignStatus = 'active' | 'paused' | 'completed';
export type EmailTrigger = 'applicationReceived' | 'stageAdvance' | 'rejection' | 'offerExtended' | 'nurture' | 'interviewReminder';

export interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-5
}

export interface AutoActionConfig {
  trigger: AutoActionTrigger;
  action: AutoAction;
  templateId?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  requiresScorecard: boolean;
  scorecardTemplateId?: string;
  autoActions: AutoActionConfig[];
}

export interface Approver {
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  actedAt?: string;
  comment?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface JobRequisition {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  headcount: number;
  salaryRange: SalaryRange;
  description: string;
  competencies: Competency[];
  pipelineStages: PipelineStage[];
  screeningQuestions: ScreeningQuestion[];
  approvalChain: Approver[];
  status: RequisitionStatus;
  hiringManagerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  applicantCount?: number; // populated by GET /requisitions/:id
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  resumeUrl?: string;
  linkedInUrl?: string;
  source: CandidateSource;
  referredBy?: string;
  tags: string[];
  isPassiveTalent: boolean;
  consentGivenAt: string;
  consentVersion: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageHistoryEntry {
  stageId: string;
  stageName: string;
  enteredAt: string;
  exitedAt?: string;
  movedBy: string;
}

export interface OfferDetails {
  salary: number;
  currency: string;
  startDate: string;
  expiresAt: string;
  status: OfferStatus;
}

export interface ApplicationAnswer {
  questionId: string;
  answer: string;
}

export interface InterviewAssignment {
  stageId: string;
  interviewerId: string;
  interviewerName: string;
  scheduledAt: string;
  assignedAt: string;
}

export interface Application {
  _id: string;
  candidateId: string;
  requisitionId: string;
  currentStageId: string;
  stageHistory: StageHistoryEntry[];
  status: ApplicationStatus;
  rejectionReason?: string;
  offerDetails?: OfferDetails;
  coverLetter?: string;
  answers: ApplicationAnswer[];
  scorecards: string[];
  interviewAssignments: InterviewAssignment[];
  overallScore?: number;
  createdAt: string;
  updatedAt: string;
  // populated on the requisition applications-list endpoint only
  currentStageScorecards?: { submitted: number; required: number | null };
  // populated on list/detail endpoints
  candidate?: Candidate;
  requisition?: Pick<JobRequisition, '_id' | 'title' | 'department'>;
}

export interface CompetencyRating {
  competencyId: string;
  competencyName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface Scorecard {
  _id: string;
  applicationId: string;
  requisitionId: string;
  stageId: string;
  interviewerId: string;
  interviewerName: string;
  competencyRatings: CompetencyRating[];
  overallRecommendation: Recommendation;
  strengths: string;
  concerns: string;
  submittedAt: string;
}

export interface InterviewKitCompetency {
  competencyId: string;
  competencyName: string;
  suggestedQuestions: string[];
  evaluationGuidance: string;
}

export interface InterviewKit {
  _id: string;
  name: string;
  competencies: InterviewKitCompetency[];
  createdBy: string;
  createdAt: string;
}

export interface Touchpoint {
  candidateId: string;
  channel: TouchpointChannel;
  note: string;
  sentAt: string;
  byUserId: string;
  response?: string;
}

export interface NurtureCampaign {
  _id: string;
  name: string;
  description: string;
  targetTags: string[];
  touchpoints: Touchpoint[];
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  trigger: EmailTrigger;
  subject: string;
  body: string;
  createdBy: string;
}
