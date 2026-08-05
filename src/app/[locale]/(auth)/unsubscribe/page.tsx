'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { MailX, MailCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/configs/constants';

type Status = 'loading' | 'invalid' | 'ready' | 'done';

export default function UnsubscribePage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>('loading');
  const [info, setInfo] = useState<{ email: string; name: string; unsubscribed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!uid || !token) { setStatus('invalid'); return; }
    fetch(`${API_BASE_URL}/public/unsubscribe/status?uid=${uid}&token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setStatus('invalid'); return; }
        setInfo(d.data);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [uid, token]);

  const toggle = (unsubscribe: boolean) => {
    setSubmitting(true);
    fetch(`${API_BASE_URL}/public/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, unsubscribed: unsubscribe }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setInfo((i) => (i ? { ...i, unsubscribed: unsubscribe } : i)); setStatus('done'); }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-[420px] space-y-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">HR</span>
          </div>
          <span className="font-bold text-slate-900">Workfola</span>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
          </div>
        )}

        {status === 'invalid' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Invalid link</h2>
            <p className="text-sm text-slate-400">This unsubscribe link is invalid or has expired. If you need help, contact your administrator.</p>
          </div>
        )}

        {(status === 'ready' || status === 'done') && info && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${info.unsubscribed ? 'bg-slate-100' : 'bg-emerald-100'}`}>
              {info.unsubscribed ? <MailX className="h-5 w-5 text-slate-500" /> : <MailCheck className="h-5 w-5 text-emerald-600" />}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {info.unsubscribed ? "You're unsubscribed" : 'Manage email notifications'}
            </h2>
            <p className="text-sm text-slate-400">
              {info.email} —{' '}
              {info.unsubscribed
                ? "you won't receive notification emails from the system anymore. Account-critical emails (like password resets) will still reach you."
                : "you're currently subscribed to notification emails."}
            </p>

            {status === 'ready' && (
              <button
                onClick={() => toggle(!info.unsubscribed)}
                disabled={submitting}
                className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-orange-200 mt-2"
              >
                {submitting ? 'Please wait…' : info.unsubscribed ? 'Resubscribe' : 'Unsubscribe from these emails'}
              </button>
            )}
            {status === 'done' && (
              <button
                onClick={() => toggle(!info.unsubscribed)}
                disabled={submitting}
                className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors mt-1"
              >
                {info.unsubscribed ? 'Changed your mind? Resubscribe' : 'Unsubscribe again'}
              </button>
            )}
          </div>
        )}

        <Link href={`/${locale}/login`} className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
