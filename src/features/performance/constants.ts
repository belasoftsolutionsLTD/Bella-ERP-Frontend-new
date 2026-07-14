import type { Status } from '@/components/ui/StatusBadge';

export const GOAL_STATUS_CONFIG = {
  not_started: { label: 'Not Started', borderCls: 'border-slate-500', textCls: 'text-slate-400',  bgCls: 'bg-slate-500/10', dotCls: 'bg-slate-400'  },
  in_progress:  { label: 'In Progress', borderCls: 'border-blue-500',  textCls: 'text-blue-400',   bgCls: 'bg-blue-500/10',  dotCls: 'bg-blue-400'   },
  at_risk:      { label: 'At Risk',     borderCls: 'border-amber-500', textCls: 'text-amber-400',  bgCls: 'bg-amber-500/10', dotCls: 'bg-amber-400'  },
  completed:    { label: 'Completed',   borderCls: 'border-indigo-500',textCls: 'text-indigo-400', bgCls: 'bg-indigo-500/10',dotCls: 'bg-indigo-400' },
  behind:       { label: 'Behind',      borderCls: 'border-red-500',   textCls: 'text-red-400',    bgCls: 'bg-red-500/10',   dotCls: 'bg-red-400'    },
} as const;

export type GoalStatus = keyof typeof GOAL_STATUS_CONFIG;

export function goalStatusCfg(status: string) {
  return GOAL_STATUS_CONFIG[status as GoalStatus] ?? GOAL_STATUS_CONFIG.not_started;
}

export const GOAL_CATEGORIES = {
  okr:         { label: 'OKR',          icon: '🎯' },
  kpi:         { label: 'KPI',          icon: '📊' },
  personal:    { label: 'Personal Dev', icon: '🌱' },
  team:        { label: 'Team Goal',    icon: '👥' },
} as const;

export const GOAL_PERIODS = [
  { value: 'q1_2026', label: 'Q1 2026' },
  { value: 'q2_2026', label: 'Q2 2026' },
  { value: 'q3_2026', label: 'Q3 2026' },
  { value: 'q4_2026', label: 'Q4 2026' },
  { value: 'annual_2026', label: 'Annual 2026' },
  { value: 'custom', label: 'Custom' },
];

export const CYCLE_STATUS_MAP: Record<string, { status: Status; label: string }> = {
  draft:       { status: 'draft',      label: 'Draft' },
  active:      { status: 'active',     label: 'Active' },
  calibration: { status: 'inProgress', label: 'Calibration' },
  completed:   { status: 'completed',  label: 'Completed' },
};

