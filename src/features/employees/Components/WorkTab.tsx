'use client';
import { Briefcase, DollarSign, CalendarDays, CreditCard } from 'lucide-react';
import type { Employee } from '../Hooks/useEmployees';

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
  </div>
);

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-indigo-600" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
  );
}

export function WorkTab({ employee }: { employee: Employee }) {
  const hireDate      = employee.dateOfHire     ? new Date(employee.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : null;
  const contractEnd   = employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : null;

  const payMethod = (employee as any).paymentMethod;
  const bankName  = (employee as any).bankName;
  const bankAcct  = (employee as any).bankAccountNumber;
  const mpesa     = (employee as any).mpesaNumber;
  const paypal    = (employee as any).paypalEmail;
  const crypto    = (employee as any).cryptoWalletAddress;

  return (
    <div className="space-y-5">
      {/* Position */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={Briefcase} title="Position" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Designation"       value={employee.designation} />
          <Field label="Department"        value={employee.department} />
          <Field label="Employment Type"   value={employee.employmentType} />
          <Field label="Staff Category"    value={employee.staffCategory} />
          <Field label="Staff Number"      value={employee.staffNumber} />
        </div>
      </div>

      {/* Contract Dates */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={CalendarDays} title="Contract" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Date of Hire"      value={hireDate} />
          <Field label="Contract End Date" value={contractEnd ?? 'Permanent'} />
        </div>
      </div>

      {/* Compensation */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={DollarSign} title="Compensation" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field
            label="Gross Monthly Pay"
            value={employee.grossPay ? `KES ${Number(employee.grossPay).toLocaleString()}` : null}
          />
          <Field label="Salary Grade" value={employee.salaryGrade} />
        </div>
      </div>

      {/* Payment Method */}
      {payMethod && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <SectionHeader icon={CreditCard} title="Payment Method" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Method" value={payMethod?.replace(/_/g, ' ')} />
            {payMethod === 'bank_transfer' && (<>
              <Field label="Bank Name"       value={bankName} />
              <Field label="Account Number"  value={bankAcct} />
            </>)}
            {payMethod === 'mpesa'  && <Field label="M-Pesa Number" value={mpesa} />}
            {payMethod === 'paypal' && <Field label="PayPal Email"  value={paypal} />}
            {payMethod === 'crypto' && <Field label="Wallet Address" value={crypto} />}
          </div>
        </div>
      )}
    </div>
  );
}
