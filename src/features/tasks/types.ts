export type TaskStatus   = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'blocked';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType     = 'action' | 'document' | 'form' | 'meeting' | 'equipment' | 'approval';
export type TaskModule   = 'onboarding' | 'offboarding' | 'hr' | 'it' | 'performance' | 'general' | 'new_hire' | 'probation_end' | 'role_change';

export interface Subtask {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface TaskComment {
  _id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ActivityEntry {
  action: string;
  from?: string;
  to?: string;
  performedByName?: string;
  timestamp: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  module: TaskModule;

  assignedTo?: string;
  assignedToName: string;
  assignedToRole?: string;
  assignedBy?: string;
  department?: string;

  linkedEmployeeId?: string;
  linkedEmployeeName?: string;
  linkedEmployee?: { fullName: string; designation?: string; department?: string };

  dueDate?: string;
  startDate?: string;
  completedAt?: string;

  templateId?: string;

  // Type-specific
  documentAction?: string;
  documentStatus?: string;
  meetingDuration?: number;
  meetingLocation?: string;
  meetingLink?: string;
  meetingAttendees?: string[];
  deviceAction?: string;
  deviceStatus?: string;
  approvalType?: string;
  approverId?: string;
  approvalDecision?: string;

  subtasks: Subtask[];
  blockedByTaskIds: string[];
  attachments: { filename: string; fileUrl?: string; fileSize?: number }[];
  comments: TaskComment[];
  activity: ActivityEntry[];
  tags: string[];

  isTeam?: boolean;
  teamId?: string;

  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTask {
  _id?: string;
  title: string;
  description?: string;
  type: TaskType;
  assignTo: string;
  priority: TaskPriority;
  sectionId?: string;
  order: number;
  dueOffset: { direction: 'before' | 'after' | 'on'; days: number };
  documentAction?: string;
  meetingDuration?: number;
  deviceAction?: string;
  isRequired?: boolean;
}

export interface TemplateSection {
  _id: string;
  name: string;
  order: number;
}

export interface TaskTemplate {
  _id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  applyTo: { type: string; departments: string[]; roles: string[]; employmentTypes: string[] };
  isActive: boolean;
  isDefault: boolean;
  sections: TemplateSection[];
  tasks: TemplateTask[];
  usageCount: number;
  createdBy?: string;
  createdAt: string;
}

export interface Employee {
  _id: string;
  fullName: string;
  staffNumber?: string;
  department?: string;
  designation?: string;
  taskCounts?: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
    overdue: number;
    blocked: number;
  };
}

export interface TaskStats {
  total: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
}
