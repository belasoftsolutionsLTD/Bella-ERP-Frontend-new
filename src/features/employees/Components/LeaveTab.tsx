'use client';
import { useTranslations } from 'next-intl';
import { useLeave } from '../../leave/Hooks/useLeave';
import { LeaveBalanceCard } from '../../leave/Components/LeaveBalanceCard';
import { LeaveRequestTable } from '../../leave/Components/LeaveRequestTable';
import { Wrapper } from '@/components/custom-ui/Wrapper';

export function LeaveTab({ employeeId }: { employeeId: string }) {
  const { balance, requests, loading, error, refetch } = useLeave(employeeId);
  return (
    <Wrapper loading={loading} error={error} onRetry={refetch}>
      <div className="space-y-4">
        {balance && <LeaveBalanceCard balance={balance} />}
        <LeaveRequestTable requests={requests} />
      </div>
    </Wrapper>
  );
}
