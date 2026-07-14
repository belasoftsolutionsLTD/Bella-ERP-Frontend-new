import { cn } from '@/lib/utils';

export type Status =
  | 'active' | 'approved' | 'completed' | 'present' | 'verified' | 'open'
  | 'pending' | 'submitted' | 'inProgress' | 'onLeave' | 'preboarding'
  | 'rejected' | 'overdue' | 'absent' | 'terminated' | 'failed' | 'closed'
  | 'inactive' | 'cancelled' | 'draft' | 'archived'
  | 'info' | 'new'
  // Additional real states found across the codebase that don't map cleanly onto any of
  // the above (everything else reuses one of the 23 core keys above with a `label` override).
  | 'suspended' | 'atRisk' | 'blocked';

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  // Green
  active:      { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Active' },
  approved:    { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Approved' },
  completed:   { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Completed' },
  present:     { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Present' },
  verified:    { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Verified' },
  open:        { bg: 'bg-status-success-bg', text: 'text-status-success-text', label: 'Open' },
  // Amber
  pending:     { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Pending' },
  submitted:   { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Submitted' },
  inProgress:  { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'In Progress' },
  onLeave:     { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'On Leave' },
  preboarding: { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'Preboarding' },
  // Red
  rejected:    { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Rejected' },
  overdue:     { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Overdue' },
  absent:      { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Absent' },
  terminated:  { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Terminated' },
  failed:      { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Failed' },
  closed:      { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Closed' },
  // Gray
  inactive:    { bg: 'bg-status-neutral-bg', text: 'text-status-neutral-text', label: 'Inactive' },
  cancelled:   { bg: 'bg-status-neutral-bg', text: 'text-status-neutral-text', label: 'Cancelled' },
  draft:       { bg: 'bg-status-neutral-bg', text: 'text-status-neutral-text', label: 'Draft' },
  archived:    { bg: 'bg-status-neutral-bg', text: 'text-status-neutral-text', label: 'Archived' },
  // Blue
  info:        { bg: 'bg-status-info-bg',    text: 'text-status-info-text',    label: 'Info' },
  new:         { bg: 'bg-status-info-bg',    text: 'text-status-info-text',    label: 'New' },
  // Additional
  suspended:   { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Suspended' },
  atRisk:      { bg: 'bg-status-warning-bg', text: 'text-status-warning-text', label: 'At Risk' },
  blocked:     { bg: 'bg-status-danger-bg',  text: 'text-status-danger-text',  label: 'Blocked' },
};

interface StatusBadgeProps {
  status: Status;
  /** Override the default label for this status (e.g. a localized string). */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.inactive;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.bg, config.text, className)}>
      {label ?? config.label}
    </span>
  );
}

/** Same color tokens as StatusBadge, for the rare composite pill that mixes status color
 * with other content (e.g. "L1 Jane · Approved") and can't just render `<StatusBadge>` alone. */
export function statusClasses(status: Status) {
  const config = statusConfig[status] ?? statusConfig.inactive;
  return `${config.bg} ${config.text}`;
}

export function statusLabel(status: Status) {
  return (statusConfig[status] ?? statusConfig.inactive).label;
}
