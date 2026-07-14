// TypeScript interfaces mirroring the backend offboarding data model
// (offboardingTemplates, offboardingRecords collections).
import type { OnboardingTask } from '../onboarding/types';

export type ExitType = 'resignation' | 'termination' | 'retirement' | 'redundancy' | 'contract_end';
export type OffboardingRecordStatus = 'initiated' | 'inProgress' | 'pendingClearance' | 'completed';
export type OffboardingTaskCategory =
  | 'assetRecovery' | 'accessRevocation' | 'knowledgeTransfer'
  | 'documentation' | 'exitInterview' | 'finalPay' | 'general';
export type GeneratedDocumentType = 'experienceLetter' | 'relievingLetter' | 'clearanceCertificate' | 'finalPayslip';
export type AssetCategory = 'device' | 'accessCard' | 'keys' | 'uniform' | 'other';
export type AccessCategory = 'email' | 'software' | 'buildingAccess' | 'vpn' | 'other';

export interface OffboardingTaskTemplate {
  id: string;
  title: string;
  description: string;
  dueOffsetDays: number;
  isRequired: boolean;
  category: OffboardingTaskCategory;
  // Internal hook for special backend behavior (e.g. 'spend_clearance' blocks
  // completion while the employee has open expense claims/purchase requests —
  // ported from the old system). Not part of the spec's category enum.
  taskType?: 'spend_clearance';
  requiresDocument: boolean;
}

export interface OffboardingTaskListTemplate {
  id: string;
  name: string;
  assignedTo: 'hr' | 'it' | 'manager' | 'finance' | 'employee';
  tasks: OffboardingTaskTemplate[];
}

export interface AssetChecklistTemplateItem {
  id: string;
  item: string;
  category: AssetCategory;
}

export interface AccessRevocationTemplateItem {
  id: string;
  system: string;
  category: AccessCategory;
}

export interface OffboardingTemplate {
  _id: string;
  name: string;
  exitTypes: ExitType[];
  taskLists: OffboardingTaskListTemplate[];
  assetChecklist: AssetChecklistTemplateItem[];
  accessRevocationList: AccessRevocationTemplateItem[];
  documentsToGenerate: GeneratedDocumentType[];
  createdBy?: string;
  createdAt: string;
}

export interface OffboardingTask extends OnboardingTask {
  category: OffboardingTaskCategory;
  taskType?: 'spend_clearance';
}

export interface OffboardingTaskListEntry {
  id: string;
  name: string;
  assignedTo: 'hr' | 'it' | 'manager' | 'finance' | 'employee';
  tasks: OffboardingTask[];
}

export interface AssetChecklistItem {
  id: string;
  item: string;
  category: AssetCategory;
  returned: boolean;
  returnedAt?: string;
  returnedTo?: string;
  condition?: string;
  notes?: string;
}

export interface AccessRevocationItem {
  id: string;
  system: string;
  category: AccessCategory;
  revoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
}

export interface ExitInterview {
  completedAt?: string;
  reasonForLeaving: string;
  jobSatisfactionRating: 1 | 2 | 3 | 4 | 5;
  managementRating: 1 | 2 | 3 | 4 | 5;
  wouldRecommendCompany: boolean;
  suggestions: string;
  additionalComments: string;
}

export interface GeneratedDocument {
  type: GeneratedDocumentType;
  generatedAt: string;
  fileUrl: string;
}

export interface OffboardingRecord {
  _id: string;
  employeeId: string;
  templateId: string;
  exitType: ExitType;
  exitReason: string;
  lastWorkingDay: string;
  noticePeriodStartDate: string;
  status: OffboardingRecordStatus;
  eligibleForRehire: boolean;
  taskLists: OffboardingTaskListEntry[];
  assetChecklist: AssetChecklistItem[];
  accessRevocationList: AccessRevocationItem[];
  exitInterview: Partial<ExitInterview>;
  generatedDocuments: GeneratedDocument[];
  finalPayTriggered: boolean;
  finalPayTriggeredAt?: string;
  completedAt?: string;
  initiatedBy?: string;
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  employee?: { _id: string; fullName: string; staffNumber: string; department: string; designation?: string };
}
