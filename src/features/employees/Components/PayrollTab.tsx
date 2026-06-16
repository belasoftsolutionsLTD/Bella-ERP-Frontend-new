'use client';
import { usePayroll } from '../../payroll/Hooks/usePayroll';
import { PayrollTable } from '../../payroll/Components/PayrollTable';
import { Wrapper } from '@/components/custom-ui/Wrapper';

export function PayrollTab({ employeeId }: { employeeId: string }) {
  const { records, loading, error, refetch } = usePayroll(employeeId);
  return (
    <Wrapper loading={loading} error={error} onRetry={refetch}>
      <PayrollTable records={records} employeeId={employeeId} />
    </Wrapper>
  );
}
