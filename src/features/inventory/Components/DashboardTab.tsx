'use client';

import { useTranslations } from 'next-intl';
import { Package, MapPin, AlertTriangle, DollarSign } from 'lucide-react';
import { useInventoryItems } from '../Hooks/useInventoryItems';
import { useInventoryLocations, useLowStockAlerts } from '../Hooks/useInventoryLocations';
import { useValuationReport } from '../Hooks/useInventoryReports';
import type { InventoryAccessLevel } from '../types';

export function DashboardTab({ level }: { level: InventoryAccessLevel }) {
  const t = useTranslations('Inventory');
  const { items } = useInventoryItems();
  const { locations } = useInventoryLocations();
  const { alerts, isLoading: alertsLoading } = useLowStockAlerts();
  const { valuation } = useValuationReport();
  const canSeeValuation = level === 'admin';

  const stats = [
    { label: t('dashboard.totalItems'), value: items.length, icon: Package, color: 'text-indigo-500 bg-indigo-50' },
    { label: t('dashboard.totalLocations'), value: locations.length, icon: MapPin, color: 'text-sky-500 bg-sky-50' },
    { label: t('reports.lowStock'), value: alerts.length, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
    ...(canSeeValuation ? [{ label: t('dashboard.totalValue'), value: (valuation?.total ?? 0).toLocaleString(), icon: DollarSign, color: 'text-emerald-500 bg-emerald-50' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">{t('dashboard.lowStockWidgetTitle')}</h3>
        {alertsLoading ? null : alerts.length === 0 ? (
          <p className="text-sm text-slate-400">{t('dashboard.noLowStock')}</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {alerts.slice(0, 8).map((a) => (
              <div key={a._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-700">{a.item?.name} <span className="text-xs text-slate-400 font-mono">({a.item?.sku})</span> · {a.location?.name}</span>
                <span className="text-red-600 font-semibold">{a.quantity} / {a.reorderPoint}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
