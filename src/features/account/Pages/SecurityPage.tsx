'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';

// The backend has had a full TOTP (Google Authenticator-style) two-factor flow since
// early in this codebase's history — setup/verify/disable/login-challenge all exist
// in authFunctions.js — but nothing in the frontend ever called it, so no one could
// actually turn it on. This page and the login page's MFA-challenge step are the two
// missing pieces that make the existing backend capability reachable.
export default function SecurityPage() {
  const { userData, refreshUser } = useAuth();
  const mfaEnabled = !!userData?.mfaEnabled;

  const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const startSetup = () => {
    setBusy(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/mfa/setup`,
      method: 'POST',
      showToast: false,
      thenFn: (res) => {
        setQrCode(res.data.qrCode);
        setManualKey(res.data.manualKey);
        setStep('setup');
      },
      finallyFn: () => setBusy(false),
    });
  };

  const confirmSetup = () => {
    if (code.length < 6) { toast.error('Enter the 6-digit code from your authenticator app.'); return; }
    setBusy(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/mfa/verify`,
      method: 'POST',
      data: { code },
      showToast: false,
      thenFn: () => {
        refreshUser({ mfaEnabled: true });
        toast.success('Two-factor authentication is now enabled.');
        setStep('idle'); setCode(''); setQrCode(''); setManualKey('');
      },
      catchFn: (err: any) => toast.error(err?.response?.data?.message ?? 'Invalid code. Try again.'),
      finallyFn: () => setBusy(false),
    });
  };

  const confirmDisable = () => {
    if (code.length < 6) { toast.error('Enter your current 6-digit code to confirm.'); return; }
    setBusy(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/auth/mfa`,
      method: 'DELETE',
      data: { code },
      showToast: false,
      thenFn: () => {
        refreshUser({ mfaEnabled: false });
        toast.success('Two-factor authentication has been disabled.');
        setStep('idle'); setCode('');
      },
      catchFn: (err: any) => toast.error(err?.response?.data?.message ?? 'Invalid code.'),
      finallyFn: () => setBusy(false),
    });
  };

  const copyKey = () => {
    navigator.clipboard.writeText(manualKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">Security</h1>
        <p className="text-sm text-brand-text-secondary">Protect your account with two-factor authentication</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {step === 'idle' && (
          <>
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${mfaEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {mfaEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Authenticator app two-factor authentication is {mfaEnabled ? 'ON' : 'OFF'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mfaEnabled
                    ? "You'll be asked for a code from your authenticator app each time you sign in."
                    : 'Use an app like Google Authenticator or Authy to require a code at sign-in, on top of your password.'}
                </p>
              </div>
            </div>
            <Button
              className={`w-full mt-4 ${mfaEnabled ? '' : 'bg-primary text-white'}`}
              variant={mfaEnabled ? 'outline' : 'default'}
              disabled={busy}
              onClick={() => (mfaEnabled ? setStep('disable') : startSetup())}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mfaEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
            </Button>
          </>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
            {qrCode && <img src={qrCode} alt="MFA QR code" className="mx-auto h-44 w-44 border border-slate-200 rounded-lg" />}
            <div>
              <p className="text-xs text-slate-500 mb-1">Or enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 break-all">{manualKey}</code>
                <button type="button" onClick={copyKey} className="text-slate-400 hover:text-slate-700 shrink-0">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Enter the 6-digit code to confirm</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tracking-widest text-center font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep('idle'); setCode(''); }}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" disabled={busy} onClick={confirmSetup}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Enter your current 6-digit authenticator code to confirm disabling two-factor authentication.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tracking-widest text-center font-mono"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStep('idle'); setCode(''); }}>Cancel</Button>
              <Button className="flex-1 bg-brand-danger text-white hover:bg-brand-danger/90" disabled={busy} onClick={confirmDisable}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
