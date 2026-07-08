'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, List, ClipboardList, Settings2, BarChart2, Plus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { LeaveBalance } from '../constants';

import { LeaveBalanceCards }  from '../Components/LeaveBalanceCards';
import { TodayAbsencesCard }  from '../Components/TodayAbsencesCard';
import { UpcomingTimeOffCard } from '../Components/UpcomingTimeOffCard';
import { LeaveMonthCalendar } from '../Components/LeaveMonthCalendar';
import { LeaveRequestsTab }   from '../Components/LeaveRequestsTab';
import { PoliciesTab }        from '../Components/PoliciesTab';
import { LeaveAnalyticsTab }  from '../Components/LeaveAnalyticsTab';
import { LeaveSettingsTab }   from '../Components/LeaveSettingsTab';
import { RequestTimeOffDrawer } from '../Components/RequestTimeOffDrawer';

type TabKey = 'overview' | 'calendar' | 'requests' | 'policies' | 'settings' | 'analytics';

interface TabDef {
  key:          TabKey;
  label:        string;
  icon:         React.ElementType;
  managerOnly?: boolean;
  hrOnly?:      boolean;
}

const TABS: TabDef[] = [
  { key: 'overview',   label: 'Overview',   icon: CalendarDays },
  { key: 'calendar',   label: 'Calendar',   icon: List         },
  { key: 'requests',   label: 'Requests',   icon: ClipboardList, managerOnly: true },
  { key: 'policies',   label: 'Policies',   icon: Settings2,     hrOnly:      true },
  { key: 'settings',   label: 'Leave Settings', icon: Settings2, hrOnly:      true },
  { key: 'analytics',  label: 'Analytics',  icon: BarChart2,     managerOnly: true },
];

export function LeaveManagementPage() {
  const { isHR, isDeptHead }  = useAuth();
  const isManager = isHR || isDeptHead;

  const [activeTab,    setActiveTab]    = useState<TabKey>('overview');
  const [balances,     setBalances]     = useState<LeaveBalance[]>([]);
  const [showRequest,  setShowRequest]  = useState(false);
  const [balanceKey,   setBalanceKey]   = useState(0);

  const fetchBalances = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/balances/me`,
      showToast: false,
      thenFn: r => setBalances(Array.isArray(r.data) ? r.data : []),
    });
  }, []);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const visibleTabs = TABS.filter(t => {
    if (t.hrOnly      && !isHR)      return false;
    if (t.managerOnly && !isManager) return false;
    return true;
  });

  const handleRequestSuccess = () => {
    fetchBalances();
    setBalanceKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-800 to-violet-900/40 border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Leave Management</h1>
              <p className="text-sm text-slate-400 mt-0.5">Manage leave requests, balances, and policies</p>
            </div>

            <div className="flex items-center gap-3">
              {isHR && (
                <a href={`${API_BASE_URL}/leave/requests/export`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors">
                  <Download className="h-4 w-4" /> Export
                </a>
              )}
              <button onClick={() => setShowRequest(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-900/40">
                <Plus className="h-4 w-4" /> Request Time Off
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-5 overflow-x-auto pb-0.5 scrollbar-none">
            {visibleTabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all border-b-2',
                  activeTab === key
                    ? 'text-indigo-300 border-indigo-500 bg-slate-900/60'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/40',
                )}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Balance cards */}
            <LeaveBalanceCards key={balanceKey} balances={balances} />

            {/* Two-column grid for manager cards */}
            {isManager ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TodayAbsencesCard />
                <UpcomingTimeOffCard />
              </div>
            ) : (
              <UpcomingTimeOffCard />
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <LeaveMonthCalendar isManager={isManager} />
        )}

        {activeTab === 'requests' && isManager && (
          <LeaveRequestsTab isManager={isManager} isHR={isHR} />
        )}

        {activeTab === 'policies' && isHR && (
          <PoliciesTab />
        )}

        {activeTab === 'settings' && isHR && (
          <LeaveSettingsTab />
        )}

        {activeTab === 'analytics' && isManager && (
          <LeaveAnalyticsTab />
        )}
      </div>

      {/* Request Time Off modal */}
      {showRequest && (
        <RequestTimeOffDrawer
          balances={balances}
          onClose={() => setShowRequest(false)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}
