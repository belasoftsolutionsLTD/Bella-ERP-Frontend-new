'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Briefcase, CalendarDays, DollarSign, CreditCard, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { employeeSchema, DEPARTMENTS, DESIGNATIONS } from './EmployeeSchema';
import { useHrConfig } from '@/features/config/Hooks/useHrConfig';

const schema = employeeSchema.pick({
  fullName: true, nationalId: true, designation: true, employmentType: true,
  department: true, dateOfHire: true, dateOfBirth: true, contractEndDate: true, salaryGrade: true,
  grossPay: true, paymentMethod: true, bankName: true, bankAccountNumber: true,
  mpesaNumber: true, paypalEmail: true, cryptoWalletAddress: true, cryptoNetwork: true,
  email: true, phone: true, nokName: true, nokRelationship: true, nokPhone: true,
  nokNationalId: true, nokEmail: true, location: true, costCenter: true,
  staffCategory: true,
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

const inp = 'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-colors';
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
  const { departments, designations, jobGroups } = useHrConfig();

  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' },
  });
  const paymentMethod = watch('paymentMethod');
  const departmentOptions = (departments.items.length > 0 ? departments.items : DEPARTMENTS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));
  const designationOptions = (designations.items.length > 0 ? designations.items : DESIGNATIONS.map(name => ({ name })))
    .map((d) => ({ label: d.name, value: d.name }));

  const submit = async (data: FormValues) => {
    const { nokName, nokRelationship, nokPhone, nokNationalId, nokEmail, ...rest } = data;
    const payload = {
      ...rest,
      nextOfKin: (nokName || nokPhone || nokNationalId || nokEmail)
        ? { name: nokName, relationship: nokRelationship, phone: nokPhone, nationalId: nokNationalId, email: nokEmail }
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
              <User className="h-4 w-4 text-indigo-600" />
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
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600">Full Name *</label>
                  <input {...register('fullName')} placeholder="e.g. Jane Wanjiku" className={inp} />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
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
                  <label className="text-xs font-medium text-slate-600">Staff Category</label>
                  <select {...register('staffCategory')} className={sel}>
                    <option value="">Not specified</option>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="casual">Casual</option>
                    <option value="management">Management</option>
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
              </div>
            </div>

            {/* ── Compensation ────────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={DollarSign} title="Compensation" color="text-amber-600 border-amber-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Gross Monthly Pay (KES)</label>
                  <input {...register('grossPay')} type="number" placeholder="e.g. 85000" className={inp} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Job Group</label>
                  {jobGroups.items.length > 0 ? (
                    <select {...register('salaryGrade')} className={sel}>
                      <option value="">Select job group…</option>
                      {jobGroups.items.map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                    </select>
                  ) : (
                    <input {...register('salaryGrade')} placeholder="e.g. Grade 5" className={inp} />
                  )}
                </div>
              </div>
            </div>

            {/* ── Payment Method ──────────────────────────────────────── */}
            <div className="space-y-4">
              <SectionHeader icon={CreditCard} title="Payment Method" color="text-indigo-600 border-indigo-100" />
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
                    <input {...register('bankName')} placeholder="e.g. Equity Bank" className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Account Number</label>
                    <input {...register('bankAccountNumber')} placeholder="e.g. 0123456789" className={inp} />
                  </div>
                </>)}
                {paymentMethod === 'mpesa' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-600">M-Pesa Number</label>
                    <input {...register('mpesaNumber')} placeholder="+254 7XX XXX XXX" className={inp} />
                  </div>
                )}
                {paymentMethod === 'paypal' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-600">PayPal Email</label>
                    <input {...register('paypalEmail')} type="email" placeholder="jane@paypal.com" className={inp} />
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
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-60 transition-colors"
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
