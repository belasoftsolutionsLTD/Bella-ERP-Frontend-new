'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Briefcase, CalendarDays, DollarSign, CreditCard, Heart } from 'lucide-react';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { employeeSchema, DEPARTMENTS, DESIGNATIONS } from '../Components/EmployeeSchema';
import { useHrConfig } from '@/features/config/Hooks/useHrConfig';

const schema = employeeSchema.pick({
  fullName: true,
  nationalId: true,
  designation: true,
  employmentType: true,
  department: true,
  dateOfHire: true,
  contractEndDate: true,
  salaryGrade: true,
  grossPay: true,
  paymentMethod: true,
  bankName: true,
  bankAccountNumber: true,
  mpesaNumber: true,
  paypalEmail: true,
  cryptoWalletAddress: true,
  cryptoNetwork: true,
  email: true,
  phone: true,
  nokName: true,
  nokRelationship: true,
  nokPhone: true,
  nokNationalId: true,
  nokEmail: true,
  staffCategory: true,
});

type FormValues = z.infer<typeof schema>;

const employmentTypeOptions = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Intern', value: 'intern' },
];

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2.5 pb-3 border-b border-slate-700 ${color}`}>
      <div className="h-8 w-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-semibold text-sm tracking-wide uppercase">{title}</span>
    </div>
  );
}

const PAYMENT_METHOD_OPTS = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'M-Pesa', value: 'mpesa' },
  { label: 'Cash', value: 'cash' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Crypto', value: 'crypto' },
];

export default function EmployeeCreatePage() {
  const router = useRouter();
  const locale = useLocale();
  const { departments, designations } = useHrConfig();
  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' },
  });
  const paymentMethod = watch('paymentMethod');
  const departmentOptions = (departments.items.length > 0 ? departments.items : DEPARTMENTS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));
  const designationOptions = (designations.items.length > 0 ? designations.items : DESIGNATIONS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));

  const submit = (data: FormValues) => {
    const { nokName, nokRelationship, nokPhone, nokNationalId, nokEmail, ...rest } = data;
    const payload = {
      ...rest,
      nextOfKin: (nokName || nokPhone || nokNationalId || nokEmail)
        ? { name: nokName, relationship: nokRelationship, phone: nokPhone, nationalId: nokNationalId, email: nokEmail }
        : null,
    };
    return apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      method: 'POST',
      data: payload,
      thenFn: (res) => {
        const employeeId = res.data?._id;
        router.push(employeeId ? `/${locale}/employees/${employeeId}` : `/${locale}/employees`);
      },
    });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Toaster richColors position="top-right" />

      <Button variant="ghost" asChild className="gap-2 text-slate-400 hover:text-slate-200 w-fit px-0 hover:bg-transparent">
        <Link href={`/${locale}/employees`}>
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>
      </Button>

      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add New Employee</h1>
            <p className="text-white/70 text-sm mt-0.5">Fill in the details below to create an employee record</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {/* Personal Information */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={User} title="Personal Information" color="text-blue-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="fullName" control={control} label="Full Name" placeholder="e.g. Jane Wanjiku" />
            <CustomInput component="text" name="nationalId" control={control} label="National ID" placeholder="e.g. 12345678" />
            <CustomInput component="email" name="email" control={control} label="Email Address" placeholder="jane@school.ac.ke" />
            <CustomInput component="text" name="phone" control={control} label="Phone Number" placeholder="+254 7XX XXX XXX" />
          </div>
        </div>

        {/* Role & Department */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={Briefcase} title="Role & Department" color="text-violet-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput
              component="select"
              name="designation"
              control={control}
              label="Designation"
              placeholder="Select designation"
              options={designationOptions}
            />
            <CustomInput
              component="select"
              name="department"
              control={control}
              label="Department"
              placeholder="Select department"
              options={departmentOptions}
            />
            <CustomInput
              component="select"
              name="employmentType"
              control={control}
              label="Employment Type"
              placeholder="Select type"
              options={employmentTypeOptions}
            />
            <CustomInput
              component="select"
              name="staffCategory"
              control={control}
              label="Staff Category (Optional)"
              placeholder="Not specified"
              options={[
                { label: 'Teaching', value: 'teaching' },
                { label: 'Non-Teaching', value: 'non-teaching' },
              ]}
            />
          </div>
        </div>

        {/* Contract Details */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={CalendarDays} title="Contract Details" color="text-emerald-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="date" name="dateOfHire" control={control} label="Date of Hire" />
            <CustomInput component="date" name="contractEndDate" control={control} label="Contract End Date" />
          </div>
          <p className="text-xs text-slate-500">Leave Contract End Date blank for permanent employees.</p>
        </div>

        {/* Gross Pay */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={DollarSign} title="Gross Pay" color="text-amber-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="grossPay" control={control} label="Gross Monthly Pay (KES)" placeholder="e.g. 85000" />
            <CustomInput component="text" name="salaryGrade" control={control} label="Salary Grade" placeholder="e.g. Grade 5" />
          </div>
          <p className="text-xs text-slate-500">Gross pay is used to auto-calculate PAYE, NSSF and SHA during payroll generation.</p>
        </div>

        {/* Payment Method */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={CreditCard} title="Payment Method" color="text-indigo-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput
              component="select"
              name="paymentMethod"
              control={control}
              label="Payment Method"
              options={PAYMENT_METHOD_OPTS}
            />
            {paymentMethod === 'bank_transfer' && (
              <>
                <CustomInput component="text" name="bankName" control={control} label="Bank Name" placeholder="e.g. Equity Bank" />
                <CustomInput component="text" name="bankAccountNumber" control={control} label="Account Number" placeholder="e.g. 0123456789" />
              </>
            )}
            {paymentMethod === 'mpesa' && (
              <CustomInput component="text" name="mpesaNumber" control={control} label="M-Pesa Number" placeholder="+254 7XX XXX XXX" />
            )}
            {paymentMethod === 'paypal' && (
              <CustomInput component="email" name="paypalEmail" control={control} label="PayPal Email" placeholder="e.g. jane@paypal.com" />
            )}
            {paymentMethod === 'crypto' && (
              <>
                <CustomInput component="text" name="cryptoWalletAddress" control={control} label="Wallet Address" placeholder="e.g. 0x1a2b3c…" />
                <CustomInput component="text" name="cryptoNetwork" control={control} label="Network / Coin" placeholder="e.g. USDT (TRC20)" />
              </>
            )}
          </div>
        </div>

        {/* Next of Kin */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 space-y-5">
          <SectionHeader icon={Heart} title="Next of Kin" color="text-rose-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="nokName" control={control} label="Full Name" placeholder="e.g. John Kamau" />
            <CustomInput component="text" name="nokRelationship" control={control} label="Relationship" placeholder="e.g. Spouse, Parent, Sibling" />
            <CustomInput component="text" name="nokPhone" control={control} label="Phone Number" placeholder="+254 7XX XXX XXX" />
            <CustomInput component="text" name="nokNationalId" control={control} label="National ID Number" placeholder="e.g. 12345678" />
            <CustomInput component="email" name="nokEmail" control={control} label="Email Address" placeholder="nextofkin@example.com" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" asChild className="px-6 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
            <Link href={`/${locale}/employees`}>Cancel</Link>
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
