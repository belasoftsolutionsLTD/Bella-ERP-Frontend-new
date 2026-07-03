'use client';

import { useState } from 'react';
import { Clock, CalendarDays, BarChart2, Settings, Users, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ClockInWidget } from '../Components/ClockInWidget';
import { TeamStatusCard } from '../Components/TeamStatusCard';
import { TimesheetsTab } from '../Components/TimesheetsTab';
import { ShiftsTab } from '../Components/ShiftsTab';
import { AttendanceReportTab } from '../Components/AttendanceReportTab';
import { SettingsTab } from '../Components/SettingsTab';

type TabKey = 'overview' | 'timesheets' | 'shifts' | 'report' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  managerOnly?: boolean;
  hrOnly?: boolean;
}

const TABS: TabDef[] = [
  { key: 'overview',   label: 'Overview',    icon: Clock          },
  { key: 'timesheets', label: 'Timesheets',  icon: CalendarDays   },
  { key: 'shifts',     label: 'Shifts',      icon: Layers         },
  { key: 'report',     label: 'Report',      icon: BarChart2,     managerOnly: true },
  { key: 'settings',   label: 'Settings',    icon: Settings,      hrOnly: true      },
];

export default function AttendancePage() {
  const { isHR, isDeptHead } = useAuth();
  const isManager = isHR || isDeptHead;
  const [tab, setTab] = useState<TabKey>('overview');

  const visibleTabs = TABS.filter(t => {
    if (t.hrOnly)      return isHR;
    if (t.managerOnly) return isManager;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-emerald-900/40 border-b border-slate-700">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Clock className="h-6 w-6 text-emerald-400" />
                Shift & Time
              </h1>
              <p className="text-sm text-slate-400 mt-1">Track time, manage schedules, and review attendance records.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
            {visibleTabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all',
                  tab === t.key
                    ? 'bg-slate-900 text-emerald-400 border-t border-x border-slate-700'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50',
                )}>
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
        {tab === 'overview' && (
          <div className={cn('grid gap-6', isManager ? 'lg:grid-cols-2' : 'max-w-lg mx-auto')}>
            {/* Clock-in widget */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> My Attendance
              </p>
              <ClockInWidget />
            </div>

            {/* Team status (HR/manager only) */}
            {isManager && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Team Today
                </p>
                <TeamStatusCard />
              </div>
            )}
          </div>
        )}

        {tab === 'timesheets' && (
          <TimesheetsTab />
        )}

        {tab === 'shifts' && (
          <ShiftsTab isManager={isManager} />
        )}

        {tab === 'report' && isManager && (
          <AttendanceReportTab />
        )}

        {tab === 'settings' && isHR && (
          <SettingsTab />
        )}
      </div>
    </div>
  );
}
