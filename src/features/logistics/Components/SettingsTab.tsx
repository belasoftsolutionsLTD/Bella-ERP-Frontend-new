'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useVehicleTypes, useServiceBays } from '../Hooks/useLogisticsConfig';

function VehicleTypesPanel() {
  const t = useTranslations('Logistics');
  const { vehicleTypes, createVehicleType, deleteVehicleType } = useVehicleTypes();
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.vehicleTypes')}</p>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.vehicleTypeName')}
          className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (name.trim()) { createVehicleType(name.trim()); setName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {vehicleTypes.map((vt) => (
          <span key={vt._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {vt.name}
            <button onClick={() => deleteVehicleType(vt._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Same list-of-named-values pattern as Vehicle Types — maintenance work orders store
// the chosen bay name as a plain string (see createWorkOrder), not a joined entity.
function ServiceBaysPanel() {
  const t = useTranslations('Logistics');
  const { serviceBays, createServiceBay, deleteServiceBay } = useServiceBays();
  const [name, setName] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.serviceBays')}</p>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.serviceBayName')}
          className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={() => { if (name.trim()) { createServiceBay(name.trim()); setName(''); } }} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> {t('common.add')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {serviceBays.map((sb) => (
          <span key={sb._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {sb.name}
            <button onClick={() => deleteServiceBay(sb._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Read-only check that the "Logistics Expense" account (maintenance/fuel/delivery costs)
// is actually mapped in Accounting — same account-mapping-status idea as Accounting's own
// Settings tab, scoped to just the one systemKey this module depends on. Reuses the
// existing Chart of Accounts read endpoint rather than adding a new one.
function AccountingIntegrationPanel() {
  const t = useTranslations('Logistics');
  const locale = useLocale();
  const [status, setStatus] = useState<'loading' | 'mapped' | 'unmapped'>('loading');

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/accounting/chart-of-accounts`, showToast: false,
      thenFn: (r) => {
        const accounts = r.data ?? [];
        setStatus(accounts.some((a: any) => a.systemKey === 'logistics_expense') ? 'mapped' : 'unmapped');
      },
      catchFn: () => setStatus('unmapped'),
    });
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.accountingIntegration')}</p>
      <p className="text-xs text-slate-400">{t('settings.accountingIntegrationHint')}</p>
      {status === 'loading' ? null : status === 'mapped' ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {t('settings.accountingMapped')}</p>
      ) : (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm text-red-500"><AlertTriangle className="h-4 w-4" /> {t('settings.accountingUnmapped')}</p>
          <Link href={`/${locale}/accounting?tab=settings`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-brand-primary/30 text-brand-primary text-xs font-semibold hover:bg-brand-primary/5">
            {t('settings.goToAccountingSettings')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <VehicleTypesPanel />
      <ServiceBaysPanel />
      <AccountingIntegrationPanel />
    </div>
  );
}
