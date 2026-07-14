'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Briefcase, CalendarDays, DollarSign, CreditCard, Heart, Loader2, Upload, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { employeeSchema, DEPARTMENTS, DESIGNATIONS, KENYA_BANKS, MPESA_NUMBER_REGEX, MPESA_NUMBER_ERROR } from './EmployeeSchema';
import { useConfigSection } from '@/hooks/useConfigSection';

const schema = employeeSchema.pick({
  firstName: true, lastName: true, nationalId: true, designation: true, employmentType: true,
  department: true, dateOfHire: true, dateOfBirth: true, contractEndDate: true, jobGroupId: true,
  probationEndDate: true, confirmationDate: true,
  grossPay: true, taxId: true, paymentMethod: true, bankName: true, bankAccountNumber: true,
  mpesaNumber: true, paypalEmail: true, cryptoWalletAddress: true, cryptoNetwork: true,
  email: true, phone: true, nokName: true, nokRelationship: true, nokPhone: true,
  nokNationalId: true, nokEmail: true, location: true, costCenter: true,
  preferredName: true, gender: true, maritalStatus: true, nationality: true,
  passportNumber: true, passportExpiryDate: true,
  addressStreet: true, addressCity: true, addressState: true, addressCountry: true, addressPostalCode: true,
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'bank_transfer' && !data.bankAccountNumber?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Account number is required for bank transfer', path: ['bankAccountNumber'] });
  }
  if (data.paymentMethod === 'mpesa' && !data.mpesaNumber?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'M-Pesa number is required', path: ['mpesaNumber'] });
  }
  if (data.paymentMethod === 'mpesa' && data.mpesaNumber?.trim() && !MPESA_NUMBER_REGEX.test(data.mpesaNumber.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MPESA_NUMBER_ERROR, path: ['mpesaNumber'] });
  }
  if (data.paymentMethod === 'paypal' && !data.paypalEmail?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PayPal email is required', path: ['paypalEmail'] });
  }
});

type FormValues = z.infer<typeof schema>;

const EMPLOYMENT_TYPES = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract',  value: 'contract'  },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Intern',    value: 'intern'    },
];

const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'M-Pesa',        value: 'mpesa'         },
  { label: 'Cash',          value: 'cash'          },
  { label: 'PayPal',        value: 'paypal'        },
  { label: 'Crypto',        value: 'crypto'        },
];

const inp = 'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors';
const sel = `${inp} appearance-none`;

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={cn('flex items-center gap-2 pb-2 border-b', color)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </div>
  );
}

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

