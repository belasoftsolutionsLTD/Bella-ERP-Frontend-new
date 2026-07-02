'use client';
import { LeaveBalanceCard } from '../../leave/Components/LeaveBalanceCard';
import { LeaveRequestTable } from '../../leave/Components/LeaveRequestTable';
import { LeaveRequestForm } from '../../leave/Components/LeaveRequestForm';
import type { LeaveBalance, LeaveRequest } from '../../leave/Hooks/useLeave';

interface Props { balance: LeaveBalance | null; requests: LeaveRequest[]; employeeId: string; onRefresh: () => void }

export function MyLeaveTab({ balance, requests, employeeId, onRefresh }: Props) {
  return (
    <div className="space-y-5">
      {balance && <LeaveBalanceCard balance={balance} />}
      <LeaveRequestForm employeeId={employeeId} balance={balance} onSuccess={onRefresh} />
      <LeaveRequestTable requests={requests} />
    </div>
  );
}
