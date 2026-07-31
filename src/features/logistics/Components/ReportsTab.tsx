'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { downloadFile } from '@/functions/downloadFile';
import { API_BASE_URL } from '@/configs/constants';
import { useDeliveryPerformance } from '../Hooks/useShipments';
import type { LogisticsAccessLevel } from '../types';

function StatTile({ label, value, colorCls }: { label: string; value: string | number; colorCls?: string }) {
  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
      <p className={`text-lg font-bold ${colorCls || 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ReportsTab({ level }: { level: LogisticsAccessLevel }) {
  const t = useTranslations('Logistics');
  const { performance, isLoading } = useDeliveryPerformance();
  const [exporting, setExporting] = useState(false);

  if (level !== 'admin' && level !== 'opsAdmin') {
    return <p className="text-sm text-slate-400 text-center py-16">{t('common.notAuthorized')}</p>;
  }

  const exportCSV = () => {
    setExporting(true);
    downloadFile(`${API_BASE_URL}/logistics/reports/delivery-performance/csv`, 'delivery-performance.csv')
      .catch((err) => alert(err.message))
      .finally(() => setExporting(false));
  };

  if (isLoading) return <p className="text-sm text-slate-400 text-center py-8">{t('common.loading')}</p>;
  if (!performance) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">{t('reports.title')}</p>
        <button onClick={exportCSV} disabled={exporting} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text-secondary text-xs font-semibold disabled:opacity-40">
          <Download className="h-3.5 w-3.5" /> {exporting ? t('common.saving') : t('reports.exportCSV')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label={t('reports.totalShipments')} value={performance.totalShipments} />
        <StatTile label={t('reports.delivered')} value={performance.delivered} colorCls="text-emerald-600" />
        <StatTile label={t('reports.onTimeRate')} value={`${performance.onTimeRate}%`} colorCls="text-emerald-600" />
        <StatTile label={t('reports.avgDelay')} value={`${performance.avgDelayHours}h`} colorCls={performance.avgDelayHours > 0 ? 'text-amber-600' : 'text-emerald-600'} />
        <StatTile label={t('reports.exceptionRate')} value={`${performance.exceptionRate}%`} colorCls={performance.exceptionRate > 0 ? 'text-red-600' : undefined} />
        <StatTile label={t('reports.exceptionCount')} value={performance.exceptionCount} />
      </div>
    </div>
  );
}
