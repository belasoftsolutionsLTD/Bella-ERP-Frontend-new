'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Check, XCircle, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadFile } from '@/functions/downloadFile';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveColor, LEAVE_TYPE_LABELS, STATUS_CFG } from '../constants';
import type { LeaveRequest } from '../constants';
import { RequestDetailDrawer } from './RequestDetailDrawer';

interface Props {
  isManager?: boolean;
  isHR?: boolean;
}

const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'study', 'emergency'];
const DEPARTMENTS = ['Lower Primary','Upper Primary','Junior Secondary','Senior Secondary','Administration','Finance','ICT','Library'];

export function LeaveRequestsTab({ isManager, isHR }: Props) {
  const [requests,  setRequests]  = useState<LeaveRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [dept,      setDept]      = useState('');
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [detail,    setDetail]    = useState<string | null>(null);
  const [menuOpen,  setMenuOpen]  = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status)    params.status = status;
    if (leaveType) params.leaveType = leaveType;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests`,
      params,
      showToast: false,
      thenFn: r => setRequests(r.data?.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [status, leaveType]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = useMemo(() => requests.filter(r => {
    if (dept && r.employee?.department !== dept) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.employee?.fullName?.toLowerCase().includes(q) && !r.employee?.staffNumber?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [requests, search, dept]);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r._id));
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(filtered.map(r => r._id)));

  const doApprove = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/approve`,
      method: 'PUT',
      data: {},
      thenFn: () => fetchRequests(),
    });
  };

  const doDecline = (id: string, reason = '') => {
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}/decline`,
      method: 'PUT',
      data: { comments: reason || 'Declined by manager' },
      thenFn: () => fetchRequests(),
    });
  };

  const doDelete = (id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${id}`,
      method: 'DELETE',
      thenFn: () => fetchRequests(),
    });
  };

  const bulkApprove = () => {
    selected.forEach(id => doApprove(id));
    setSelected(new Set());
  };
  const bulkDecline = () => {
    selected.forEach(id => doDecline(id));
    setSelected(new Set());
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>

        {[
          { value: status,    set: setStatus,    opts: STATUSES,    placeholder: 'All Statuses' },
          { value: leaveType, set: setLeaveType, opts: LEAVE_TYPES, placeholder: 'All Types'   },
        ].map(({ value, set, opts, placeholder }, i) => (
          <select key={i} value={value} onChange={e => set(e.target.value)}
            className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        ))}

        {isHR && (
          <select value={dept} onChange={e => setDept(e.target.value)}
            className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        {(search || status || leaveType || dept) && (
          <button onClick={() => { setSearch(''); setStatus(''); setLeaveType(''); setDept(''); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <span className="text-xs text-slate-600 ml-auto">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>

        {isHR && (
          <button onClick={() => downloadFile(`${API_BASE_URL}/leave/requests/export`, 'leave-requests.csv').catch(err => alert(err.message))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        )}
      </div>

      {/* Bulk actions floating bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl px-5 py-3">
          <span className="text-sm font-semibold text-slate-200">{selected.size} selected</span>
          <div className="h-4 w-px bg-slate-700" />
          <button onClick={bulkApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
            <Check className="h-3.5 w-3.5" /> Approve All
          </button>
          <button onClick={bulkDecline} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
            <XCircle className="h-3.5 w-3.5" /> Decline All
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_120px_100px_100px_60px_100px_80px] border-b border-slate-700 bg-slate-800/60">
          <div className="px-3 py-2.5 flex items-center">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="accent-indigo-500 h-3.5 w-3.5 rounded" />
          </div>
          {['Employee', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Actions'].map(h => (
            <div key={h} className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-slate-400 text-sm font-semibold">No leave requests found</p>
            <p className="text-slate-600 text-xs">Requests submitted by employees will appear here.</p>
          </div>
        ) : (
          filtered.map(req => {
            const color  = leaveColor(req.leaveType);
            const label  = req.leaveTypeName ?? LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType;
            const stCfg  = STATUS_CFG[req.status] ?? STATUS_CFG.pending;
            const initials = (req.employee?.fullName ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const isSel  = selected.has(req._id);

            return (
              <div key={req._id}
                className={cn('grid grid-cols-[32px_1fr_120px_100px_100px_60px_100px_80px] border-b border-slate-700/60 transition-colors cursor-pointer',
                  isSel ? 'bg-indigo-500/5' : 'hover:bg-slate-800/30')}
                onClick={() => setDetail(req._id)}>

                <div className="px-3 py-3 flex items-center" onClick={e => { e.stopPropagation(); toggleSelect(req._id); }}>
                  <input type="checkbox" checked={isSel} onChange={() => toggleSelect(req._id)}
                    className="accent-indigo-500 h-3.5 w-3.5 rounded" />
                </div>

                <div className="px-3 py-3 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: color + '25', color }}>{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{req.employee?.fullName ?? 'Employee'}</p>
                    {req.employee?.department && <p className="text-[10px] text-slate-500 truncate">{req.employee.department}</p>}
                  </div>
                </div>

                <div className="px-3 py-3 flex items-center">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '20', color }}>{label}</span>
                </div>
                <div className="px-3 py-3 flex items-center text-xs text-slate-400">{fmtDate(req.startDate)}</div>
                <div className="px-3 py-3 flex items-center text-xs text-slate-400">{fmtDate(req.endDate)}</div>
                <div className="px-3 py-3 flex items-center text-sm font-bold text-slate-200">{req.numberOfDays ?? req.totalDays}</div>

                <div className="px-3 py-3 flex items-center">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', stCfg.darkBg, stCfg.darkText)}>
                    {stCfg.label}
                  </span>
                </div>

                <div className="px-3 py-3 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {isManager && req.status === 'pending' && (
                    <>
                      <button onClick={() => doApprove(req._id)}
                        className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => doDecline(req._id)}
                        className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors" title="Decline">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === req._id ? null : req._id)}
                      className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen === req._id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                        <button onClick={() => { setDetail(req._id); setMenuOpen(null); }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 transition-colors">View details</button>
                        {isHR && (
                          <button onClick={() => { doDelete(req._id); setMenuOpen(null); }}
                            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail drawer */}
      {detail && (
        <RequestDetailDrawer
          requestId={detail}
          onClose={() => setDetail(null)}
          onApprove={doApprove}
          onDecline={doDecline}
          isManager={isManager}
          isHR={isHR}
          onUpdated={fetchRequests}
        />
      )}
    </div>
  );
}
