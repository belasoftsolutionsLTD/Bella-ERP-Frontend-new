'use client';

import { useState } from 'react';
import { Target, ClipboardList, MessageSquare, LayoutGrid, BarChart2, FileText, Users2, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GoalsTab }       from '../Components/GoalsTab';
import { ReviewsTab }     from '../Components/ReviewsTab';
import { FeedbackTab }    from '../Components/FeedbackTab';
import { CalibrationTab } from '../Components/CalibrationTab';
import { AnalyticsTab }   from '../Components/AnalyticsTab';
import { TemplatesTab }   from '../Components/TemplatesTab';
import { OneOnOnesTab }   from '../Components/OneOnOnesTab';
import { PIPsTab }        from '../Components/PIPsTab';

type Tab = 'goals' | 'reviews' | 'oneOnOnes' | 'pips' | 'feedback' | 'templates' | 'calibration' | 'analytics';

const TABS: { key: Tab; label: string; icon: React.ElementType; hrOnly?: boolean }[] = [
  { key: 'goals',       label: 'Goals',       icon: Target       },
  { key: 'reviews',     label: 'Reviews',     icon: ClipboardList },
  { key: 'oneOnOnes',   label: '1-on-1s',     icon: Users2       },
  { key: 'pips',        label: 'Improvement Plans', icon: AlertTriangle },
  { key: 'feedback',    label: 'Feedback',    icon: MessageSquare },
  { key: 'templates',   label: 'Templates',   icon: FileText,     hrOnly: true },
  { key: 'calibration', label: 'Calibration', icon: LayoutGrid,   hrOnly: true },
  { key: 'analytics',   label: 'Analytics',   icon: BarChart2,    hrOnly: true },
];

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const { isHR } = useAuth();

  const visibleTabs = TABS.filter(t => !t.hrOnly || isHR);

  return (
    <div className="flex flex-col h-full gap-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-indigo-900 p-5 flex items-center justify-between gap-6 shrink-0 border border-brand-border shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text">Performance</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Track goals, reviews, and team development</p>
        </div>
        {isHR && (
          <button
            onClick={() => setActiveTab('reviews')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors shadow-md shrink-0"
          >
            <Plus className="h-4 w-4" /> Start Review Cycle
          </button>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-brand-bg-soft/60 border border-brand-border rounded-xl p-1 shrink-0">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted/50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'goals'       && <GoalsTab />}
        {activeTab === 'reviews'     && <ReviewsTab isHR={isHR} />}
        {activeTab === 'oneOnOnes'   && <OneOnOnesTab />}
        {activeTab === 'pips'        && <PIPsTab />}
        {activeTab === 'feedback'    && <FeedbackTab />}
        {activeTab === 'templates'   && isHR && <TemplatesTab />}
        {activeTab === 'calibration' && isHR && <CalibrationTab />}
        {activeTab === 'analytics'   && isHR && <AnalyticsTab />}
      </div>
    </div>
  );
}
