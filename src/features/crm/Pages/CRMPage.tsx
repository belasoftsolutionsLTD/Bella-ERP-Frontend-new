'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldAlert, Kanban, Users, Building2, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrmAccess } from '../Hooks/useCrmAccess';
import { PipelineBoard } from '../Components/PipelineBoard';
import { ContactsTab } from '../Components/ContactsTab';
import { CompaniesTab } from '../Components/CompaniesTab';
import { TasksTab } from '../Components/TasksTab';
import { ReportsTab } from '../Components/ReportsTab';
import { SettingsTab } from '../Components/SettingsTab';

const TABS = [
  { id: 'pipeline', icon: Kanban },
  { id: 'contacts', icon: Users },
  { id: 'companies', icon: Building2 },
  { id: 'tasks', icon: CheckSquare },
  { id: 'reports', icon: BarChart3 },
  { id: 'settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export function CRMPage() {
  const t = useTranslations('CRM');
  const searchParams = useSearchParams();
  const { level, isLoading } = useCrmAccess();
  const [tab, setTab] = useState<TabId>('pipeline');

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
    if (x.id === 'reports') return level === 'admin' || level === 'manager';
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-900">{t('nav.title')}</h1>

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
        {tab === 'pipeline' && <PipelineBoard level={level} />}
        {tab === 'contacts' && <ContactsTab />}
        {tab === 'companies' && <CompaniesTab />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'reports' && (level === 'admin' || level === 'manager') && <ReportsTab />}
        {tab === 'settings' && level === 'admin' && <SettingsTab />}
      </div>
    </div>
  );
}
