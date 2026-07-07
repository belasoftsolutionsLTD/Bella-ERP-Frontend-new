'use client';
import { useEmployeePayslips } from '../../payroll/Hooks/useEmployeePayslips';
import { MyPayslipsPanel } from '../../payroll/Components/MyPayslipsPanel';
import { Wrapper } from '@/components/custom-ui/Wrapper';

export function PayrollTab({ employeeId }: { employeeId: string }) {
  const { payslips, isLoading, error, mutate } = useEmployeePayslips(employeeId);
  return (
    <Wrapper loading={isLoading} error={error ? 'Failed to load payslips.' : null} onRetry={() => mutate()}>
      {payslips.length > 0 ? (
        <MyPayslipsPanel payslips={payslips} />
      ) : (
        <p className="text-sm text-slate-400 text-center py-10">No payslips yet for this employee.</p>
      )}
    </Wrapper>
  );
}
