'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, Truck, Wrench, Route as RouteIcon, Package, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogisticsAccess } from '../Hooks/useLogisticsConfig';
import { FleetTab } from '../Components/FleetTab';
import { MaintenanceTab } from '../Components/MaintenanceTab';
import { RoutesTab } from '../Components/RoutesTab';
import { ShipmentsTab } from '../Components/ShipmentsTab';
import { ReportsTab } from '../Components/ReportsTab';
import { SettingsTab } from '../Components/SettingsTab';

const TABS = [
  { id: 'fleet', icon: Truck },
  { id: 'maintenance', icon: Wrench },
  { id: 'routes', icon: RouteIcon },
  { id: 'shipments', icon: Package },
  { id: 'reports', icon: BarChart2 },
  { id: 'settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export function LogisticsPage() {
  const t = useTranslations('Logistics');
  const searchParams = useSearchParams();
  const { level, isLoading } = useLogisticsAccess();
  const [tab, setTab] = useState<TabId>('fleet');

  useEffect(() => {
    const requested = searchParams.get('tab') as TabId | null;
    if (requested && TABS.some((x) => x.id === requested)) setTab(requested);
  }, [searchParams]);

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;

  if (!level) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
        <ShieldAlert className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">{t('accessDenied.title')}</p>
        <p className="text-sm text-slate-400 max-w-sm">{t('accessDenied.message')}</p>
      </div>
    );
  }

  // A driver only ever works their own route/stops — no fleet setup, maintenance
  // cost entry, or fleet-wide reports.
  const visibleTabs = TABS.filter((x) => {
    if (level === 'driver') return x.id === 'routes';
    if (x.id === 'maintenance' || x.id === 'reports') return level === 'admin' || level === 'opsAdmin';
    // Vehicle-type setup and the Accounting-mapping check are fleet-setup-adjacent —
    // same admin-only gate as createVehicle/updateVehicle.
    if (x.id === 'settings') return level === 'admin';
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('nav.title')}</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {visibleTabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === x.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <x.icon className="h-4 w-4" /> {t(`nav.${x.id}`)}
          </button>
        ))}
      </div>

      <div>
        {tab === 'fleet' && <FleetTab level={level} />}
        {tab === 'maintenance' && <MaintenanceTab level={level} />}
        {tab === 'routes' && <RoutesTab level={level} />}
        {tab === 'shipments' && <ShipmentsTab level={level} />}
        {tab === 'reports' && <ReportsTab level={level} />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
