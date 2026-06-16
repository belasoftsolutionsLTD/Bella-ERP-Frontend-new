'use client';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

interface Contract { fullName: string; staffNumber: string; daysRemaining: number }

export function ExpiringContractsWidget({ contracts }: { contracts: Contract[] }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-danger" />
        <h3 className="font-semibold">{t('expiringContracts')}</h3>
      </div>
      {contracts.length === 0 ? (
        <p className="text-sm text-foreground/50">No expiring contracts.</p>
      ) : (
        <ul className="space-y-2">
          {contracts.slice(0, 5).map((c, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span>{c.fullName} <span className="text-foreground/50">({c.staffNumber})</span></span>
              <span className="text-danger font-medium">{c.daysRemaining} {t('daysRemaining')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
