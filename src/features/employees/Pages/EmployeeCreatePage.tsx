'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Briefcase, CalendarDays, DollarSign, CreditCard, Heart, MapPin } from 'lucide-react';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { employeeSchema, DEPARTMENTS, DESIGNATIONS, KENYA_BANKS, MPESA_NUMBER_REGEX, MPESA_NUMBER_ERROR } from '../Components/EmployeeSchema';
import { useConfigSection } from '@/hooks/useConfigSection';

const schema = employeeSchema.pick({
  firstName: true,
  lastName: true,
  nationalId: true,
  designation: true,
  employmentType: true,
  department: true,
  dateOfHire: true,
  contractEndDate: true,
  probationEndDate: true,
  confirmationDate: true,
  jobGroupId: true,
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
  preferredName: true, gender: true, maritalStatus: true, nationality: true,
  passportNumber: true, passportExpiryDate: true,
  addressStreet: true, addressCity: true, addressState: true, addressCountry: true, addressPostalCode: true,
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'mpesa' && !data.mpesaNumber?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'M-Pesa number is required', path: ['mpesaNumber'] });
  }
  if (data.paymentMethod === 'mpesa' && data.mpesaNumber?.trim() && !MPESA_NUMBER_REGEX.test(data.mpesaNumber.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MPESA_NUMBER_ERROR, path: ['mpesaNumber'] });
  }
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
    <div className={`flex items-center gap-2.5 pb-3 border-b border-brand-border ${color}`}>
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
  const departments = useConfigSection('departments');
  const designations = useConfigSection('designations');
  const jobGroups = useConfigSection('job-groups');
  const { control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' },
  });
  const paymentMethod = watch('paymentMethod');
  const bankName = watch('bankName');
  const grossPay = watch('grossPay');
  const [bankIsOther, setBankIsOther] = useState(false);
  const departmentOptions = (departments.items.length > 0 ? departments.items : DEPARTMENTS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));
  const designationOptions = (designations.items.length > 0 ? designations.items : DESIGNATIONS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));
  const jobGroupOptions = jobGroups.items.map((g: any) => ({ label: g.name, value: g._id }));

  // Gross pay drives job group selection automatically — the tier is looked up from
  // the entered figure rather than left for HR to guess/pick manually.
  useEffect(() => {
    const pay = Number(grossPay);
    if (!pay || jobGroups.items.length === 0) return;
    const match = jobGroups.items.find((g: any) => pay >= (g.salaryMin ?? 0) && pay <= (g.salaryMax ?? Infinity));
    if (match) setValue('jobGroupId', match._id, { shouldValidate: true });
  }, [grossPay, jobGroups.items, setValue]);

  const submit = (data: FormValues) => {
    const { nokName, nokRelationship, nokPhone, nokNationalId, nokEmail, addressStreet, addressCity, addressState, addressCountry, addressPostalCode, ...rest } = data;
    const payload = {
      ...rest,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      nextOfKin: (nokName || nokPhone || nokNationalId || nokEmail)
        ? { name: nokName, relationship: nokRelationship, phone: nokPhone, nationalId: nokNationalId, email: nokEmail }
        : null,
      address: (addressStreet || addressCity || addressState || addressCountry || addressPostalCode)
        ? { street: addressStreet, city: addressCity, state: addressState, country: addressCountry, postalCode: addressPostalCode }
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

      <Button variant="ghost" asChild className="gap-2 text-brand-text-secondary hover:text-brand-text w-fit px-0 hover:bg-transparent">
        <Link href={`/${locale}/employees`}>
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>
      </Button>

      {/* Header card */}
      <div className="rounded-2xl bg-brand-primary p-6 text-white">
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
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
          <SectionHeader icon={User} title="Personal Information" color="text-blue-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="firstName" control={control} label="First Name" placeholder="e.g. Jane" required />
            <CustomInput component="text" name="lastName" control={control} label="Last Name" placeholder="e.g. Wanjiku" required />
            <CustomInput component="text" name="nationalId" control={control} label="National ID" placeholder="e.g. 12345678" required />
            <CustomInput component="email" name="email" control={control} label="Email Address" placeholder="jane@school.ac.ke" required />
            <CustomInput component="text" name="phone" control={control} label="Phone Number" placeholder="+254 7XX XXX XXX" />
            <CustomInput component="text" name="preferredName" control={control} label="Preferred Name" placeholder="e.g. Jay" />
            <CustomInput component="select" name="gender" control={control} label="Gender" placeholder="Not specified"
              options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Prefer not to say', value: 'preferNotToSay' }]} />
            <CustomInput component="select" name="maritalStatus" control={control} label="Marital Status" placeholder="Not specified"
              options={[{ label: 'Single', value: 'single' }, { label: 'Married', value: 'married' }, { label: 'Divorced', value: 'divorced' }, { label: 'Widowed', value: 'widowed' }]} />
            <CustomInput component="text" name="nationality" control={control} label="Nationality" placeholder="e.g. Kenyan" />
            <CustomInput component="text" name="passportNumber" control={control} label="Passport Number" placeholder="e.g. A1234567" />
            <CustomInput component="date" name="passportExpiryDate" control={control} label="Passport Expiry" />
          </div>
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
          <SectionHeader icon={MapPin} title="Address" color="text-teal-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="addressStreet" control={control} label="Street" placeholder="e.g. Waiyaki Way" className="md:col-span-2" />
            <CustomInput component="text" name="addressCity" control={control} label="City" placeholder="e.g. Nairobi" />
            <CustomInput component="text" name="addressState" control={control} label="State / County" placeholder="e.g. Nairobi County" />
            <CustomInput component="text" name="addressCountry" control={control} label="Country" placeholder="e.g. Kenya" />
            <CustomInput component="text" name="addressPostalCode" control={control} label="Postal Code" placeholder="e.g. 00100" />
          </div>
        </div>

        {/* Role & Department */}
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
          <SectionHeader icon={Briefcase} title="Role & Department" color="text-violet-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput
              component="select"
              name="designation"
              control={control}
              label="Designation"
              placeholder="Select designation"
              options={designationOptions}
              required
            />
            <CustomInput
              component="select"
              name="department"
              control={control}
              label="Department"
              placeholder="Select department"
              options={departmentOptions}
              required
            />
            <CustomInput
              component="select"
              name="employmentType"
              control={control}
              label="Employment Type"
              placeholder="Select type"
              options={employmentTypeOptions}
              required
            />
          </div>
        </div>

        {/* Contract Details */}
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
          <SectionHeader icon={CalendarDays} title="Contract Details" color="text-emerald-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="date" name="dateOfHire" control={control} label="Date of Hire" required />
            <CustomInput component="date" name="contractEndDate" control={control} label="Contract End Date" />
            <CustomInput component="date" name="probationEndDate" control={control} label="Probation End Date" />
            <CustomInput component="date" name="confirmationDate" control={control} label="Confirmation Date" />
          </div>
          <p className="text-xs text-brand-text-muted">Leave Contract End Date blank for permanent employees.</p>
        </div>

        {/* Gross Pay */}
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
          <SectionHeader icon={DollarSign} title="Gross Pay" color="text-amber-400" />
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput component="text" name="grossPay" control={control} label="Gross Monthly Pay (KES)" placeholder="e.g. 85000" required />
            <CustomInput
              component="select"
              name="jobGroupId"
              control={control}
              label="Job Group"
              placeholder="Select job group"
              options={jobGroupOptions}
              required
            />
          </div>
          <p className="text-xs text-brand-text-muted">Job group is auto-selected from gross pay based on each group's salary band — override manually if needed.</p>
          <p className="text-xs text-brand-text-muted">Gross pay and job group are used to auto-calculate PAYE, NSSF, SHA and job-group-linked allowances/deductions during payroll generation.</p>
        </div>

        {/* Payment Method */}
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-text">Bank Name</label>
                  <Select
                    value={bankIsOther ? 'Other' : (bankName || undefined)}
                    onValueChange={(v) => {
                      if (v === 'Other') { setBankIsOther(true); setValue('bankName', ''); }
                      else { setBankIsOther(false); setValue('bankName', v); }
                    }}>
                    <SelectTrigger><SelectValue placeholder="Select a bank…" /></SelectTrigger>
                    <SelectContent>
                      {KENYA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {bankIsOther && (
                    <CustomInput component="text" name="bankName" control={control} label="" placeholder="Type the bank name" />
                  )}
                </div>
                <CustomInput component="text" name="bankAccountNumber" control={control} label="Account Number" placeholder="e.g. 0123456789" />
              </>
            )}
            {paymentMethod === 'mpesa' && (
              <CustomInput component="text" name="mpesaNumber" control={control} label="M-Pesa Number" placeholder="254712345678" />
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
        <div className="rounded-2xl border border-brand-border/60 bg-brand-bg-soft p-6 space-y-5">
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
          <Button variant="outline" asChild className="px-6 border-brand-border text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text">
            <Link href={`/${locale}/employees`}>Cancel</Link>
          </Button>
          <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
