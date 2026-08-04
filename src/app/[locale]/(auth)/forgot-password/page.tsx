'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const submit = (data: FormValues) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/forgot-password`,
      method: 'POST',
      data,
      showToast: false,
      thenFn: () => setSent(true),
      catchFn: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
      },
    });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">HR</span>
          </div>
          <span className="font-bold text-slate-900">Bela ERP</span>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MailCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-400">
                If an account exists for that email address, we&apos;ve sent a link to reset your password. It expires in 1 hour.
              </p>
            </div>
            <Link
              href={`/${locale}/login`}
              className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
              <p className="text-sm text-slate-400">Enter your email and we&apos;ll send you a link to reset it.</p>
            </div>

            <form onSubmit={handleSubmit(submit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full h-10 px-3.5 rounded-lg border border-brand-border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-200"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send reset link <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <Link
              href={`/${locale}/login`}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
