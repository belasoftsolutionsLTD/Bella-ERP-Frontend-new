'use client';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { LeaveRequestTable } from '../Components/LeaveRequestTable';
import { LeaveCalendar } from '../Components/LeaveCalendar';
import { LogLeaveModal } from '../Components/LogLeaveModal';
import { useLeave } from '../Hooks/useLeave';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

type Tab = 'requests' | 'calendar';

const LEAVE_TYPES = ['annual','sick','maternity','paternity','unpaid','emergency'];
const STATUSES    = ['pending','approved','rejected','disputed'];
const DEPARTMENTS = ['Lower Primary','Upper Primary','Junior Secondary','Senior Secondary','Administration','Finance','ICT','Library','Games and Sports','Guidance and Counselling'];

export default function LeavePage() {
  const t = useTranslations('Leave');
  const [tab, setTab]       = useState<Tab>('requests');
  const [showLog, setShowLog] = useState(false);
  const { requests, loading, error, refetch, approve, reject, revoke, resolveDispute, deleteRequest } = useLeave();
  const [calData, setCalData] = useState({});

  // Filters
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterDept, setFilterDept]   = useState('');

  useEffect(() => {
    const now = new Date();
    apiCallFunction<any>({ url: `${API_BASE_URL}/leave/calendar`, params: { month: now.getMonth() + 1, year: now.getFullYear() }, showToast: false, thenFn: (r) => setCalData(r.data ?? {}) });
  }, []);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterType   && r.leaveType !== filterType) return false;
      if (filterDept   && r.employee?.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = r.employee?.fullName?.toLowerCase() ?? '';
        const snum = r.employee?.staffNumber?.toLowerCase() ?? '';
        if (!name.includes(q) && !snum.includes(q)) return false;
      }
      return true;
    });
  }, [requests, search, filterStatus, filterType, filterDept]);

  const hasFilters = search || filterStatus || filterType || filterDept;
  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterType(''); setFilterDept(''); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{t('title')}</h1>
        <Button variant="accent" className="gap-2" onClick={() => setShowLog(true)}>
          <Plus className="h-4 w-4" /> Log Leave
        </Button>
      </div>

      <div className="flex border-b gap-1">
        {(['requests', 'calendar'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors',
              tab === tb ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200')}>
            {tb === 'requests' ? 'Leave Requests' : t('calendar')}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by employee name or staff no…"
                className="w-full h-9 pl-9 pr-3 border border-slate-700 rounded-xl text-sm bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-9 border border-slate-700 rounded-xl px-3 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="h-9 border border-slate-700 rounded-xl px-3 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40">
              <option value="">All Types</option>
              {LEAVE_TYPES.map(lt => <option key={lt} value={lt}>{lt.charAt(0).toUpperCase() + lt.slice(1).replace('_',' ')}</option>)}
            </select>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="h-9 border border-slate-700 rounded-xl px-3 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40">
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              {filtered.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Wrapper loading={loading} error={error} onRetry={refetch}>
            <LeaveRequestTable
              requests={filtered}
              onApprove={(id, comments) => approve(id, comments)}
              onReject={(id, comments) => reject(id, comments)}
              onRevoke={(id, comments) => revoke(id, comments)}
              onResolveDispute={(id, resolution, comments) => resolveDispute(id, resolution, comments)}
              onDelete={(id) => deleteRequest(id)}
            />
          </Wrapper>
        </>
      )}

      {tab === 'calendar' && (
        <Wrapper loading={loading} error={error} onRetry={refetch}>
          <LeaveCalendar data={calData} />
        </Wrapper>
      )}

      {showLog && (
        <LogLeaveModal
          onClose={() => setShowLog(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
