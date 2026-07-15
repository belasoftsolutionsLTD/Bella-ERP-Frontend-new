import { redirect } from 'next/navigation';

// Payroll Settings (Allowances, Deductions, Tax Config, Overtime Rates) moved into
// People Settings alongside Departments/Job Groups/Designations — job groups are what
// ties org structure to payroll math, so it made more sense as one HR config hub.
export default function Page({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/employees/settings`);
}
