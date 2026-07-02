export const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual:        '#6366f1',
  sick:          '#3b82f6',
  maternity:     '#8b5cf6',
  paternity:     '#06b6d4',
  unpaid:        '#64748b',
  compassionate: '#f59e0b',
  study:         '#10b981',
  emergency:     '#ef4444',
};

const PALETTE = ['#6366f1','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];
export function leaveColor(type: string, index = 0): string {
  return LEAVE_TYPE_COLORS[type] ?? PALETTE[index % PALETTE.length];
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual:        'Annual Leave',
  sick:          'Sick Leave',
  maternity:     'Maternity Leave',
  paternity:     'Paternity Leave',
  unpaid:        'Unpaid Leave',
  compassionate: 'Compassionate Leave',
  study:         'Study Leave',
  emergency:     'Emergency Leave',
};

export const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-800',  darkBg: 'bg-amber-500/10',  darkText: 'text-amber-400'  },
  approved:  { label: 'Approved',  bg: 'bg-green-100',  text: 'text-green-800',  darkBg: 'bg-emerald-500/10',darkText: 'text-emerald-400'},
  declined:  { label: 'Declined',  bg: 'bg-red-100',    text: 'text-red-800',    darkBg: 'bg-red-500/10',    darkText: 'text-red-400'    },
  rejected:  { label: 'Declined',  bg: 'bg-red-100',    text: 'text-red-800',    darkBg: 'bg-red-500/10',    darkText: 'text-red-400'    },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100',  text: 'text-slate-600',  darkBg: 'bg-slate-700',     darkText: 'text-slate-400'  },
  disputed:  { label: 'Disputed',  bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'bg-orange-500/10', darkText: 'text-orange-400' },
} as const;

export type LeaveStatus = keyof typeof STATUS_CFG;

export interface LeaveBalance {
  leaveType: string;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  color: string;
  nextAccrualDate?: string;
  nextAccrualDays?: number;
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  employee?: { _id: string; fullName: string; staffNumber?: string; department?: string };
  leaveType: string;
  leaveTypeName?: string;
  leaveTypeColor?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  totalDays?: number;
  isHalfDay?: boolean;
  halfDayPeriod?: string;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  declineReason?: string;
  comments?: string;
  disputeReason?: string;
  disputeResolvedAt?: string;
  timeline?: { action: string; performedBy?: string; performedByName?: string; timestamp: string; note?: string }[];
  coverageEmployeeId?: string;
  createdAt: string;
}

export interface LeavePolicy {
  _id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  countries?: string[];
  leaveTypes: PolicyLeaveType[];
  approvalChain?: {
    approverType: 'manager' | 'specific' | 'hr_team';
    specificApproverId?: string;
    escalateAfterDays?: number;
  };
  assignedTo?: {
    type: 'all' | 'departments' | 'employees';
    departments?: string[];
    employeeIds?: string[];
  };
  createdAt?: string;
}

export interface PolicyLeaveType {
  _id?: string;
  name: string;
  color: string;
  totalDays: number;
  accrualType: 'upfront' | 'monthly' | 'per_pay_period';
  accrualRate?: number;
  carryoverType: 'none' | 'limited' | 'unlimited';
  carryoverMax?: number;
  requiresApproval: boolean;
  requiresAttachment?: boolean;
  requiresAttachmentAfterDays?: number;
  minNoticeDays?: number;
  canGoNegative?: boolean;
}