export const FEEDBACK_TYPE_CONFIG = {
  positive:     { label: 'Positive',     cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  constructive: { label: 'Constructive', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'    },
  recognition:  { label: 'Recognition',  cls: 'bg-violet-500/20 text-violet-300 border border-violet-500/30'  },
} as const;

export const NINE_BOX_LABELS: Record<string, { label: string; bgCls: string; textCls: string }> = {
  low_low:   { label: 'Underperformer',     bgCls: 'bg-red-100',     textCls: 'text-red-800'    },
  low_med:   { label: 'Inconsistent',       bgCls: 'bg-amber-100',   textCls: 'text-amber-800'  },
  low_high:  { label: 'Enigma',             bgCls: 'bg-amber-50',    textCls: 'text-amber-700'  },
  med_low:   { label: 'Effective Core',     bgCls: 'bg-green-50',    textCls: 'text-green-700'  },
  med_med:   { label: 'Core Player',        bgCls: 'bg-green-100',   textCls: 'text-green-800'  },
  med_high:  { label: 'High Potential',     bgCls: 'bg-blue-100',    textCls: 'text-blue-800'   },
  high_low:  { label: 'Expert',             bgCls: 'bg-emerald-100', textCls: 'text-emerald-800'},
  high_med:  { label: 'High Performer',     bgCls: 'bg-emerald-100', textCls: 'text-emerald-800'},
  high_high: { label: 'Star',               bgCls: 'bg-violet-100',  textCls: 'text-violet-800' },
};

export const NINE_BOX_GRID = [
  ['low_high',  'med_high',  'high_high'],
  ['low_med',   'med_med',   'high_med' ],
  ['low_low',   'med_low',   'high_low' ],
];

export interface KeyResult {
  _id?: string;
  description: string;
  type: 'number' | 'percentage' | 'currency' | 'milestone';
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  isCompleted: boolean;
}

export interface CheckIn {
  progress: number;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Goal {
  _id: string;
  employeeId?: string;
  createdBy?: string;
  title: string;
  description?: string;
  category: string;
  period: string;
  startDate?: string;
  endDate?: string;
  status: string;
  progress: number;
  visibility?: string;
  parentGoalId?: string;
  keyResults: KeyResult[];
  checkIns: CheckIn[];
  comments: { _id: string; text: string; authorId: string; authorName: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCycle {
  _id: string;
  name: string;
  type: string;
  templateId?: string | null;
  audience?: { type: 'all' | 'departments' | 'employees'; departments: string[]; employeeIds: string[] };
  status: string;
  phases: {
    selfReview:     { startDate?: string; endDate?: string; isEnabled: boolean };
    managerReview:  { startDate?: string; endDate?: string; isEnabled: boolean };
    calibration:    { date?: string; isEnabled: boolean };
    resultsSharing: { date?: string; isEnabled: boolean };
  };
  participants: {
    employeeId: string;
    selfReviewStatus: string;
    managerReviewStatus: string;
  }[];
  createdBy?: string;
  createdAt: string;
  total?: number;
  completed?: number;
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text';
  scaleMax?: number | null;
}

export interface TemplateSection {
  id: string;
  title: string;
  questions: TemplateQuestion[];
}

export interface ReviewTemplate {
  _id: string;
  name: string;
  description?: string;
  cycleTypes: string[];
  sections: TemplateSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  sectionId: string;
  questionId: string;
  value: string | number;
}

export interface AttendanceSummary {
  periodDays: number;
  totalRecords: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number | null;
}

export interface Review {
  _id: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  reviewType: 'self' | 'manager' | 'peer';
  status: 'draft' | 'submitted';
  responses: ReviewResponse[];
  overallRating: number | null;
  recommendation?: string | null;
  submittedAt?: string | null;
  employee?: { fullName: string; designation?: string; department?: string };
  reviewer?: { name: string };
  cycle?: { name: string; type: string };
  template?: ReviewTemplate | null;
  attendanceSummary?: AttendanceSummary | null;
}

export interface OneOnOneAgendaItem {
  id: string;
  text: string;
  addedBy: string;
  isDone: boolean;
  createdAt: string;
}

export interface OneOnOne {
  _id: string;
  managerId: string;
  employeeId: string;
  manager?: { fullName: string; designation?: string } | null;
  employee?: { fullName: string; designation?: string } | null;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  agendaItems: OneOnOneAgendaItem[];
  sharedNotes: string;
  privateManagerNotes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PIPGoal {
  id: string;
  description: string;
  targetDate?: string | null;
  status: 'pending' | 'met' | 'not_met';
}

export interface PIPCheckIn {
  id: string;
  note: string;
  addedBy: string;
  createdAt: string;
}

export interface PIP {
  _id: string;
  employeeId: string;
  managerId?: string | null;
  employee?: { fullName: string; designation?: string; department?: string } | null;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  outcome: 'passed' | 'failed' | null;
  goals: PIPGoal[];
  checkIns: PIPCheckIn[];
  createdAt: string;
  closedAt?: string;
}

export interface MyReviewTask {
  cycleId: string;
  cycleName: string;
  templateId: string | null;
  employeeId: string;
  employee: { fullName: string; designation?: string; department?: string } | null;
  reviewType: 'self' | 'manager' | 'peer';
  status: string;
  reviewId: string | null;
}

export interface FeedbackItem {
  _id: string;
  giverId: string;
  recipientId: string;
  giverName?: string;
  recipientName?: string;
  type: string;
  category: string;
  message: string;
  visibility: string;
  isAnonymous?: boolean;
  createdAt: string;
}
