'use client';
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import type { LeaveBalance, LeaveRequest } from '../../leave/types';

const LEAVE_COLORS = [
  'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-fuchsia-500 to-violet-600',
];

export function LeaveTab({ employeeId }: { employeeId: string }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiCallFunction<any>({ url: `${API_BASE_URL}/leave/balances/${employeeId}`, showToast: false,
        thenFn: (r) => setBalances(r.data ?? []) }),
      apiCallFunction<any>({ url: `${API_BASE_URL}/leave/requests`, params: { employeeId, limit: 20 }, showToast: false,
        thenFn: (r) => setRequests(r.data?.data ?? []) }),
    ]).catch(() => setError('Failed to load leave records.')).finally(() => setLoading(false));
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Wrapper loading={loading} error={error} onRetry={fetch}>
      <div className="space-y-6">
        {balances.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Leave Balances</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {balances.map((b, i) => (
                <div key={b._id} className={cn('rounded-xl bg-gradient-to-br p-4 text-white shadow-sm', LEAVE_COLORS[i % LEAVE_COLORS.length])}>
                  <p className="text-xs font-semibold text-white/70">{b.leaveType?.name ?? 'Leave'}</p>
                  <p className="text-3xl font-bold mt-1">{b.closingBalance}</p>
                  <p className="text-xs text-white/60 mt-0.5">days remaining</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {requests.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Recent Leave Requests</h4>
            <div className="space-y-2">
              {requests.slice(0, 10).map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium">{r.leaveType?.name ?? 'Leave'}</span>
                  <span className="text-xs text-foreground/40">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</span>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                    r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700')}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {balances.length === 0 && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-2">
            <CalendarDays className="h-10 w-10" />
            <p className="text-sm">No leave records found.</p>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
