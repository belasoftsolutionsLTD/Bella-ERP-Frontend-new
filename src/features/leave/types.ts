// TypeScript interfaces mirroring the backend leave management data model
// (leave_types, leave_accrual_policies, leave_balances, leave_requests,
// public_holidays, leave_blackouts, leave_audit_log collections).

export type AppliesTo = { roles?: string[]; departments?: string[]; employmentTypes?: string[] };

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  description: string;
  isPaid: boolean;
  isCarryOverAllowed: boolean;
  maxCarryOverDays?: number;
  carryOverExpiryMonths?: number;
  requiresApproval: boolean;
  requiresAttachment: boolean;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  eligibilityMonths?: number;
  countPublicHolidays: boolean;
  color: string;
  isActive: boolean;
  appliesTo: AppliesTo;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccrualFrequency = 'monthly' | 'annual' | 'perHourWorked';

export interface LeaveAccrualPolicy {
  _id: string;
  name: string;
  leaveTypeId: string;
  accrualFrequency: AccrualFrequency;
  accrualAmount: number;
  maxAnnualEntitlement: number;
  appliesTo: AppliesTo;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  leaveType?: { name: string; code: string };
}

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  openingBalance: number;
  accrued: number;
  used: number;
  pending: number;
  carriedOver: number;
  carryOverExpiry?: string;
  closingBalance: number;
  lastAccrualDate?: string;
  updatedAt: string;
  leaveType?: { name: string; code: string; color: string; isPaid: boolean };
  employee?: { fullName: string; staffNumber: string; department: string };
}

export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'disputed';

export interface ApprovalStep {
  level: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  actedAt?: string;
  comment?: string;
}

export interface HalfDay {
  date: string;
  period: 'morning' | 'afternoon';
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay?: HalfDay;
  reason?: string;
  attachmentUrl?: string;
  status: LeaveRequestStatus;
  approvalChain: ApprovalStep[];
  currentApprovalLevel: number;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  // Bonus features ported from the old system (kept per user decision):
  revokedAt?: string;
  revokedBy?: string;
  disputeReason?: string;
  disputeResolvedAt?: string;
  disputeResolvedBy?: string;
  payrollRunId?: string;
  createdAt: string;
  updatedAt: string;
  employee?: { _id: string; fullName: string; staffNumber: string; department: string; designation?: string };
  leaveType?: { name: string; code: string; color: string; isPaid: boolean };
}

export interface PublicHoliday {
  _id: string;
  name: string;
  date: string;
  isRecurringAnnually: boolean;
  appliesTo?: string[];
  createdBy?: string;
  createdAt: string;
}

// Bonus feature ported from the old system.
export interface LeaveBlackoutPeriod {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  departments?: string[];
  createdBy?: string;
  createdAt: string;
}

export type LeaveAuditAction =
  | 'created' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  | 'revoked' | 'disputed' | 'disputeResolved' | 'balanceAdjusted';

export interface LeaveAuditLogEntry {
  _id: string;
  leaveRequestId?: string;
  employeeId: string;
  action: LeaveAuditAction;
  performedBy: string;
  performedByName: string;
  previousValue?: unknown;
  newValue?: unknown;
  comment?: string;
  timestamp: string;
}
