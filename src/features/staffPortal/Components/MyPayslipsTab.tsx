'use client';
import { PayrollTable } from '../../payroll/Components/PayrollTable';
import type { PayrollSummary } from '../../payroll/Hooks/usePayroll';

export function MyPayslipsTab({ records, employeeId }: { records: PayrollSummary[]; employeeId: string }) {
  return <PayrollTable records={records} employeeId={employeeId} />;
}
