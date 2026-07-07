'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ClockInProvider } from '@/contexts/ClockInContext';
import { HrSidebar } from '@/components/custom-ui/HrSidebar';
import { HrTopBar } from '@/components/custom-ui/HrTopBar';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

function PasswordResetPrompt({ onDone }: { onDone: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/auth/me/password`,
      method: 'PATCH',
      data: { newPassword },
      thenFn: () => {
        toast.success('Password updated. Welcome!');
        onDone();
      },
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="h-12 w-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-3">
            <span className="text-accent font-bold text-lg">SE</span>
          </div>
          <h2 className="text-xl font-bold">Set your password</h2>
          <p className="text-sm text-foreground/50">
            Your account was created with a temporary password. Please set a new one to continue.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              className="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-foreground/40 text-xs"
              onClick={onDone}
            >
              Skip for now
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Set Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading, userData, refreshUser, isStaff } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace(`/${locale}/login`);
    } else if (isStaff && !pathname.endsWith('/staff-portal') && !pathname.includes('/my/training')) {
      // Staff are only allowed on their own portal page, plus their own training pages
      router.replace(`/${locale}/staff-portal`);
    }
  }, [isLoggedIn, isStaff, authLoading, router, locale, pathname]);

  useEffect(() => {
    if (userData?.mustResetPassword) {
      setShowReset(true);
    }
  }, [userData?.mustResetPassword]);

  const handleResetDone = () => {
    refreshUser({ mustResetPassword: false });
    setShowReset(false);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-accent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <ClockInProvider>
      <div className="flex flex-col h-screen bg-[#0f172a] overflow-hidden">
        {showReset && <PasswordResetPrompt onDone={handleResetDone} />}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <HrSidebar />
          <div className="flex flex-col flex-1 min-h-0">
            <HrTopBar />
            <main className="flex-1 overflow-y-auto px-8 py-6 md:px-10 md:py-8 bg-[#0f172a]">
              {children}
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </ClockInProvider>
  );
}
