// TypeScript interfaces mirroring the backend onboarding data model
// (onboardingTemplates, onboardingRecords, onboardingDocuments collections).

export type AssigneeType = 'hr' | 'it' | 'manager' | 'newHire' | 'finance';
export type OnboardingRecordStatus = 'preboarding' | 'active' | 'completed' | 'stalled';
export type OnboardingTaskStatus = 'pending' | 'inProgress' | 'completed' | 'overdue';

export interface FirstDayDetails {
  location: string;
  reportingTime: string;
  whatToBring: string;
  additionalNotes: string;
}

export interface MeetTheTeamTemplateEntry {
  employeeId: string;
  note: string;
}

export interface MeetTheTeamEntry extends MeetTheTeamTemplateEntry {
  met: boolean;
  employee?: { fullName: string; designation?: string; department?: string };
}

export interface OnboardingTaskTemplate {
  id: string;
  title: string;
  description: string;
  dueOffsetDays: number;
  isRequired: boolean;
  requiresDocument: boolean;
  documentTemplateId?: string;
  resourceUrl?: string;
}

export interface OnboardingTaskListTemplate {
  id: string;
  name: string;
  assignedTo: AssigneeType;
  tasks: OnboardingTaskTemplate[];
}

export interface OnboardingTemplate {
  _id: string;
  name: string;
  description: string;
  targetRoles: string[];
  targetDepartments: string[];
  welcomeMessage: string;
  firstDayDetails: FirstDayDetails;
  taskLists: OnboardingTaskListTemplate[];
  meetTheTeam: MeetTheTeamTemplateEntry[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isRequired: boolean;
  status: OnboardingTaskStatus;
  completedBy?: string;
  completedAt?: string;
  requiresDocument: boolean;
  documentId?: string;
  notes?: string;
  resourceUrl?: string;
}

export interface OnboardingTaskList {
  id: string;
  name: string;
  assignedTo: AssigneeType;
  tasks: OnboardingTask[];
}

export interface OnboardingRecord {
  _id: string;
  employeeId: string;
  templateId: string;
  status: OnboardingRecordStatus;
  startDate: string;
  completedAt?: string;
  welcomeMessage: string;
  firstDayDetails: FirstDayDetails;
  meetTheTeam: MeetTheTeamEntry[];
  taskLists: OnboardingTaskList[];
  progressPercentage: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  employee?: { _id: string; fullName: string; staffNumber: string; department: string; designation?: string };
  compensationSetup?: { grossPay: number; paymentMethod: string; setAt: string; setBy?: string } | null;
  employeeCompensation?: {
    jobGroupId?: string; grossPay?: number; paymentMethod?: string;
    bankName?: string; bankAccountNumber?: string; mpesaNumber?: string;
  } | null;
  groupAllowancesPreview?: { conceptId: string; conceptName: string; category: string; subCategory: string; amount: number }[];
}

export type OnboardingDocumentType = 'upload' | 'esign' | 'form';
export type OnboardingDocumentStatus = 'pending' | 'uploaded' | 'signed' | 'verified';

export interface OnboardingDocument {
  _id: string;
  employeeId: string;
  recordId: string;
  recordType: 'onboarding' | 'offboarding';
  taskId: string;
  name: string;
  type: OnboardingDocumentType;
  fileUrl?: string;
  signedAt?: string;
  signedBy?: string;
  status: OnboardingDocumentStatus;
  uploadedAt?: string;
  createdAt: string;
}
