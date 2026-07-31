'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, ShoppingCart, Receipt, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePosAccess, useCurrentRegisterSession } from '../Hooks/usePosRegister';
import { OpenRegisterScreen } from '../Components/OpenRegisterScreen';
import { CloseRegisterModal } from '../Components/CloseRegisterModal';
import { CheckoutScreen } from '../Components/CheckoutScreen';
import { SalesHistoryTab } from '../Components/SalesHistoryTab';
import { ReportsTab } from '../Components/ReportsTab';
import { SettingsTab } from '../Components/SettingsTab';

const TABS = [
  { id: 'checkout', icon: ShoppingCart },
  { id: 'sales', icon: Receipt },
  { id: 'reports', icon: BarChart3 },
  { id: 'settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export function POSPage() {
  const t = useTranslations('POS');
  const { level, isLoading: accessLoading } = usePosAccess();
  const { session, isLoading: sessionLoading } = useCurrentRegisterSession();
  const [tab, setTab] = useState<TabId>('checkout');
  const [showClose, setShowClose] = useState(false);

  if (accessLoading || sessionLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;

  if (!level) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
        <ShieldAlert className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">{t('accessDenied.title')}</p>
        <p className="text-sm text-slate-400 max-w-sm">{t('accessDenied.message')}</p>
      </div>
    );
  }

  const visibleTabs = TABS.filter((x) => {
    if (x.id === 'settings') return level === 'admin';
    if (x.id === 'reports') return level === 'admin' || level === 'manager';
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{t('nav.title')}</h1>
        {session && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{t('register.registerOpenAt', { location: session.location?.name ?? '' })}</span>
            <button onClick={() => setShowClose(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
              <LogOut className="h-3.5 w-3.5" /> {t('register.closeRegister')}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {visibleTabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === x.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800')}>
            <x.icon className="h-4 w-4" /> {t(`nav.${x.id}`)}
          </button>
        ))}
      </div>

      <div>
        {tab === 'checkout' && (session ? <CheckoutScreen session={session} /> : <OpenRegisterScreen />)}
        {tab === 'sales' && <SalesHistoryTab level={level} />}
        {tab === 'reports' && (level === 'admin' || level === 'manager') && <ReportsTab level={level} />}
        {tab === 'settings' && level === 'admin' && <SettingsTab />}
      </div>

      {showClose && <CloseRegisterModal onClose={() => setShowClose(false)} />}
    </div>
  );
}
