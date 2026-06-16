'use client';
import { useTranslations } from 'next-intl';
import { useClientInformation } from '@/hooks/useClientInformation';

export function PortalHeader() {
  const t = useTranslations('StaffPortal');
  const { userData } = useClientInformation();
  const initials = (userData?.name ?? 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = (() => {
    const role = (userData as any)?.role;
    if (role === 'hr_manager') return 'HR Manager';
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'staff') return 'Staff';
    return '';
  })();
  return (
    <div className="bg-primary text-white rounded-xl p-6 flex items-center gap-5">
      <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-primary">
        {initials}
      </div>
      <div>
        <p className="text-sm opacity-70">{t('welcome')}</p>
        <p className="text-2xl font-bold">{userData?.name ?? '—'}</p>
        {roleLabel ? <p className="text-sm opacity-70 mt-0.5">{roleLabel}</p> : null}
      </div>
    </div>
  );
}
