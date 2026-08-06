'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Eye, EyeOff, ArrowRight, Users, BarChart2, Shield, Sparkles } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/configs/constants';
import { TurnstileWidget } from '@/components/custom-ui/TurnstileWidget';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: Users,    title: 'People Management',  desc: 'Centralise employee records, org charts, and documents.' },
  { icon: BarChart2,title: 'Real-time Analytics', desc: 'Live KPIs on attendance, payroll, and performance.' },
  { icon: Shield,   title: 'Role-based Access',   desc: 'Granular permissions keep data exactly where it belongs.' },
];

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const { login }   = useAuth();
  const router      = useRouter();
  const locale      = useLocale();

  // Set once login() returns { mfaRequired: true, mfaChallenge } instead of a token —
  // the account has TOTP enabled (see SecurityPage) and needs a second step before a
  // real session is issued.
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  // Only ever required when NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured — the widget
  // itself renders nothing otherwise, so captchaRequired stays false and submit is
  // never blocked on it (matches the backend no-op when TURNSTILE_SECRET_KEY is unset).
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const redirectAfterLogin = (user: any) => {
    if (user?.role === 'staff') {
      router.push(`/${locale}/staff-portal`);
    } else if (user?.role === 'department_head') {
      router.push(`/${locale}/department-portal`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const submit = (data: FormValues) => {
    if (captchaRequired && !captchaToken) { toast.error('Please complete the captcha.'); return; }
    return apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/login`,
      method: 'POST',
      // Pasted temp/reset passwords very commonly pick up a stray leading/trailing
      // space from the mail client — trimmed here (and again server-side) so that
      // never shows up as a confusing "wrong password."
      data: { ...data, password: data.password.trim(), captchaToken },
      showToast: false,
      thenFn: (res) => {
        if (res.data.mfaRequired) {
          setMfaChallenge(res.data.mfaChallenge);
          return;
        }
        const user = res.data.user;
        login(res.data.token, user, res.data.refreshToken);
        redirectAfterLogin(user);
      },
      catchFn: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'Invalid email or password.');
      },
    });
  };

  const submitMfaCode = () => {
    if (mfaCode.length < 6) { toast.error('Enter the 6-digit code from your authenticator app.'); return; }
    setMfaBusy(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/mfa/complete`,
      method: 'POST',
      data: { mfaChallenge, code: mfaCode },
      showToast: false,
      thenFn: (res) => {
        const user = res.data.user;
        login(res.data.token, user, res.data.refreshToken);
        redirectAfterLogin(user);
      },
      catchFn: (err: any) => toast.error(err?.response?.data?.message ?? 'Invalid code.'),
      finallyFn: () => setMfaBusy(false),
    });
  };

  return (
    <div className="min-h-screen flex">
      <Toaster richColors position="top-right" />

      {/* ── Left panel: branding ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-orange-50 via-white to-orange-50 flex-col justify-between p-12 border-r border-brand-border">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">HR</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">Workfola</span>
        </div>

        {/* Centre copy */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 leading-tight">
              The modern HR platform<br />
              <span className="text-orange-500">for growing teams.</span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-sm">
              Everything your HR team needs — from hire to retire — in one place.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-400 text-sm leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Workfola. All rights reserved.</p>
      </div>

      {/* ── Right panel: form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px] space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">HR</span>
            </div>
            <span className="font-bold text-slate-900">Workfola</span>
          </div>

          {mfaChallenge ? (
            <>
              {/* Heading */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-slate-900">Two-factor authentication</h2>
                <p className="text-sm text-slate-400">Enter the 6-digit code from your authenticator app.</p>
              </div>

              <div className="space-y-4">
                <input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitMfaCode(); }}
                  placeholder="123456"
                  inputMode="numeric"
                  autoFocus
                  className="w-full h-12 px-3.5 rounded-lg border border-brand-border text-center text-lg tracking-[0.3em] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                <button
                  type="button"
                  disabled={mfaBusy}
                  onClick={submitMfaCode}
                  className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-200"
                >
                  {mfaBusy ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaChallenge(null); setMfaCode(''); }}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </>
          ) : (
          <>
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to your account to continue.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(submit)} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full h-10 px-3.5 rounded-lg border border-brand-border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured */}
            <TurnstileWidget onToken={setCaptchaToken} />

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || (captchaRequired && !captchaToken)}
              className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-200"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo entry point — a read-only preview for prospective customers, not a real
              login. Deliberately its own route/token, see DemoPipelinePage. */}
          <Link
            href={`/${locale}/demo`}
            className="flex items-center justify-center gap-2 w-full h-10 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 rounded-lg transition-colors"
          >
            <Sparkles className="h-4 w-4 text-orange-500" /> View Demo
          </Link>

          {/* Footer note */}
          <p className="text-center text-sm text-slate-400">
            Need a staff or department head account?{' '}
            <span className="text-slate-500 font-medium">Contact your administrator.</span>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
