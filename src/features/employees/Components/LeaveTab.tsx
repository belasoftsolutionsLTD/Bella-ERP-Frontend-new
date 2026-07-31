'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, FileDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { Wrapper } from '@/components/custom-ui/Wrapper';
import { generateLeaveHistoryReport } from '../../leave/reportGenerator';
import type { LeaveBalance, LeaveRequest } from '../../leave/types';

const LEAVE_COLORS = [
  'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-fuchsia-500 to-violet-600',
];

export function LeaveTab({ employeeId, employeeName, staffNumber }: { employeeId: string; employeeName?: string; staffNumber?: string }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportUri, setReportUri] = useState<string | null>(null);

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

  const generateReport = async () => {
    setGenerating(true);
    try {
      setReportUri(await generateLeaveHistoryReport({ employeeId, employeeName, staffNumber }));
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Wrapper loading={loading} error={error} onRetry={fetch}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={generateReport} disabled={generating}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors disabled:opacity-50">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>

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

      {reportUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportUri(null)} />
          <div className="relative z-10 w-full max-w-2xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-800">Leave History Report{employeeName ? ` — ${employeeName}` : ''}</p>
              <button onClick={() => setReportUri(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <iframe src={reportUri} title="Leave History Report" className="flex-1 w-full border-0" />
          </div>
        </div>
      )}
    </Wrapper>
  );
}
