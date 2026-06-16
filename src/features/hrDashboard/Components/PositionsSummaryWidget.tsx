'use client';
import { useTranslations } from 'next-intl';
import { Briefcase } from 'lucide-react';

export function PositionsSummaryWidget({ open, filled, frozen }: { open: number; filled: number; frozen: number }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Positions</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-success/10 p-3">
          <p className="text-2xl font-bold text-success">{open}</p>
          <p className="text-xs text-success/70 mt-1">{t('openPositions')}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-2xl font-bold text-primary">{filled}</p>
          <p className="text-xs text-primary/70 mt-1">{t('filledPositions')}</p>
        </div>
        <div className="rounded-lg bg-warning/20 p-3">
          <p className="text-2xl font-bold text-warning">{frozen}</p>
          <p className="text-xs mt-1" style={{ color: '#b8960c' }}>{t('frozenPositions')}</p>
        </div>
      </div>
    </div>
  );
}
