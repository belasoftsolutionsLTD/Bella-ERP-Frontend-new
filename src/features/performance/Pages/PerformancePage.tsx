'use client';

import { useState } from 'react';
import { Target, ClipboardList, MessageSquare, LayoutGrid, BarChart2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GoalsTab }       from '../Components/GoalsTab';
import { ReviewsTab }     from '../Components/ReviewsTab';
import { FeedbackTab }    from '../Components/FeedbackTab';
import { CalibrationTab } from '../Components/CalibrationTab';
import { AnalyticsTab }   from '../Components/AnalyticsTab';

type Tab = 'goals' | 'reviews' | 'feedback' | 'calibration' | 'analytics';

const TABS: { key: Tab; label: string; icon: React.ElementType; hrOnly?: boolean }[] = [
  { key: 'goals',       label: 'Goals',       icon: Target       },
  { key: 'reviews',     label: 'Reviews',     icon: ClipboardList },
  { key: 'feedback',    label: 'Feedback',    icon: MessageSquare },
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
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800 to-indigo-900 p-5 flex items-center justify-between gap-6 shrink-0 border border-slate-700 shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Performance</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track goals, reviews, and team development</p>
        </div>
        {isHR && (
          <button
            onClick={() => setActiveTab('reviews')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-md shrink-0"
          >
            <Plus className="h-4 w-4" /> Start Review Cycle
          </button>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700 rounded-xl p-1 shrink-0">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
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
        {activeTab === 'feedback'    && <FeedbackTab />}
        {activeTab === 'calibration' && isHR && <CalibrationTab />}
        {activeTab === 'analytics'   && isHR && <AnalyticsTab />}
      </div>
    </div>
  );
}