export function AddEmployeeDrawer({ onClose, onCreated }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const backdropRef = useRef<HTMLDivElement>(null);
  const departments = useConfigSection('departments');
  const designations = useConfigSection('designations');
  const jobGroups = useConfigSection('job-groups');

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' },
  });
  const paymentMethod = watch('paymentMethod');
  const bankName = watch('bankName');
  const [bankIsOther, setBankIsOther] = useState(false);
  const departmentOptions = (departments.items.length > 0 ? departments.items : DEPARTMENTS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));
  const designationOptions = (designations.items.length > 0 ? designations.items : DESIGNATIONS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));

  const submit = async (data: FormValues) => {
    const { nokName, nokRelationship, nokPhone, nokNationalId, nokEmail, taxId, addressStreet, addressCity, addressState, addressCountry, addressPostalCode, ...rest } = data;
    const payload = {
      ...rest,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      kraPin: taxId || null,
      nextOfKin: (nokName || nokPhone || nokNationalId || nokEmail)
        ? { name: nokName, relationship: nokRelationship, phone: nokPhone, nationalId: nokNationalId, email: nokEmail }
        : null,
      address: (addressStreet || addressCity || addressState || addressCountry || addressPostalCode)
        ? { street: addressStreet, city: addressCity, state: addressState, country: addressCountry, postalCode: addressPostalCode }
        : null,
    };
    await apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      method: 'POST',
      data: payload,
      thenFn: (res) => {
        const employeeId = res.data?._id;
        onCreated?.();
        onClose();
        if (employeeId) router.push(`/${locale}/employees/${employeeId}`);
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
      {/* Panel */}
      <div className="relative z-50 w-full max-w-[560px] max-h-[90vh] bg-white shadow-2xl rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Add Employee</p>
              <p className="text-xs text-slate-400">Create a new employee record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-5 space-y-6">

            {/* ── Personal Info ───────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={User} title="Personal Information" color="text-blue-600 border-blue-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">First Name *</label>
                  <input {...register('firstName')} placeholder="e.g. Jane" className={inp} />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Last Name *</label>
                  <input {...register('lastName')} placeholder="e.g. Wanjiku" className={inp} />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">National ID *</label>
                  <input {...register('nationalId')} placeholder="e.g. 12345678" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input {...register('email')} type="email" placeholder="jane@school.ac.ke" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Phone</label>
                  <input {...register('phone')} placeholder="+254 7XX XXX XXX" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Preferred Name</label>
                  <input {...register('preferredName')} placeholder="e.g. Jay" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Gender</label>
                  <select {...register('gender')} className={sel}>
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="preferNotToSay">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Marital Status</label>
                  <select {...register('maritalStatus')} className={sel}>
                    <option value="">Not specified</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nationality</label>
                  <input {...register('nationality')} placeholder="e.g. Kenyan" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Passport Number</label>
                  <input {...register('passportNumber')} placeholder="e.g. A1234567" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Passport Expiry</label>
                  <input {...register('passportExpiryDate')} type="date" className={inp} />
                </div>
              </div>
            </div>

            {/* ── Address ─────────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={MapPin} title="Address" color="text-teal-600 border-teal-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">Street</label>
                  <input {...register('addressStreet')} placeholder="e.g. Waiyaki Way" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">City</label>
                  <input {...register('addressCity')} placeholder="e.g. Nairobi" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">State / County</label>
                  <input {...register('addressState')} placeholder="e.g. Nairobi County" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Country</label>
                  <input {...register('addressCountry')} placeholder="e.g. Kenya" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Postal Code</label>
                  <input {...register('addressPostalCode')} placeholder="e.g. 00100" className={inp} />
                </div>
              </div>
            </div>

            {/* ── Work Info ───────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={Briefcase} title="Work & Role" color="text-violet-600 border-violet-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Department *</label>
                  <select {...register('department')} className={sel}>
                    <option value="">Select…</option>
                    {departmentOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Designation *</label>
                  <select {...register('designation')} className={sel}>
                    <option value="">Select…</option>
                    {designationOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Employment Type *</label>
                  <select {...register('employmentType')} className={sel}>
                    <option value="">Select…</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Location</label>
                  <input {...register('location')} placeholder="e.g. Nairobi Main Office" className={inp} />
                  <p className="text-[10px] text-slate-400">Physical work site — used for cost analytics.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Cost Center</label>
                  <input {...register('costCenter')} placeholder="e.g. CC-101 Operations" className={inp} />
                  <p className="text-[10px] text-slate-400">Accounting budget unit this employee's salary is charged to.</p>
                </div>
              </div>
            </div>

            {/* ── Contract ────────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={CalendarDays} title="Contract Details" color="text-emerald-600 border-emerald-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Date of Hire</label>
                  <input {...register('dateOfHire')} type="date" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Date of Birth</label>
                  <input {...register('dateOfBirth')} type="date" className={inp} />
                  <p className="text-[10px] text-slate-400">Used for birthday celebrations.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Contract End Date</label>
                  <input {...register('contractEndDate')} type="date" className={inp} />
                  <p className="text-[10px] text-slate-400">Leave blank for permanent staff.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Probation End Date</label>
                  <input {...register('probationEndDate')} type="date" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Confirmation Date</label>
                  <input {...register('confirmationDate')} type="date" className={inp} />
                </div>
              </div>
            </div>

            {/* ── Compensation ────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={DollarSign} title="Compensation & Tax" color="text-amber-600 border-amber-100" />
              {/* Payroll completeness notice */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Gross pay and job group are <strong>required for payroll</strong>. Incomplete profiles will be blocked from salary runs.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Gross Monthly Pay *</label>
                  <input {...register('grossPay')} type="number" placeholder="e.g. 85000" className={inp} />
                  {errors.grossPay && <p className="text-xs text-red-500">{errors.grossPay.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Job Group *</label>
                  <select {...register('jobGroupId')} className={sel}>
                    <option value="">Select job group…</option>
                    {jobGroups.items.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                  {jobGroups.items.length === 0 && <p className="text-[10px] text-amber-600">No job groups defined yet — create one in People Settings first.</p>}
                  {errors.jobGroupId && <p className="text-xs text-red-500">{errors.jobGroupId.message}</p>}
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">Tax ID / PIN</label>
                  <input {...register('taxId')} placeholder="e.g. A000123456X / TIN-00123" className={inp} />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Upload className="h-3 w-3 text-indigo-400 shrink-0" />
                    <p className="text-[10px] text-brand-primary">Upload the tax certificate in the <strong>Documents</strong> tab after saving this employee.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Payment Method ──────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={CreditCard} title="Payment Method" color="text-brand-primary border-indigo-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">Method</label>
                  <select {...register('paymentMethod')} className={sel}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                {paymentMethod === 'bank_transfer' && (<>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Bank Name</label>
                    <select value={bankIsOther ? 'Other' : (bankName ?? '')}
                      onChange={e => {
                        if (e.target.value === 'Other') { setBankIsOther(true); setValue('bankName', ''); }
                        else { setBankIsOther(false); setValue('bankName', e.target.value); }
                      }} className={sel}>
                      <option value="" disabled>Select a bank…</option>
                      {KENYA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {bankIsOther && (
                      <input {...register('bankName')} placeholder="Type the bank name" className={cn(inp, 'mt-1.5')} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Account Number *</label>
                    <input {...register('bankAccountNumber')} placeholder="e.g. 0123456789" className={inp} />
                    {errors.bankAccountNumber && <p className="text-xs text-red-500">{errors.bankAccountNumber.message}</p>}
                  </div>
                </>)}
                {paymentMethod === 'mpesa' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-600">M-Pesa Number *</label>
                    <input {...register('mpesaNumber')} placeholder="254712345678" className={inp} />
                    {errors.mpesaNumber && <p className="text-xs text-red-500">{errors.mpesaNumber.message}</p>}
                  </div>
                )}
                {paymentMethod === 'paypal' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-600">PayPal Email *</label>
                    <input {...register('paypalEmail')} type="email" placeholder="jane@paypal.com" className={inp} />
                    {errors.paypalEmail && <p className="text-xs text-red-500">{errors.paypalEmail.message}</p>}
                  </div>
                )}
                {paymentMethod === 'crypto' && (<>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Wallet Address</label>
                    <input {...register('cryptoWalletAddress')} placeholder="0x1a2b3c…" className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Network / Coin</label>
                    <input {...register('cryptoNetwork')} placeholder="e.g. USDT (TRC20)" className={inp} />
                  </div>
                </>)}
              </div>
            </div>

            {/* ── Next of Kin ─────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={Heart} title="Next of Kin" color="text-rose-600 border-rose-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Full Name</label>
                  <input {...register('nokName')} placeholder="e.g. John Kamau" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Relationship</label>
                  <input {...register('nokRelationship')} placeholder="e.g. Spouse" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Phone</label>
                  <input {...register('nokPhone')} placeholder="+254 7XX XXX XXX" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">National ID</label>
                  <input {...register('nokNationalId')} placeholder="e.g. 12345678" className={inp} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input {...register('nokEmail')} type="email" placeholder="nextofkin@example.com" className={inp} />
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-4 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(submit)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Save Employee'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
