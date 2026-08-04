'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const submit = (data: FormValues) =>
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/reset-password`,
      method: 'POST',
      data: { token, newPassword: data.newPassword },
      showToast: false,
      thenFn: () => {
        setDone(true);
        setTimeout(() => router.push(`/${locale}/login`), 2500);
      },
      catchFn: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'Reset link is invalid or has expired.');
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

        {!token ? (
          <div className="space-y-6">
            <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Invalid reset link</h2>
              <p className="text-sm text-slate-400">This link is missing its reset token. Request a new one below.</p>
            </div>
            <Link
              href={`/${locale}/forgot-password`}
              className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-6">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Password reset</h2>
              <p className="text-sm text-slate-400">Redirecting you to sign in…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Set a new password</h2>
              <p className="text-sm text-slate-400">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit(submit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">New password</label>
                <div className="relative">
                  <input
                    {...register('newPassword')}
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 pr-10 rounded-lg border border-brand-border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  {...register('confirmPassword')}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded-lg border border-brand-border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-200"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Reset password <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
