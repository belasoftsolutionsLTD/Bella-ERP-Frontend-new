'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, LayoutDashboard, Package, MapPin, Truck, ClipboardList, ArrowLeftRight, History, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryAccess } from '../Hooks/useInventoryConfig';
import { DashboardTab } from '../Components/DashboardTab';
import { ItemsTab } from '../Components/ItemsTab';
import { LocationsTab } from '../Components/LocationsTab';
import { StockLevelsTab } from '../Components/StockLevelsTab';
import { SuppliersTab } from '../Components/SuppliersTab';
import { PurchaseOrdersTab } from '../Components/PurchaseOrdersTab';
import { TransfersTab } from '../Components/TransfersTab';
import { MovementsTab } from '../Components/MovementsTab';
import { ReportsTab } from '../Components/ReportsTab';
import { SettingsTab } from '../Components/SettingsTab';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'items', icon: Package },
  { id: 'stock', icon: MapPin },
  { id: 'locations', icon: MapPin },
  { id: 'suppliers', icon: Truck },
  { id: 'purchaseOrders', icon: ClipboardList },
  { id: 'transfers', icon: ArrowLeftRight },
  { id: 'movements', icon: History },
  { id: 'reports', icon: BarChart3 },
  { id: 'settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export function InventoryPage() {
  const t = useTranslations('Inventory');
  const searchParams = useSearchParams();
  const { level, isLoading } = useInventoryAccess();
  const [tab, setTab] = useState<TabId>('dashboard');

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

  const visibleTabs = TABS.filter((x) => {
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
        {tab === 'dashboard' && <DashboardTab level={level} />}
        {tab === 'items' && <ItemsTab level={level} />}
        {tab === 'stock' && <StockLevelsTab level={level} />}
        {tab === 'locations' && <LocationsTab level={level} />}
        {tab === 'suppliers' && <SuppliersTab level={level} />}
        {tab === 'purchaseOrders' && <PurchaseOrdersTab level={level} />}
        {tab === 'transfers' && <TransfersTab level={level} />}
        {tab === 'movements' && <MovementsTab level={level} />}
        {tab === 'reports' && <ReportsTab level={level} />}
        {tab === 'settings' && level === 'admin' && <SettingsTab />}
      </div>
    </div>
  );
}
