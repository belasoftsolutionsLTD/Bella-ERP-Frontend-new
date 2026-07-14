'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'executive', label: 'Executive', href: '' },
  { key: 'workforce', label: 'Workforce', href: '/workforce' },
  { key: 'payroll', label: 'Payroll', href: '/payroll' },
  { key: 'leave', label: 'Leave', href: '/leave' },
  { key: 'attendance', label: 'Attendance', href: '/attendance' },
  { key: 'performance', label: 'Performance', href: '/performance' },
  { key: 'recruitment', label: 'Recruitment', href: '/recruitment' },
  { key: 'training', label: 'Training', href: '/training' },
  { key: 'spend', label: 'Spend', href: '/spend' },
  { key: 'insights', label: 'Insights', href: '/insights' },
  { key: 'custom', label: 'Custom Reports', href: '/custom' },
] as const;

export function ReportsNav({ active }: { active: string }) {
  const locale = useLocale();
  return (
    <div className="flex gap-1 bg-brand-bg-soft/60 border border-brand-border rounded-xl p-1 overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/${locale}/reports${tab.href}`}
          className={cn(
            'shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            active === tab.key ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted/50',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
